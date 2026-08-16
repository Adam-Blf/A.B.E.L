from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pathlib import Path
import logging
import time
import httpx

from app.core.config import settings
from app.core.database import check_database_connection
from app.services.brain import brain_service

logger = logging.getLogger("abel")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")

SERVER_START_TIME = time.time()
ROOT_DIR = Path(__file__).parent.parent.parent
DOCS_DIR = ROOT_DIR / "docs"


# ─── Connection Manager ────────────────────────────────────────────────────────

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
        self.message_count: int = 0

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"Client {client_id[:12]}... connected ({len(self.active_connections)} total)")

    def disconnect(self, client_id: str):
        self.active_connections.pop(client_id, None)

    async def send(self, client_id: str, message: dict):
        ws = self.active_connections.get(client_id)
        if ws:
            await ws.send_json(message)

    def increment_messages(self):
        self.message_count += 1


manager = ConnectionManager()


# ─── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 60)
    logger.info("  A.B.E.L — Adam Beloucif Est Là")
    logger.info(f"  Version: {settings.APP_VERSION}")
    logger.info("=" * 60)

    # Initialize brain (LLM provider detection)
    await brain_service.initialize()
    info = brain_service.get_info()
    logger.info(f"  LLM Provider : {info['provider'].upper()} ({info['model']})")
    logger.info(f"  Ollama       : {'✅' if info['ollama_available'] else '❌'}")
    logger.info(f"  Groq         : {'✅' if info['groq_configured'] else '❌'}")
    logger.info(f"  OpenAI       : {'✅' if info['openai_configured'] else '❌'}")

    db_ok = await check_database_connection()
    logger.info(f"  Database     : {'✅' if db_ok else '❌ (mock mode)'}")
    logger.info("=" * 60)

    yield
    logger.info("Shutting down A.B.E.L...")


# ─── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    description="Adam Beloucif Est Là — Assistant Personnel Intelligent",
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Health & Status ───────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    db_ok = await check_database_connection()
    info = brain_service.get_info()
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "llm": info["provider"],
        "model": info["model"],
        "database": "connected" if db_ok else "disconnected",
    }


@app.get("/api/status")
async def system_status():
    uptime_s = time.time() - SERVER_START_TIME
    h, m, s = int(uptime_s // 3600), int((uptime_s % 3600) // 60), int(uptime_s % 60)
    db_ok = await check_database_connection()
    info = brain_service.get_info()

    return {
        "status": "online",
        "version": settings.APP_VERSION,
        "uptime": {"seconds": int(uptime_s), "formatted": f"{h:02d}:{m:02d}:{s:02d}"},
        "connections": {"active": len(manager.active_connections), "total_messages": manager.message_count},
        "sessions": {"active": brain_service.get_session_count()},
        "services": {
            "llm": {"status": info["provider"] if info["provider"] != "mock" else "mock", "model": info["model"]},
            "database": {"status": "active" if db_ok else "offline"},
            "memory": {"status": "active" if db_ok and info["provider"] != "mock" else "mock"},
        },
    }


@app.get("/api/info")
async def api_info():
    info = brain_service.get_info()
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "llm": info,
        "endpoints": {
            "health": "/health",
            "status": "/api/status",
            "models": "/api/models",
            "chat": "/ws/chat/{client_id}",
            "docs": "/api/docs",
        },
    }


# ─── Models ────────────────────────────────────────────────────────────────────

@app.get("/api/models")
async def list_models():
    """Liste les modèles Ollama disponibles + modèles Groq recommandés."""
    result = {
        "active": brain_service.get_info(),
        "ollama": {"available": False, "models": []},
        "groq": {
            "available": settings.has_groq,
            "models": [
                {"id": "llama-3.3-70b-versatile", "name": "Llama 3.3 70B", "recommended": True},
                {"id": "llama-3.1-8b-instant", "name": "Llama 3.1 8B (rapide)", "recommended": False},
                {"id": "mixtral-8x7b-32768", "name": "Mixtral 8x7B", "recommended": False},
                {"id": "gemma2-9b-it", "name": "Gemma 2 9B", "recommended": False},
                {"id": "deepseek-r1-distill-llama-70b", "name": "DeepSeek R1 70B", "recommended": False},
            ],
        },
        "openai": {
            "available": settings.has_openai,
            "models": [
                {"id": "gpt-4o-mini", "name": "GPT-4o Mini (rapide)"},
                {"id": "gpt-4o", "name": "GPT-4o"},
            ],
        },
    }

    # Check Ollama models
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            r = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            if r.status_code == 200:
                data = r.json()
                result["ollama"]["available"] = True
                result["ollama"]["models"] = [
                    {
                        "id": m["name"],
                        "name": m["name"],
                        "size": m.get("size", 0),
                        "modified": m.get("modified_at", ""),
                    }
                    for m in data.get("models", [])
                ]
    except Exception:
        pass

    return result


# ─── Documentation ─────────────────────────────────────────────────────────────

@app.get("/api/docs")
async def list_docs():
    doc_list = []
    root_docs = [
        {"id": "README", "title": "README", "description": "Installation et démarrage rapide"},
        {"id": "CLAUDE", "title": "CLAUDE.md", "description": "Instructions Claude Code"},
    ]
    for doc in root_docs:
        if (ROOT_DIR / f"{doc['id']}.md").exists():
            doc_list.append(doc)

    if DOCS_DIR.exists():
        for f in sorted(DOCS_DIR.glob("*.md")):
            doc_list.append({
                "id": f.stem,
                "title": f.stem.replace("_", " ").title(),
                "description": f"Documentation: {f.stem.replace('_', ' ')}",
            })

    return {"docs": doc_list}


@app.get("/api/docs/{doc_id}")
async def get_doc(doc_id: str):
    safe_id = re.sub(r"[^a-zA-Z0-9_\-]", "", doc_id)
    candidates = [
        DOCS_DIR / f"{safe_id}.md",
        DOCS_DIR / f"{safe_id.upper()}.md",
        ROOT_DIR / f"{safe_id}.md",
        ROOT_DIR / f"{safe_id.upper()}.md",
    ]
    for c in candidates:
        if c.exists() and c.is_file():
            content = c.read_text(encoding="utf-8")
            return {"id": doc_id, "title": safe_id.replace("_", " ").title(), "content": content}
    raise HTTPException(status_code=404, detail=f"Document '{doc_id}' non trouvé")


import re  # noqa: E402


# ─── WebSocket Chat ────────────────────────────────────────────────────────────

@app.websocket("/ws/chat/{client_id}")
async def websocket_chat(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    session_id = client_id  # persistent session

    llm_info = brain_service.get_info()
    provider_label = llm_info["model"]

    try:
        await manager.send(client_id, {
            "type": "system",
            "content": f"Connexion établie avec A.B.E.L. Modèle actif : **{provider_label}**. Comment puis-je vous aider ?",
            "session_id": session_id,
            "model": provider_label,
            "provider": llm_info["provider"],
        })

        while True:
            data = await websocket.receive_json()

            if data.get("type") == "message":
                user_message = data.get("content", "").strip()
                if not user_message:
                    continue

                manager.increment_messages()

                await manager.send(client_id, {
                    "type": "thinking",
                    "content": "Analyse en cours..."
                })

                full_response = ""
                async for chunk in brain_service.stream_message(
                    message=user_message,
                    session_id=session_id,
                    user_id=data.get("user_id"),
                ):
                    full_response += chunk
                    await manager.send(client_id, {"type": "stream", "content": chunk})

                await manager.send(client_id, {
                    "type": "assistant",
                    "content": full_response,
                    "complete": True,
                })

            elif data.get("type") == "ping":
                await manager.send(client_id, {"type": "pong", "timestamp": time.time()})

            elif data.get("type") == "clear":
                brain_service.clear_history(session_id)
                await manager.send(client_id, {
                    "type": "system",
                    "content": "Historique effacé. Nouvelle conversation initialisée.",
                })

            elif data.get("type") == "status":
                info = brain_service.get_info()
                await manager.send(client_id, {
                    "type": "status",
                    "connected": True,
                    "session_id": session_id,
                    **info,
                })

    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error ({client_id[:12]}): {e}")
        manager.disconnect(client_id)


# ─── Root ──────────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return JSONResponse({
        "message": "A.B.E.L — Adam Beloucif Est Là",
        "status": "online",
        "version": settings.APP_VERSION,
        "llm": brain_service.get_info()["provider"],
        "docs": "/docs",
    })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
