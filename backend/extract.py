import re

import pymupdf
import pymupdf4llm
from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph


def extract(path, file_type):
    if file_type == "pdf":
        return extract_pdf(path)
    elif file_type == "docx":
        return extract_docx(path)
    else:
        return extract_txt(path)


def extract_pdf(path):
    doc = pymupdf.open(path)
    author = doc.metadata.get("author")
    page_count = doc.page_count

    pages = []
    for i, page in enumerate(pymupdf4llm.to_markdown(doc, page_chunks=True, show_progress=False)):
        pages.append((i + 1, clean(page["text"])))

    doc.close()
    return pages, author, page_count


def extract_docx(path):
    doc = Document(path)
    author = doc.core_properties.author
    parts = []
    for block in doc.element.body:
        tag = block.tag.split("}")[-1]
        if tag == "p":
            para = Paragraph(block, doc)
            text = para.text.strip()
            if text:
                parts.append(as_markdown(para, text))
        elif tag == "tbl":
            parts.append(table_to_markdown(Table(block, doc)))

    return [(None, clean("\n\n".join(parts)))], author, None


def as_markdown(para, text):
    style = para.style.name if para.style else ""
    if style.startswith("Heading"):
        level = style.replace("Heading", "").strip()
        level = int(level) if level.isdigit() else 1
        return "#" * level + " " + text
    return text


def table_to_markdown(table):
    rows = []
    for row in table.rows:
        cells = [cell.text.strip().replace("\n", " ") for cell in row.cells]
        rows.append("| " + " | ".join(cells) + " |")

    if len(rows) > 1:
        rows.insert(1, "| " + " | ".join("---" for _ in table.columns) + " |")
    return "\n".join(rows)


def extract_txt(path):
    with open(path, encoding="utf-8", errors="replace") as f:
        lines = f.read().splitlines()
    out = []
    for i, line in enumerate(lines):
        text = line.strip()
        next_line = lines[i + 1].strip() if i + 1 < len(lines) else ""

        if is_underline(text):
            continue
        if text and is_underline(next_line):
            out.append("## " + text)
        else:
            out.append(line)

    return [(None, clean("\n".join(out)))], None, None


def is_underline(line):
    return len(line) >= 3 and set(line) <= {"-", "="}


def clean(text):
    text = text.replace(" ", " ")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()
