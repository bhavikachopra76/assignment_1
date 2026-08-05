import time
from datetime import datetime, timedelta, timezone

from fastapi import BackgroundTasks, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import schemas
from config import ALLOWED_TYPES, settings
from database import supabase
from ingest import run_ingest
from rag import answer_question

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


class Question(BaseModel):
    question: str
    session_id: str | None = None


@app.get("/")
def root():
    return {"status": "ok", "docs": "/docs"}


@app.get("/api/documents")
def list_documents():
    rows = supabase.table("documents").select("*").order("uploaded_at", desc=True).execute().data
    return [schemas.document(row) for row in rows]


@app.post("/api/documents/upload")
def upload_documents(background: BackgroundTasks, files: list[UploadFile] = File(...)):
    for file in files:
        if file_type_of(file.filename) not in ALLOWED_TYPES:
            raise HTTPException(400, f"{file.filename} must be a PDF, DOCX or TXT file")

    created = []
    for file in files:
        file_type = file_type_of(file.filename)
        content = file.file.read()

        row = supabase.table("documents").insert({
            "filename": file.filename,
            "file_type": file_type,
            "size_bytes": len(content),
            "status": "processing",
        }).execute().data[0]

        background.add_task(run_ingest, row["id"], file.filename, file_type, content)
        created.append(row)

    return [schemas.document(row) for row in created]


@app.get("/api/documents/{document_id}/status")
def document_status(document_id: str):
    return schemas.document(get_document(document_id))


@app.delete("/api/documents/{document_id}")
def delete_document(document_id: str):
    get_document(document_id)

    bucket = supabase.storage.from_(settings.supabase_bucket)
    files = bucket.list(document_id)
    if files:
        bucket.remove([f"{document_id}/{file['name']}" for file in files])
    supabase.table("documents").delete().eq("id", document_id).execute()
    return {"deleted": document_id}


@app.post("/api/chat")
def chat(body: Question):
    question = body.question.strip()
    if not question:
        raise HTTPException(400, "Question cannot be empty")

    history = recent_history(body.session_id) if body.session_id else ""

    started = time.time()
    try:
        answer, citations = answer_question(question, history)
    except Exception as e:
        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
            raise HTTPException(503, "Too many requests to the AI service right now. Try again in a minute.")
        raise
    latency = int((time.time() - started) * 1000)

    session_id = body.session_id or start_session(question)
    save_message(session_id, "user", question)
    message = save_message(session_id, "assistant", answer)
    query = supabase.table("queries").insert({
        "session_id": session_id,
        "question": question,
        "answer": answer,
        "latency_ms": latency,
    }).execute().data[0]

    saved = []
    if citations:
        rows = [dict(c, query_id=query["id"], message_id=message["id"]) for c in citations]
        saved = supabase.table("citations").insert(rows).execute().data

    supabase.table("chat_sessions").update({
        "last_active_at": now(),
    }).eq("id", session_id).execute()

    return {
        "sessionId": session_id,
        "message": schemas.message(message, [schemas.citation(c) for c in saved]),
    }


@app.get("/api/chat/sessions")
def list_sessions():
    rows = (supabase.table("chat_sessions").select("*")
            .order("last_active_at", desc=True).limit(20).execute().data)
    return [schemas.session(row) for row in rows]


@app.delete("/api/chat/sessions/{session_id}")
def delete_session(session_id: str):
    rows = supabase.table("chat_sessions").select("id").eq("id", session_id).execute().data
    if not rows:
        raise HTTPException(404, "Chat not found")

    supabase.table("chat_sessions").delete().eq("id", session_id).execute()
    return {"deleted": session_id}


@app.get("/api/chat/sessions/{session_id}/messages")
def session_messages(session_id: str):
    rows = (supabase.table("messages").select("*")
            .eq("session_id", session_id).order("created_at").execute().data)
    if not rows:
        return []

    cited = (supabase.table("citations").select("*")
             .in_("message_id", [r["id"] for r in rows]).execute().data)

    by_message = {}
    for row in cited:
        by_message.setdefault(row["message_id"], []).append(schemas.citation(row))

    return [schemas.message(row, by_message.get(row["id"], [])) for row in rows]


@app.get("/api/dashboard/stats")
def dashboard_stats():
    documents = supabase.table("documents").select("chunk_count,uploaded_at").execute().data
    queries = supabase.table("queries").select("latency_ms,created_at").execute().data

    latencies = [q["latency_ms"] for q in queries if q["latency_ms"]]
    average = sum(latencies) / len(latencies) / 1000 if latencies else 0

    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    today = datetime.now(timezone.utc).date().isoformat()
    new_documents = [d for d in documents if d["uploaded_at"] > week_ago]
    todays_queries = [q for q in queries if q["created_at"][:10] == today]

    return {
        "totalDocuments": len(documents),
        "totalChunks": sum(d["chunk_count"] or 0 for d in documents),
        "totalQuestions": len(queries),
        "avgResponseTime": f"{average:.1f}s",
        "documentGrowth": f"+{len(new_documents)} this week",
        "chunkGrowth": f"+{sum(d['chunk_count'] or 0 for d in new_documents)} chunks",
        "questionGrowth": f"+{len(todays_queries)} today",
        "timeTrend": f"over {len(latencies)} queries",
    }


@app.get("/api/dashboard/queries")
def dashboard_queries():
    rows = recent_queries()
    return [{
        "id": row["id"],
        "question": row["question"],
        "time": schemas.ago(row["created_at"]),
        "status": row["status"].capitalize(),
        "latency": f"{(row['latency_ms'] or 0) / 1000:.1f}s",
    } for row in rows]


@app.get("/api/dashboard/responses")
def dashboard_responses():
    rows = recent_queries()
    if not rows:
        return []

    cited = (supabase.table("citations").select("query_id,document_name,page_number")
             .in_("query_id", [r["id"] for r in rows]).execute().data)

    first = {}
    for row in cited:
        first.setdefault(row["query_id"], row)

    return [{
        "id": row["id"],
        "question": row["question"],
        "answer": row["answer"],
        "source": source_label(first.get(row["id"])),
        "timestamp": row["created_at"],
    } for row in rows]


def get_document(document_id):
    rows = supabase.table("documents").select("*").eq("id", document_id).execute().data
    if not rows:
        raise HTTPException(404, "Document not found")
    return rows[0]


def file_type_of(filename):
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def start_session(question):
    title = question[:60]
    return supabase.table("chat_sessions").insert({"title": title}).execute().data[0]["id"]


def save_message(session_id, role, content):
    return supabase.table("messages").insert({
        "session_id": session_id,
        "role": role,
        "content": content,
    }).execute().data[0]


def recent_history(session_id, limit=6):
    rows = (supabase.table("messages").select("role,content")
            .eq("session_id", session_id).order("created_at", desc=True)
            .limit(limit).execute().data)
    rows.reverse()
    return "\n".join(f"{r['role']}: {r['content']}" for r in rows)


def recent_queries(limit=50):
    return (supabase.table("queries").select("*")
            .order("created_at", desc=True).limit(limit).execute().data)


def source_label(citation):
    if not citation:
        return "-"
    name = citation["document_name"]
    return f"{name} (Page {citation['page_number']})" if citation["page_number"] else name


def now():
    return datetime.now(timezone.utc).isoformat()
