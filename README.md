# 🧠 GitGuru

> **Turn any GitHub repo into a conversation.**

GitGuru is an AI-powered tool that lets you load any public GitHub repository and have a natural conversation with its codebase. Ask about architecture, logic, dependencies, or specific files — and get accurate, context-aware answers backed by source references.

---

## ✨ Features

- 🔗 **Any public GitHub repo** — just paste the URL and go
- ⚡ **Instant re-access** — repos are cached after first index; reloading is immediate
- 💬 **Session-based chat history** — follow-up questions retain context within the current session
- 📎 **Source citations** — every answer links back to the exact files on GitHub
- 🧩 **Smart chunking** — code is split with context-aware overlap for precise retrieval
- 🎯 **MMR retrieval** — Maximal Marginal Relevance ensures diverse, non-repetitive context
- 🛡️ **Clean ingestion** — skips `node_modules`, `.git`, `dist`, binary files, and anything over 500KB
- 📁 **Broad file support** — Python, JS, TS, Go, Rust, Java, Markdown, YAML, JSON, SQL, and more

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router) · React · TypeScript · Tailwind CSS |
| **Backend** | Python 3.11+ · FastAPI · Uvicorn |
| **RAG Framework** | LangChain (ConversationalRetrievalChain) |
| **Vector Database** | Chroma (local, persistent) |
| **LLM** | OpenAI GPT-4o |
| **Embeddings** | OpenAI `text-embedding-3-small` |
| **Repo Ingestion** | GitPython · LangChain Text Splitters |

---

## 📁 Project Structure

```
gitguru/
├── backend/
│   ├── main.py              # FastAPI app — routes & registry
│   ├── ingest.py            # Clone → chunk → embed → store
│   ├── query.py             # RAG retrieval & GPT-4o response
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── icon.svg          # Tab favicon
    │   └── globals.css
    ├── components/
    │   ├── RepoInput.tsx     # URL input, ingest trigger, active repo badge
    │   ├── ChatWindow.tsx    # Chat interface with history & suggestions
    │   └── MessageBubble.tsx # Message rendering, markdown, source cards
    ├── package.json
    └── next.config.js
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- An OpenAI API key ([platform.openai.com](https://platform.openai.com))
- Git installed on your machine

---

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env            # Windows: copy .env.example .env
# Open .env and add your OPENAI_API_KEY

# Start the server
python main.py
# Running at http://localhost:8000
```

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local   # Windows: copy .env.local.example .env.local
# NEXT_PUBLIC_API_URL is already set to http://localhost:8000

# Start the dev server
npm run dev
# Running at http://localhost:3000
```

---

### 3. Quick Start Scripts

From the project root:

**macOS / Linux**
```bash
./start.sh   # Start both backend and frontend
./stop.sh    # Stop both services
```

**Windows**
```bat
start.bat    # Start both backend and frontend
stop.bat     # Stop both services
```

---

## 🧪 Usage

1. Open `http://localhost:3000`
2. Paste any public GitHub repository URL
   ```
   https://github.com/username/repository
   ```
3. Click **Load Repo** — the repo will be cloned, chunked, and indexed
4. Ask questions in the chat interface
5. Expand **sources** under any answer to see the exact files — click **View** to open them on GitHub

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/ingest` | Ingest a GitHub repository |
| `POST` | `/chat` | Ask a question about an ingested repo |
| `GET` | `/repos` | List all ingested repositories |
| `DELETE` | `/repos` | Remove a repository from the index |

### POST `/ingest`
```json
{
  "repo_url": "https://github.com/username/repository"
}
```

### POST `/chat`
```json
{
  "collection_name": "repo_username_repository_abc12345",
  "question": "How does authentication work?",
  "chat_history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

---

## ⚙️ Configuration

### Backend — `backend/.env`

| Variable | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | — | Required. Your OpenAI API key |
| `CHROMA_PERSIST_DIR` | `./chroma_db` | Where vector embeddings are stored |
| `REPOS_REGISTRY` | `./repos_registry.json` | Local registry of ingested repos |

### Frontend — `frontend/.env.local`

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API URL |

---

## ⚠️ Limitations

- Only **public** GitHub repositories are supported
- Very large repositories may take a few minutes on first index
- Files larger than **500KB** are skipped during ingestion
- Accuracy depends on how well the repository is documented and structured

---

## 🗺️ Roadmap

- [ ] Streaming responses
- [ ] Private repository support (via GitHub token)
- [ ] Multi-repo chat (ask across several repos at once)
- [ ] Branch and commit selection
- [ ] Deployed cloud version

---

## 📬 Contact

Have questions, feedback, or want to collaborate?

| | |
|---|---|
| 📧 **Email** | `adeelmemon096@yahoo.com` |
| 🐙 **GitHub** | `github.com/adeel-iqbal` |
| 💼 **LinkedIn** | `linkedin.com/in/adeeliqbalmemon` |

---

<p align="center">Built with precision. Powered by GPT-4o.</p>
