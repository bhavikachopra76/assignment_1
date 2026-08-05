import os
import tempfile

from chunking import chunk_pages
from config import settings
from database import supabase
from embeddings import embed_documents
from extract import extract

CONTENT_TYPES = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "txt": "text/plain",
}


def run_ingest(document_id, filename, file_type, content):
    try:
        ingest(document_id, filename, file_type, content)
    except Exception as e:
        supabase.table("documents").update({
            "status": "failed",
            "error": str(e)[:500],
        }).eq("id", document_id).execute()


def ingest(document_id, filename, file_type, content):
    bucket = supabase.storage.from_(settings.supabase_bucket)
    path = f"{document_id}/{filename}"
    bucket.upload(path, content, {"content-type": CONTENT_TYPES[file_type]})

    set_stage(document_id, "reading")
    # pymupdf and python-docx both want a real file to open.
    temp_path = write_temp(content, file_type)
    try:
        pages, author, page_count = extract(temp_path, file_type)
    finally:
        os.remove(temp_path)

    set_stage(document_id, "markdown")
    markdown = "\n\n".join(text for _, text in pages)
    bucket.upload(
        f"{document_id}/extracted.md",
        markdown.encode("utf-8"),
        {"content-type": "text/markdown"},
    )

    set_stage(document_id, "chunking")
    chunks = chunk_pages(pages)

    set_stage(document_id, "embedding")
    vectors = embed_documents([c["content"] for c in chunks])

    set_stage(document_id, "saving")
    rows = [{
        "document_id": document_id,
        "chunk_index": chunk["chunk_index"],
        "content": chunk["content"],
        "heading": chunk["heading"],
        "page_number": chunk["page_number"],
        "embedding": vector,
    } for chunk, vector in zip(chunks, vectors)]

    for i in range(0, len(rows), 100):
        supabase.table("chunks").insert(rows[i:i + 100]).execute()

    supabase.table("documents").update({
        "storage_path": path,
        "pages": page_count,
        "chunk_count": len(chunks),
        "author": author,
        "status": "indexed",
        "stage": "done",
    }).eq("id", document_id).execute()


def set_stage(document_id, stage):
    supabase.table("documents").update({"stage": stage}).eq("id", document_id).execute()


def write_temp(content, file_type):
    fd, path = tempfile.mkstemp(suffix="." + file_type)
    with os.fdopen(fd, "wb") as f:
        f.write(content)
    return path
