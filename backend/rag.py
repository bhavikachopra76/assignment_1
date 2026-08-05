import json
import re
import time

import cohere
from google import genai
from google.genai import types

from config import CHAT_MODEL, RERANK_MODEL, settings
from database import supabase
from embeddings import embed_query

gemini = genai.Client(vertexai=True, project=settings.gcp_project, location=settings.gcp_region)
co = cohere.ClientV2(api_key=settings.cohere_key)

CANDIDATES = 30   
TOP_K = 5        

REWRITE_PROMPT = """Rewrite the follow-up question so that it can be understood
on its own, using the conversation for context. Fix any spelling mistakes.
Reply with the rewritten question and nothing else.

Conversation so far:
{history}

Follow-up question: {question}"""

PROMPT = """You are a helpful assistant for company policy documents.

Answer the question using only the sources below. If the sources do not
contain the answer, say you could not find it in the documents - never guess
or use outside knowledge.

Reply with JSON in this exact shape:
{"answer": "your answer here",
 "citations": [{"id": <source id>, "quote": "sentence copied word for word from that source"}]}

Include a citation for every source you actually used. The quote must be
copied exactly from the source text.

Sources:
{sources}

Question: {question}"""

ANSWER_SCHEMA = {
    "type": "object",
    "properties": {
        "answer": {"type": "string"},
        "citations": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "integer"},
                    "quote": {"type": "string"},
                },
                "required": ["id", "quote"],
            },
        },
    },
    "required": ["answer", "citations"],
}


def answer_question(question, history=None):

    if history:
        question = rewrite_question(question, history)

    chunks = search(question)
    if not chunks:
        return "I could not find anything about that in the uploaded documents.", []

    reply = generate(question, chunks, history)
    return reply["answer"], build_citations(reply.get("citations", []), chunks)


def rewrite_question(question, history):
    prompt = REWRITE_PROMPT.replace("{history}", history).replace("{question}", question)
    return call_gemini(prompt).text.strip()


def search(question):
    vector = embed_query(question)
    dense = supabase.rpc("match_chunks", {
        "query_embedding": vector,
        "match_count": CANDIDATES,
    }).execute().data

    keyword = []
    terms = keyword_terms(question)
    if terms:
        keyword = supabase.rpc("search_chunks", {
            "query_text": terms,
            "match_count": CANDIDATES,
        }).execute().data

    merged = {}
    for row in dense + keyword:
        merged[row["id"]] = row

    chunks = add_filenames(list(merged.values()))
    return rerank(question, chunks)


def keyword_terms(question):
    words = re.findall(r"[a-zA-Z0-9]+", question.lower())
    return " | ".join(w for w in words if len(w) > 2)


def add_filenames(chunks):
    ids = list({c["document_id"] for c in chunks})
    rows = supabase.table("documents").select("id,filename").in_("id", ids).execute().data
    names = {r["id"]: r["filename"] for r in rows}

    for chunk in chunks:
        chunk["filename"] = names.get(chunk["document_id"], "Unknown")
    return chunks


def rerank(question, chunks):
    results = co.rerank(
        model=RERANK_MODEL,
        query=question,
        documents=[c["content"] for c in chunks],
        top_n=TOP_K,
    )
    return [chunks[r.index] for r in results.results]


def generate(question, chunks, history):
    sources = "\n\n".join(
        f"[{i}] {c['filename']}"
        + (f", page {c['page_number']}" if c["page_number"] else "")
        + (f", section {c['heading']}" if c["heading"] else "")
        + f"\n{c['content']}"
        for i, c in enumerate(chunks)
    )

    prompt = PROMPT.replace("{sources}", sources).replace("{question}", question)
    if history:
        prompt = "Earlier in this conversation:\n" + history + "\n\n" + prompt

    return json.loads(call_gemini(prompt, ANSWER_SCHEMA).text)


def call_gemini(prompt, schema=None):
    config = types.GenerateContentConfig(
        response_mime_type="application/json" if schema else "text/plain",
        response_schema=schema,
    )

    for attempt in range(3):
        try:
            return gemini.models.generate_content(model=CHAT_MODEL, contents=prompt, config=config)
        except Exception as e:
            if "429" not in str(e) or attempt == 2:
                raise
            time.sleep(10 * (attempt + 1))


def build_citations(cited, chunks):
    citations = []
    for item in cited:
        try:
            index = int(item.get("id"))
        except (TypeError, ValueError):
            continue
        if index < 0 or index >= len(chunks):
            continue

        chunk = chunks[index]
        citations.append({
            "chunk_id": chunk["id"],
            "document_name": chunk["filename"],
            "page_number": chunk["page_number"],
            "heading": chunk["heading"],
            "cited_text": item.get("quote", "")[:1000],
        })
    return citations
