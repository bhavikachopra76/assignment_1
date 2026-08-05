# centralized configuration module for the entire backend application
import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).parent
load_dotenv(BASE_DIR / ".env")

key_file = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
if key_file:
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str((BASE_DIR / key_file).resolve())

class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str
    supabase_bucket: str
    gcp_project: str
    gcp_region: str
    cohere_key: str

settings = Settings()

EMBEDDING_MODEL = "text-embedding-005"
EMBEDDING_DIM = 768
CHAT_MODEL = "gemini-2.5-flash"
RERANK_MODEL = "rerank-v3.5"

ALLOWED_TYPES = ["pdf", "docx", "txt"]
