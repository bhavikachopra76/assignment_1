from pydantic import BaseModel


class Document(BaseModel):
    id: str
    filename: str
    type: str
    size: str
    pages: int | None = None
    chunks: int
    uploadDate: str
    status: str
    stage: str | None = None
    author: str | None = None
    error: str | None = None


class Citation(BaseModel):
    id: str
    documentName: str | None = None
    pageNumber: int | None = None
    section: str | None = None
    originalParagraph: str | None = None


class Message(BaseModel):
    id: str
    sender: str
    text: str
    timestamp: str
    citations: list[Citation] = []


class ChatReply(BaseModel):
    sessionId: str
    message: Message


class Session(BaseModel):
    id: str
    title: str
    lastActive: str


class Stats(BaseModel):
    totalDocuments: int
    totalChunks: int
    totalQuestions: int
    avgResponseTime: str
    documentGrowth: str
    chunkGrowth: str
    questionGrowth: str
    timeTrend: str


class RecentQuery(BaseModel):
    id: str
    question: str
    time: str
    status: str
    latency: str


class RecentResponse(BaseModel):
    id: str
    question: str
    answer: str | None = None
    source: str
    timestamp: str


class Deleted(BaseModel):
    deleted: str


class Health(BaseModel):
    status: str
    docs: str
