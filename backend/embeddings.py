import time

from google import genai
from google.genai import types

from config import EMBEDDING_DIM, EMBEDDING_MODEL, settings

client = genai.Client(vertexai=True, project=settings.gcp_project, location=settings.gcp_region)

MAX_TEXTS = 100      
MAX_TOKENS = 18000   


def embed_documents(texts):
    return embed(texts, "RETRIEVAL_DOCUMENT")


def embed_query(text):
    return embed([text], "RETRIEVAL_QUERY")[0]


def embed(texts, task_type):
    vectors = []
    for batch in make_batches(texts):
        vectors.extend(embed_batch(batch, task_type))
    return vectors


def make_batches(texts):
    batches = []
    current = []
    tokens = 0

    for text in texts:
        size = len(text) // 4
        if current and (len(current) >= MAX_TEXTS or tokens + size > MAX_TOKENS):
            batches.append(current)
            current = []
            tokens = 0
        current.append(text)
        tokens += size

    if current:
        batches.append(current)
    return batches


def embed_batch(texts, task_type):
    for attempt in range(5):
        try:
            response = client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=texts,
                config=types.EmbedContentConfig(
                    task_type=task_type,
                    output_dimensionality=EMBEDDING_DIM,
                ),
            )
            return [e.values for e in response.embeddings]
        except Exception as e:
            if "429" not in str(e) or attempt == 4:
                raise
            time.sleep(20)
