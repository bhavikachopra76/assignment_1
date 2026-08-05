import pysbd

CHUNK_SIZE = 600      
MAX_TOKENS = 1500     
OVERLAP = 2           

segmenter = pysbd.Segmenter(language="en", clean=False)


def chunk_pages(pages):
    chunks = []
    heading = None

    for page_number, text in pages:
        for section_heading, body in split_by_heading(text):
            if section_heading:
                heading = section_heading

            for content in split_text(body):
                chunks.append({
                    "chunk_index": len(chunks),
                    "content": content,
                    "heading": heading,
                    "page_number": page_number,
                })

    return chunks


def split_by_heading(text):
    sections = []
    heading = None
    buffer = []

    for line in text.splitlines():
        if line.startswith("#"):
            if buffer:
                sections.append((heading, "\n".join(buffer).strip()))
                buffer = []
            heading = clean_heading(line)
        else:
            buffer.append(line)

    if buffer:
        sections.append((heading, "\n".join(buffer).strip()))

    return [(h, b) for h, b in sections if b]


def clean_heading(line):
    return line.lstrip("#").replace("**", "").strip()


def split_text(text):
    if not text.strip():
        return []

    chunks = []
    current = []

    for sentence in segmenter.segment(text):
        for piece in force_split(sentence):
            current.append(piece)
            if count_tokens(" ".join(current)) >= CHUNK_SIZE:
                chunks.append(" ".join(current).strip())
                current = current[-OVERLAP:]

    leftover = " ".join(current).strip()
    if leftover and (not chunks or leftover != chunks[-1][-len(leftover):]):
        chunks.append(leftover)

    chunks = [c for c in chunks if c]

    if len(chunks) > 1 and count_tokens(chunks[-1]) < 40:
        last = chunks.pop()
        chunks[-1] = chunks[-1] + " " + last

    return chunks


def force_split(sentence):
    limit = MAX_TOKENS * 4
    if len(sentence) <= limit:
        return [sentence]
    return [sentence[i:i + limit] for i in range(0, len(sentence), limit)]


def count_tokens(text):
    return len(text) // 4
