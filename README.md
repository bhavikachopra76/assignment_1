# 📚 Enterprise Document Intelligence & RAG Platform

A full-stack, enterprise-grade **Retrieval-Augmented Generation (RAG)** system and analytics dashboard for ingesting, indexing, and querying corporate policy documents (PDF, DOCX, TXT) with high precision, grounded AI responses, and exact verbatim citations.

![Tech Stack](https://img.shields.io/badge/Stack-FastAPI%20%7C%20React%20%7C%20Supabase%20%7C%20Vertex%20AI-blue)
![Python](https://img.shields.io/badge/Python-3.11+-green)
![React](https://img.shields.io/badge/React-18-cyan)
![Database](https://img.shields.io/badge/Database-Supabase%20%7C%20pgvector-emerald)

---

## 🌟 Highlights & Capabilities

### 📄 1. Multi-Format Document Ingestion
- **PDF Extraction**: Parsed into per-page Markdown using `pymupdf` and `pymupdf4llm`.
- **DOCX Extraction**: Preserves paragraph heading hierarchies and converts tables directly into Markdown table syntax using `python-docx`.
- **TXT Extraction**: Automatically parses underline markers (`---`, `===`) into clean Markdown headers.

### ⚡ 2. Async Background Ingestion & Stage Tracking
- Uploading files offloads parsing, chunking, vector embedding, and storage to FastAPI `BackgroundTasks`.
- Tracks real-time ingestion stages: `reading` → `markdown` → `chunking` → `embedding` → `saving` → `done`.
- Supports full file management and cascade deletion (clears raw storage files, extracted markdown, document metadata, and chunk vectors).

### ✂️ 3. Heading-Aware & Sentence-Bounded Chunking
- Splits document text on Markdown section headings first to preserve semantic scope.
- Uses `pysbd` (Python Sentence Boundary Disambiguation) to segment text into ~600-token chunks with a 2-sentence overlap.
- Retains metadata per chunk: document ID, chunk index, page number, and section header.

### 🔀 4. Hybrid Search Engine (Dense + Sparse)
- **Dense Vector Search**: Generates 768-dimensional embeddings using Google Vertex AI `text-embedding-005` (`RETRIEVAL_DOCUMENT` for chunks, `RETRIEVAL_QUERY` for queries) and searches via PostgreSQL `pgvector` HNSW index with Cosine similarity (`match_chunks`).
- **Sparse Keyword Search**: Pre-calculates `tsvector` columns on ingestion and executes PostgreSQL GIN full-text search with English stemming and relevance ranking (`search_chunks`).
- Merges candidate results from both channels (top 30 dense + top 30 sparse).

### 🎯 5. Cohere Reranking
- Candidate chunks are re-scored using **Cohere Rerank v3.5** (`cohere.ClientV2`).
- Filters the 60 candidate chunks down to the top 5 most relevant passages before passing context to the LLM.

### 🤖 6. Contextual History Re-writing & Grounded QA
- **Follow-up Question Rewriting**: Uses Gemini 2.5 Flash to rephrase ambiguous follow-up questions into standalone queries based on past chat history.
- **Strict Grounded Generation**: Answers questions using **only** retrieved source chunks (never uses external knowledge).
- **Structured Citation Schema**: Enforces JSON response schema (`{"answer": "...", "citations": [...]}`) returning exact verbatim quotes, document titles, page numbers, and section headers.

### 📊 7. Interactive React UI & Analytics Dashboard
- **Chat Interface**: Multi-session navigation, suggestion prompts, interactive citation drawer, copy controls, and session deletion.
- **Document Management**: Document list, file size metrics, chunk counts, author metadata, live ingestion progress bar, drag-and-drop upload modal, and document deletion.
- **Analytics Dashboard**: Real-time stats cards (total docs/chunks/questions, average latency), query log table with latency timing, and AI response breakdown table showing cited sources.

---

## 🏗️ Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Frontend ["Frontend (React 18 + Vite + Tailwind CSS)"]
        UI[Sidebar & Router]
        CHAT_UI[ChatPage.jsx]
        DOCS_UI[DocumentsPage.jsx]
        DASH_UI[DashboardPage.jsx]
        API_CLIENT[lib/api.js]
    end

    subgraph Backend ["Backend (FastAPI)"]
        MAIN[main.py - REST Routing]
        INGEST[ingest.py - Async Processing]
        EXTRACT[extract.py - PyMuPDF & python-docx]
        CHUNK[chunking.py - Heading Splitter & pysbd]
        EMBED[embeddings.py - Vertex AI Embeddings]
        RAG[rag.py - Query Rewrite, Search & Gemini]
    end

    subgraph Database ["Supabase (Postgres & Storage)"]
        STORAGE[(Supabase Storage Bucket)]
        DB[(Postgres DB + pgvector + GIN FTS Index)]
    end

    subgraph CloudAI ["AI Cloud Services"]
        VERTEX[Google Vertex AI - text-embedding-005 & Gemini 2.5 Flash]
        COHERE[Cohere Rerank API - rerank-v3.5]
    end

    UI --> API_CLIENT
    API_CLIENT -->|HTTP REST| MAIN
    MAIN -->|Background Task| INGEST
    INGEST --> STORAGE
    INGEST --> EXTRACT --> CHUNK --> EMBED
    EMBED -->|Generate 768d Vectors| VERTEX
    INGEST -->|Save Chunks & Embeddings| DB

    MAIN -->|Ask Question| RAG
    RAG -->|1. Rewrite Query| VERTEX
    RAG -->|2. Vector Search - match_chunks| DB
    RAG -->|2. Keyword Search - search_chunks| DB
    RAG -->|3. Rerank Top-K Chunks| COHERE
    RAG -->|4. Structured Answer + Citations| VERTEX
```

---

## 📂 Repository File Structure

```
assignment_1/
├── backend/
│   ├── main.py              # FastAPI app routes (/api/documents, /api/chat, /api/dashboard)
│   ├── config.py            # Centralized settings & Pydantic environment validation
│   ├── database.py          # Supabase client singleton instance
│   ├── setup.sql            # SQL schema, pgvector HNSW / GIN indexes, & search RPCs
│   ├── schemas.py           # Database-to-JSON API format transformers
│   ├── extract.py           # Document text extraction (PDF, DOCX, TXT)
│   ├── chunking.py          # Heading-aware sentence segmenter & chunker
│   ├── embeddings.py       # Google Vertex AI text embedding batches
│   ├── ingest.py            # Async document ingestion background task manager
│   ├── rag.py               # Question rewriter, Hybrid Search, Cohere Rerank, & Gemini QA
│   ├── pyproject.toml       # Python dependencies configuration
│   └── README.md            # Backend quick-start guide
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main application router & persistent layout
│   │   ├── main.jsx         # React application entrypoint
│   │   ├── index.css        # Tailwind CSS directives & global styling
│   │   ├── lib/
│   │   │   └── api.js       # Centralized REST API fetch wrapper
│   │   ├── pages/
│   │   │   ├── ChatPage.jsx        # Conversational Q&A page
│   │   │   ├── DocumentsPage.jsx   # Document manager & upload page
│   │   │   └── DashboardPage.jsx   # Real-time analytics dashboard
│   │   └── components/
│   │       ├── chat/        # ChatHeader, ChatInput, Message
│   │       ├── dashboard/   # StatsCards, QueryTable, ResponseTable
│   │       ├── documents/   # DocumentTable, DeleteDialog
│   │       ├── layout/      # Sidebar
│   │       └── upload/      # UploadModal, ProcessingScreen
│   ├── package.json         # Node dependencies (React 18, Vite, Tailwind CSS)
│   ├── tailwind.config.js   # Custom dark theme configuration
│   └── vite.config.js       # Vite proxy & build configuration
│
└── README.md                # Top-level project documentation
```

---

## 🗄️ Database Schema & SQL Architecture (`setup.sql`)

### Tables
* **`documents`**: Stores uploaded file records (`id`, `filename`, `file_type`, `size_bytes`, `storage_path`, `pages`, `chunk_count`, `author`, `status`, `stage`, `error`, `uploaded_at`).
* **`chunks`**: Stores chunked text passages (`id`, `document_id`, `chunk_index`, `content`, `heading`, `page_number`, `embedding vector(768)`, `fts tsvector`).
* **`chat_sessions`**: Tracks active chat threads (`id`, `title`, `created_at`, `last_active_at`).
* **`messages`**: Chat turn history (`id`, `session_id`, `role`, `content`, `created_at`).
* **`queries`**: Performance log (`id`, `session_id`, `question`, `answer`, `latency_ms`, `status`).
* **`citations`**: Quoted citation records (`id`, `query_id`, `message_id`, `chunk_id`, `document_name`, `page_number`, `heading`, `cited_text`).

### Indexes
* **HNSW Index**: `create index on chunks using hnsw (embedding vector_cosine_ops);` for fast Approximate Nearest Neighbor vector search.
* **GIN Index**: `create index on chunks using gin (fts);` for fast PostgreSQL full-text keyword lookup.
* **Foreign Key Index**: `create index on chunks (document_id);` for instant cascade deletions.

### Stored Procedures (RPCs)
1. **`match_chunks(query_embedding vector(768), match_count int)`**: Executes Cosine Distance comparison (`1 - (c.embedding <=> query_embedding)`) returning dense semantic search matches.
2. **`search_chunks(query_text text, match_count int)`**: Executes English stemming and ranking (`ts_rank(c.fts, to_tsquery('english', query_text))`) returning sparse keyword matches.

---

## 🛠️ Environment Variables Configuration

Create a `.env` file in the `backend/` directory:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-service-role-or-anon-key
SUPABASE_BUCKET=documents

# Google Cloud Platform (Vertex AI) Configuration
GCP_PROJECT=your-gcp-project-id
GCP_REGION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=gcp-key.json

# Cohere API Configuration
COHERE_KEY=your-cohere-api-key
```

---

## 🚀 Setup & Installation Guide

### Prerequisites
- **uv**: Python package and project manager ([Install uv](https://docs.astral.sh/uv/getting-started/installation/))
- **Node.js**: 18.0 or higher
- **Supabase Account**: PostgreSQL database with `pgvector` enabled

---

### Step 1: Database Initialization
1. Log in to your **Supabase Dashboard** and open the **SQL Editor**.
2. Copy the contents of **[backend/setup.sql](file:///c:/Users/Bhavika/Downloads/assignment_1/backend/setup.sql)**.
3. Execute the query to initialize extensions, tables, indexes, and RPC functions.
4. Create a Storage Bucket named `documents` (or the name specified in your `.env`).

---

### Step 2: Backend Setup (using `uv`)

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Sync dependencies and create virtual environment automatically
uv sync

# 3. Start the FastAPI development server
uv run uvicorn main:app --reload --port 8000
```

The REST API will be running at `http://localhost:8000`.

---

### Step 3: Frontend Setup

```bash
# 1. Open a new terminal and navigate to frontend directory
cd frontend

# 2. Install Node dependencies
npm install

# 3. Start the Vite development server
npm run dev
```

The application UI will open at `http://localhost:3000`.

---

## 🌐 API Reference Overview

### Documents API
* `GET /api/documents` — Fetch list of all uploaded documents.
* `POST /api/documents/upload` — Upload files (PDF/DOCX/TXT) and trigger async background ingestion.
* `GET /api/documents/{id}/status` — Get live processing stage & status for a document.
* `DELETE /api/documents/{id}` — Delete document, its storage files, and chunk vectors.

### Chat API
* `POST /api/chat` — Submit question, execute hybrid RAG search, return answer and citations.
* `GET /api/chat/sessions` — Fetch recent 20 chat sessions.
* `GET /api/chat/sessions/{id}/messages` — Retrieve message thread and citations for a session.
* `DELETE /api/chat/sessions/{id}` — Delete a chat session and associated messages.

### Dashboard Analytics API
* `GET /api/dashboard/stats` — Aggregate metrics (total docs, total chunks, total questions, average response latency, document growth).
* `GET /api/dashboard/queries` — Recent query execution log with latency timing.
* `GET /api/dashboard/responses` — Recent AI responses paired with cited document source labels.

---
