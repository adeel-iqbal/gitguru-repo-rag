import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferWindowMemory
from langchain.prompts import PromptTemplate

load_dotenv()

CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")

SYSTEM_PROMPT = """You are an expert software engineer helping users understand a GitHub repository.
Use the provided code and documentation context to answer questions accurately and concisely.

Guidelines:
- Reference specific file paths and line content when relevant
- If the answer involves code, format it with proper markdown code blocks
- If you're unsure or the context doesn't contain enough information, say so clearly
- Keep answers focused and practical

Context from the repository:
{context}

Chat History:
{chat_history}

Question: {question}

Answer:"""


def get_vectorstore(collection_name: str) -> Chroma:
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    return Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=CHROMA_PERSIST_DIR,
    )


def query_repo(
    collection_name: str,
    question: str,
    chat_history: list[dict] | None = None,
) -> dict:
    """
    Query a repository's vector store with a question.
    Returns the answer and source documents.
    """
    vectorstore = get_vectorstore(collection_name)

    if vectorstore._collection.count() == 0:
        raise ValueError("Repository not ingested yet. Please ingest the repo first.")

    retriever = vectorstore.as_retriever(
        search_type="mmr",  # Maximal Marginal Relevance for diverse results
        search_kwargs={"k": 6, "fetch_k": 20},
    )

    llm = ChatOpenAI(
        model="gpt-4o",
        temperature=0.1,
        streaming=False,
    )

    # Format chat history for LangChain
    formatted_history = []
    if chat_history:
        for msg in chat_history:
            if msg.get("role") == "user":
                formatted_history.append((msg["content"], ""))
            elif msg.get("role") == "assistant" and formatted_history:
                # Pair with last user message
                last = formatted_history[-1]
                formatted_history[-1] = (last[0], msg["content"])

    prompt = PromptTemplate(
        input_variables=["context", "chat_history", "question"],
        template=SYSTEM_PROMPT,
    )

    chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=retriever,
        return_source_documents=True,
        combine_docs_chain_kwargs={"prompt": prompt},
    )

    result = chain.invoke({
        "question": question,
        "chat_history": formatted_history,
    })

    # Extract unique sources
    sources = []
    seen = set()
    for doc in result.get("source_documents", []):
        src = doc.metadata.get("source", "unknown")
        if src not in seen:
            seen.add(src)
            sources.append({
                "file": src,
                "file_type": doc.metadata.get("file_type", ""),
                "snippet": doc.page_content[:200].strip(),
            })

    return {
        "answer": result["answer"],
        "sources": sources,
    }
