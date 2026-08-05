from datetime import datetime, timezone


def document(row):
    return {
        "id": row["id"],
        "filename": row["filename"],
        "type": row["file_type"].upper(),
        "size": format_size(row["size_bytes"]),
        "pages": row.get("pages"),
        "chunks": row.get("chunk_count") or 0,
        "uploadDate": row["uploaded_at"][:10],
        "status": row["status"].capitalize(),
        "stage": row.get("stage"),
        "author": row.get("author"),
        "error": row.get("error"),
    }


def citation(row):
    return {
        "id": row["id"],
        "documentName": row["document_name"],
        "pageNumber": row["page_number"],
        "section": row["heading"],
        "originalParagraph": row["cited_text"],
    }


def session(row):
    return {
        "id": row["id"],
        "title": row["title"],
        "lastActive": ago(row["last_active_at"]),
    }


def message(row, citations=None):
    return {
        "id": row["id"],
        "sender": row["role"],
        "text": row["content"],
        "timestamp": row["created_at"],
        "citations": citations or [],
    }


def format_size(size):
    if size >= 1024 * 1024:
        return f"{size / (1024 * 1024):.1f} MB"
    return f"{size / 1024:.0f} KB"


def ago(timestamp):
    seconds = (datetime.now(timezone.utc) - datetime.fromisoformat(timestamp)).total_seconds()
    minutes = int(seconds // 60)

    if minutes < 1:
        return "just now"
    if minutes < 60:
        return f"{minutes} min ago"
    if minutes < 60 * 24:
        return plural(minutes // 60, "hour")
    return plural(minutes // (60 * 24), "day")


def plural(count, unit):
    return f"{count} {unit} ago" if count == 1 else f"{count} {unit}s ago"
