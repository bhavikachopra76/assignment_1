# API Documentation

REST API for the NexaCore Document Intelligence platform.

| | |
| :--- | :--- |
| **Base URL** | `https://docintel-7vvc.onrender.com` |
| **Interactive docs** | [`/docs`](https://docintel-7vvc.onrender.com/docs) (Swagger UI) · [`/redoc`](https://docintel-7vvc.onrender.com/redoc) |
| **Machine-readable spec** | [`/openapi.json`](https://docintel-7vvc.onrender.com/openapi.json) |
| **Local** | `http://localhost:8000` |

The Swagger page is executable — you can upload a document and ask a question from the
browser without writing any client code.

> The API is hosted on Render's free tier and spins down after 15 minutes of inactivity.
> The first request after an idle period takes 50–60 seconds while the server wakes.

---

## Conventions

- All responses are JSON. Request bodies are JSON except the upload endpoint, which is
  `multipart/form-data`.
- Response fields are **camelCase**, while the underlying database columns are
  snake_case. `schemas.py` does that translation, so `file_type` becomes `type` and
  `uploaded_at` becomes `uploadDate`.
- Timestamps are ISO 8601 UTC. `uploadDate` is date-only (`YYYY-MM-DD`).
- Sizes, latencies and relative times are **pre-formatted strings** built for display
  (`"41 KB"`, `"1.8s"`, `"5 min ago"`), not raw numbers.
- **There is no authentication.** Every endpoint is public. This is a known limitation —
  the service is scoped as a single-tenant demo, and an API key layer or Supabase Auth
  would be the first addition before any real deployment.

---

## Endpoints

| Method | Path | Purpose |
| :--- | :--- | :--- |
| `GET` | `/` | Health check |
| `GET` | `/api/documents` | List all documents |
| `POST` | `/api/documents/upload` | Upload one or more documents |
| `GET` | `/api/documents/{document_id}/status` | Check ingestion progress |
| `DELETE` | `/api/documents/{document_id}` | Delete a document |
| `POST` | `/api/chat` | Ask a question |
| `GET` | `/api/chat/sessions` | List recent chat sessions |
| `GET` | `/api/chat/sessions/{session_id}/messages` | Get messages in a session |
| `DELETE` | `/api/chat/sessions/{session_id}` | Delete a chat session |
| `GET` | `/api/dashboard/stats` | Overall usage statistics |
| `GET` | `/api/dashboard/queries` | Recent questions |
| `GET` | `/api/dashboard/responses` | Recent answers with sources |

---

## Health

### `GET /`

```json
{ "status": "ok", "docs": "/docs" }
```

---

## Documents

### `GET /api/documents`

All uploaded documents, newest first.

```json
[
  {
    "id": "5d36f10e-80e3-49fb-8e54-6225fbabae64",
    "filename": "NexaCore_Travel_Policy.docx",
    "type": "DOCX",
    "size": "41 KB",
    "pages": null,
    "chunks": 76,
    "uploadDate": "2026-08-04",
    "status": "Indexed",
    "stage": "done",
    "author": "NexaCore HR",
    "error": null
  }
]
```

`pages` is `null` for DOCX and TXT — only PDFs carry page numbers, which is also why
some citations show a page and others don't.

---

### `POST /api/documents/upload`

Uploads one or more files. Content type `multipart/form-data`, field name `files`,
repeated once per file.

Accepted extensions: **pdf**, **docx**, **txt**.

```bash
curl -X POST https://docintel-7vvc.onrender.com/api/documents/upload \
  -F "files=@NexaCore_Travel_Policy.docx" \
  -F "files=@NexaCore_Employee_Handbook.pdf"
```

**200** — returns immediately, before indexing has run:

```json
[
  {
    "id": "8c1f2b40-1d3e-4a77-9f21-6b0c5d2e7a13",
    "filename": "NexaCore_Travel_Policy.docx",
    "type": "DOCX",
    "size": "41 KB",
    "pages": null,
    "chunks": 0,
    "uploadDate": "2026-08-05",
    "status": "Processing",
    "stage": null,
    "author": null,
    "error": null
  }
]
```

The response arrives before the document is searchable. Parsing, chunking and embedding
run in the background — poll the status endpoint below.

**400** — if *any* file has an unsupported extension, the whole request is rejected and
nothing is uploaded:

```json
{ "detail": "notes.pptx must be a PDF, DOCX or TXT file" }
```

---

### `GET /api/documents/{document_id}/status`

Same shape as a single document from the list endpoint. Poll this while `status` is
`Processing`.

**Ingestion lifecycle:**

| `status` | `stage` | Meaning |
| :--- | :--- | :--- |
| `Processing` | `reading` | Extracting text from the file |
| `Processing` | `markdown` | Saving the extracted Markdown |
| `Processing` | `chunking` | Splitting into passages |
| `Processing` | `embedding` | Generating vectors |
| `Processing` | `saving` | Writing chunks to the database |
| `Indexed` | `done` | Ready to query |
| `Failed` | *(last stage reached)* | `error` holds the reason |

The document only becomes searchable at `Indexed`.

**404** — `{ "detail": "Document not found" }`

---

### `DELETE /api/documents/{document_id}`

Removes the stored files and the database row. Chunks are removed by cascade.

```json
{ "deleted": "5d36f10e-80e3-49fb-8e54-6225fbabae64" }
```

Citations that referenced this document keep their stored quote and document name, so
previously given answers stay readable in the dashboard.

**404** — `{ "detail": "Document not found" }`

---

## Chat

### `POST /api/chat`

Answers a question using only the uploaded documents.

**Request:**

```json
{
  "question": "What is the travel expense reimbursement limit?",
  "session_id": null
}
```

| Field | Type | Required | Notes |
| :--- | :--- | :--- | :--- |
| `question` | string | yes | Cannot be empty or whitespace |
| `session_id` | string \| null | no | Omit to start a new conversation |

Pass `session_id` back on later questions to keep context. When present, the last 6
messages are used to rewrite an ambiguous follow-up ("what about international?") into a
standalone question before searching.

**200:**

```json
{
  "sessionId": "9f3c1a02-77b5-4c8e-a1d6-3e0b9c4f2a8d",
  "message": {
    "id": "b21e7d54-9a08-4f13-8c2b-5d7e1f60a934",
    "sender": "assistant",
    "text": "Employees may claim up to $75 per day for meals while travelling domestically.",
    "timestamp": "2026-08-05T11:24:03.512Z",
    "citations": [
      {
        "id": "c47a9e13-2f60-4b85-91d3-8a2c6e0f5b71",
        "documentName": "NexaCore_Travel_Policy.docx",
        "pageNumber": null,
        "section": "Meal Allowances",
        "originalParagraph": "Employees travelling domestically may claim up to $75 per day for meals."
      }
    ]
  }
}
```

`originalParagraph` is copied verbatim from the source passage, so a citation can be
checked against the original document.

If nothing relevant is found, the answer says so and `citations` is empty — the model is
instructed never to answer from outside knowledge.

**400** — `{ "detail": "Question cannot be empty" }`

**503** — upstream AI rate limit, after internal retries:

```json
{ "detail": "Too many requests to the AI service right now. Try again in a minute." }
```

> Typical response time is 3–8 seconds: question rewriting, embedding, two searches,
> reranking and generation happen in sequence. On the free tier, expect longer.

---

### `GET /api/chat/sessions`

The 20 most recently active conversations.

```json
[
  {
    "id": "9f3c1a02-77b5-4c8e-a1d6-3e0b9c4f2a8d",
    "title": "What is the travel expense reimbursement limit?",
    "lastActive": "5 min ago"
  }
]
```

`title` is the first question, truncated to 60 characters.

---

### `GET /api/chat/sessions/{session_id}/messages`

Full history for one conversation, oldest first. Same message shape as `POST /api/chat`,
with `sender` being `user` or `assistant`. User messages always have empty `citations`.

Returns `[]` for an unknown session.

---

### `DELETE /api/chat/sessions/{session_id}`

```json
{ "deleted": "9f3c1a02-77b5-4c8e-a1d6-3e0b9c4f2a8d" }
```

Messages, queries and citations for the session are removed by cascade, so its questions
also disappear from dashboard analytics.

**404** — `{ "detail": "Chat not found" }`

---

## Dashboard

### `GET /api/dashboard/stats`

```json
{
  "totalDocuments": 3,
  "totalChunks": 326,
  "totalQuestions": 7,
  "avgResponseTime": "24.2s",
  "documentGrowth": "+3 this week",
  "chunkGrowth": "+326 chunks",
  "questionGrowth": "+2 today",
  "timeTrend": "over 7 queries"
}
```

The four `*Growth` / `timeTrend` fields are display strings for the stat cards, not
values to compute with.

---

### `GET /api/dashboard/queries`

The last 50 questions.

```json
[
  {
    "id": "e83b6c19-4d2a-4f70-b5e1-9c7a3f08d264",
    "question": "What is the travel expense reimbursement limit?",
    "time": "5 min ago",
    "status": "Completed",
    "latency": "1.8s"
  }
]
```

---

### `GET /api/dashboard/responses`

The last 50 answers, each labelled with the first document it cited.

```json
[
  {
    "id": "e83b6c19-4d2a-4f70-b5e1-9c7a3f08d264",
    "question": "What is the travel expense reimbursement limit?",
    "answer": "Employees may claim up to $75 per day for meals while travelling domestically.",
    "source": "NexaCore_Travel_Policy.docx",
    "timestamp": "2026-08-05T11:24:03.512Z"
  }
]
```

`source` includes a page when one exists (`"Handbook.pdf (Page 12)"`) and is `"-"` when
the answer had no citations.

---

## Errors

Every error uses FastAPI's standard shape:

```json
{ "detail": "Document not found" }
```

| Code | When |
| :--- | :--- |
| `400` | Empty question, or an unsupported file extension |
| `404` | Document or chat session does not exist |
| `422` | Request body failed validation (missing or wrong-typed field) |
| `503` | Upstream AI rate limit, after internal retries |

Rate limits are retried before surfacing: embedding retries 5 times with 20-second
waits, generation retries 3 times backing off 10 then 20 seconds. A `503` means those
were exhausted.

Failures during ingestion never surface as HTTP errors, because upload returns before
that work runs. They appear as `status: "Failed"` with a reason in `error` on the
document.

---

## External Services

The API calls three third-party services. Their own documentation is authoritative;
this table records what each is used for.

| Service | Used for | Model / feature | Docs |
| :--- | :--- | :--- | :--- |
| **Google Vertex AI** | Embedding chunks and queries | `text-embedding-005`, 768 dimensions | [docs](https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings/get-text-embeddings) |
| **Google Vertex AI** | Question rewriting and grounded answering | `gemini-2.5-flash` with an enforced JSON response schema | [docs](https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-5-flash) |
| **Cohere** | Reranking retrieved candidates | `rerank-v3.5`, 60 candidates down to top 5 | [docs](https://docs.cohere.com/docs/rerank) |
| **Supabase** | Postgres with pgvector, plus file storage | HNSW cosine index, GIN full-text index | [docs](https://supabase.com/docs/guides/ai/vector-columns) |

Chunks are embedded with task type `RETRIEVAL_DOCUMENT` and questions with
`RETRIEVAL_QUERY` — the same model, but asymmetric task types produce better matching
between short questions and longer passages.

---

See [ARCHITECTURE.md](../ARCHITECTURE.md) for how these pieces fit together.
