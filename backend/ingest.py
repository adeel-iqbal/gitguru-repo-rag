import os
import shutil
import tempfile
import hashlib
from pathlib import Path

import git
from dotenv import load_dotenv
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma

load_dotenv()

CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")

# File extensions to index
ALLOWED_EXTENSIONS = {
    ".py", ".js", ".ts", ".tsx", ".jsx", ".java", ".go", ".rs", ".cpp",
    ".c", ".h", ".cs", ".rb", ".php", ".swift", ".kt", ".scala", ".r",
    ".md", ".mdx", ".txt", ".rst", ".yaml", ".yml", ".json", ".toml",
    ".html", ".css", ".scss", ".sql", ".sh", ".bash", ".zsh",
}

# Directories to skip
SKIP_DIRS = {
    ".git", "node_modules", "__pycache__", ".venv", "venv", "env",
    "dist", "build", ".next", ".nuxt", "coverage", ".pytest_cache",
    ".mypy_cache", ".tox", "vendor", "bower_components",
}

MAX_FILE_SIZE_BYTES = 500_000  # 500KB per file


def repo_url_to_id(repo_url: str) -> str:
    """Generate a stable collection name from a repo URL."""
    clean = repo_url.rstrip("/").replace("https://", "").replace("http://", "")
    clean = clean.replace("/", "_").replace(".", "_").replace("-", "_")
    # Chroma collection names must be 3-63 chars, alphanumeric + underscore
    hashed = hashlib.md5(repo_url.encode()).hexdigest()[:8]
    name = f"repo_{clean[:40]}_{hashed}"
    return name


def load_repo_files(repo_path: str) -> list[Document]:
    """Walk the cloned repo and load all allowed files as Documents."""
    docs = []
    repo_root = Path(repo_path)

    for file_path in repo_root.rglob("*"):
        # Skip directories
        if file_path.is_dir():
            continue
        # Skip hidden/unwanted dirs
        parts = set(file_path.relative_to(repo_root).parts)
        if parts & SKIP_DIRS:
            continue
        # Check extension
        if file_path.suffix.lower() not in ALLOWED_EXTENSIONS:
            continue
        # Skip large files
        if file_path.stat().st_size > MAX_FILE_SIZE_BYTES:
            continue

        try:
            content = file_path.read_text(encoding="utf-8", errors="ignore")
            if not content.strip():
                continue
            relative_path = str(file_path.relative_to(repo_root))
            docs.append(Document(
                page_content=content,
                metadata={
                    "source": relative_path,
                    "file_type": file_path.suffix.lower(),
                }
            ))
        except Exception:
            continue

    return docs


def chunk_documents(docs: list[Document]) -> list[Document]:
    """Split documents into overlapping chunks."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=150,
        length_function=len,
        separators=["\n\n", "\n", " ", ""],
    )
    return splitter.split_documents(docs)


def ingest_repo(repo_url: str) -> dict:
    """
    Clone a GitHub repo, chunk its files, embed them, and store in Chroma.
    Returns metadata about the ingestion.
    """
    collection_name = repo_url_to_id(repo_url)
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

    # Check if already ingested
    vectorstore = Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=CHROMA_PERSIST_DIR,
    )
    existing_count = vectorstore._collection.count()
    if existing_count > 0:
        return {
            "status": "already_ingested",
            "collection_name": collection_name,
            "chunk_count": existing_count,
            "repo_url": repo_url,
        }

    # Clone repo to temp dir
    tmp_dir = tempfile.mkdtemp()
    try:
        print(f"Cloning {repo_url} ...")
        git.Repo.clone_from(repo_url, tmp_dir, depth=1)

        print("Loading files...")
        docs = load_repo_files(tmp_dir)
        if not docs:
            raise ValueError("No indexable files found in the repository.")

        print(f"Loaded {len(docs)} files. Chunking...")
        chunks = chunk_documents(docs)
        print(f"Created {len(chunks)} chunks. Embedding and storing...")

        # Store in Chroma
        Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            collection_name=collection_name,
            persist_directory=CHROMA_PERSIST_DIR,
        )

        return {
            "status": "success",
            "collection_name": collection_name,
            "file_count": len(docs),
            "chunk_count": len(chunks),
            "repo_url": repo_url,
        }
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


def delete_repo(collection_name: str) -> bool:
    """Delete a repo's vector store collection."""
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    vectorstore = Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=CHROMA_PERSIST_DIR,
    )
    vectorstore.delete_collection()
    return True
