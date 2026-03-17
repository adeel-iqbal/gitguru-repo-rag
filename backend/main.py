import os
import json
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from dotenv import load_dotenv

from ingest import ingest_repo, repo_url_to_id, delete_repo
from query import query_repo

load_dotenv()

app = FastAPI(title="GitHub RAG API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
REPOS_REGISTRY = os.getenv("REPOS_REGISTRY", "./repos_registry.json")


# --- Registry helpers ---

def load_registry() -> dict:
    if Path(REPOS_REGISTRY).exists():
        with open(REPOS_REGISTRY) as f:
            return json.load(f)
    return {}


def save_registry(registry: dict):
    with open(REPOS_REGISTRY, "w") as f:
        json.dump(registry, f, indent=2)


# --- Pydantic models ---

class IngestRequest(BaseModel):
    repo_url: str


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    collection_name: str
    question: str
    chat_history: Optional[list[ChatMessage]] = []


class DeleteRequest(BaseModel):
    collection_name: str


# --- Endpoints ---

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ingest")
async def ingest(req: IngestRequest, background_tasks: BackgroundTasks):
    """Ingest a GitHub repository into the vector store."""
    repo_url = req.repo_url.strip().rstrip("/")

    # Basic validation
    if not (repo_url.startswith("https://github.com/") or repo_url.startswith("http://github.com/")):
        raise HTTPException(status_code=400, detail="Only GitHub URLs are supported (https://github.com/...)")

    collection_name = repo_url_to_id(repo_url)

    # Check registry
    registry = load_registry()
    if collection_name in registry:
        return {
            "status": "already_ingested",
            "collection_name": collection_name,
            "repo_url": repo_url,
            "meta": registry[collection_name],
        }

    try:
        result = ingest_repo(repo_url)

        if result["status"] in ("success", "already_ingested"):
            registry[collection_name] = {
                "repo_url": repo_url,
                "file_count": result.get("file_count", 0),
                "chunk_count": result.get("chunk_count", 0),
            }
            save_registry(registry)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
async def chat(req: ChatRequest):
    """Ask a question about an ingested repository."""
    registry = load_registry()
    if req.collection_name not in registry:
        raise HTTPException(
            status_code=404,
            detail="Repository not found. Please ingest it first."
        )

    try:
        history = [{"role": m.role, "content": m.content} for m in (req.chat_history or [])]
        result = query_repo(
            collection_name=req.collection_name,
            question=req.question,
            chat_history=history,
        )
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/repos")
def list_repos():
    """List all ingested repositories."""
    registry = load_registry()
    return {
        "repos": [
            {
                "collection_name": col,
                **meta,
            }
            for col, meta in registry.items()
        ]
    }


@app.delete("/repos")
def delete_repo_endpoint(req: DeleteRequest):
    """Delete a repository from the vector store."""
    registry = load_registry()
    if req.collection_name not in registry:
        raise HTTPException(status_code=404, detail="Repository not found.")

    try:
        delete_repo(req.collection_name)
        del registry[req.collection_name]
        save_registry(registry)
        return {"status": "deleted", "collection_name": req.collection_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
