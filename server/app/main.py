from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pathlib import Path
import logging
import uuid
import time
import os

from app.core.config import settings
from app.core.database import check_database_connection
from app.services.brain import brain_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("abel")

# Track server start time
SERVER_START_TIME = time.time()

# Paths
ROOT_DIR = Path(__file__).parent.parent.parent
DOCS_DIR = ROOT_DIR / "docs"


# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
        self.message_count: int = 0

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"Client {client_id} connected. Total: {len(self.active_connections)}")

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            logger.info(f"Client {client_id} disconnected. Total: {len(self.active_connections)}")

    async def send_message(self, client_id: str, message: dict):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_json(message)

    def increment_messages(self):
        self.message_count += 1


manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    logger.info("=" * 50)
    logger.info("  A.B.E.L - Adam Beloucif Est Là")
    logger.info(f"  Version: {settings.APP_VERSION}")
    logger.info("=" * 50)

    db_ok = await check_database_connection()
    if db_ok:
        logger.info("Database connection: OK")
    else:
        logger.warning("Database connection: FAILED (running in mock mode)")

    if settings.OPENAI_API_KEY:
        logger.info("OpenAI API: Configured")
    else:
        logger.warning("OpenAI API: NOT CONFIGURED (chat will use mock mode)")

    yield

    logger.info("Shutting down A.B.E.L...")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="Adam Beloucif Est Là - Assistant Personnel Intelligent",
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Health & Status Endpoints
# ============================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    db_status = await check_database_connection()
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "database": "connected" if db_status else "disconnected",
        "openai": "configured" if settings.OPENAI_API_KEY else "not_configured"
    }


@app.get("/api/status")
async def system_status():
    """Detailed system status for the dashboard."""
    uptime_seconds = time.time() - SERVER_START_TIME
    db_ok = await check_database_connection()

    hours = int(uptime_seconds // 3600)
    minutes = int((uptime_seconds % 3600) // 60)
    seconds = int(uptime_seconds % 60)

    return {
        "status": "online",
        "version": settings.APP_VERSION,
        "uptime": {
            "seconds": int(uptime_seconds),
            "formatted": f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        },
        "connections": {
            "active": len(manager.active_connections),
            "total_messages": manager.message_count
        },
        "sessions": {
            "active": len(brain_service.conversation_history)
        },
        "services": {
            "llm": {
                "status": "active" if settings.OPENAI_API_KEY else "mock",
                "model": settings.OPENAI_MODEL if settings.OPENAI_API_KEY else "mock-mode"
            },
            "database": {
                "status": "active" if db_ok else "offline"
            },
            "memory": {
                "status": "active" if settings.OPENAI_API_KEY else "mock"
            }
        }
    }


@app.get("/api/info")
async def api_info():
    """Get API information."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": "Adam Beloucif Est Là - Assistant Personnel Intelligent",
        "endpoints": {
            "health": "/health",
            "status": "/api/status",
            "chat": "/ws/chat/{client_id}",
            "docs": "/api/docs",
            "doc": "/api/docs/{doc_id}"
        }
    }


# ============================================================
# Documentation Endpoints
# ============================================================

@app.get("/api/docs")
async def list_docs():
    """List available documentation files."""
    doc_list = []

    # Add root-level markdown files
    root_docs = [
        {"id": "README", "title": "README", "description": "Installation et démarrage rapide"},
        {"id": "CLAUDE", "title": "CLAUDE.md", "description": "Instructions pour Claude Code"},
    ]
    for doc in root_docs:
        p = ROOT_DIR / f"{doc['id']}.md"
        if p.exists():
            doc_list.append(doc)

    # Add docs folder files
    if DOCS_DIR.exists():
        for f in sorted(DOCS_DIR.glob("*.md")):
            doc_list.append({
                "id": f.stem,
                "title": f.stem.replace("_", " ").title(),
                "description": f"Documentation: {f.stem.replace('_', ' ')}"
            })

    return {"docs": doc_list}


@app.get("/api/docs/{doc_id}")
async def get_doc(doc_id: str):
    """Serve a markdown document by ID."""
    # Security: prevent path traversal
    safe_id = doc_id.replace("/", "").replace("..", "").replace("\\", "")

    # Try docs folder first
    candidates = [
        DOCS_DIR / f"{safe_id}.md",
        DOCS_DIR / f"{safe_id.upper()}.md",
        ROOT_DIR / f"{safe_id}.md",
        ROOT_DIR / f"{safe_id.upper()}.md",
    ]

    for candidate in candidates:
        if candidate.exists() and candidate.is_file():
            content = candidate.read_text(encoding="utf-8")
            return {
                "id": doc_id,
                "title": safe_id.replace("_", " ").title(),
                "content": content,
                "size": len(content)
            }

    raise HTTPException(status_code=404, detail=f"Document '{doc_id}' not found")


# ============================================================
# WebSocket Chat Endpoint
# ============================================================

@app.websocket("/ws/chat/{client_id}")
async def websocket_chat(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time chat with AI."""
    await manager.connect(websocket, client_id)
    session_id = client_id  # Use client_id as session_id for persistence

    try:
        # Send welcome message
        await manager.send_message(client_id, {
            "type": "system",
            "content": "Connexion établie avec A.B.E.L. Comment puis-je vous aider?",
            "session_id": session_id
        })

        while True:
            data = await websocket.receive_json()

            if data.get("type") == "message":
                user_message = data.get("content", "").strip()
                user_id = data.get("user_id")

                if not user_message:
                    continue

                manager.increment_messages()

                # Send thinking indicator
                await manager.send_message(client_id, {
                    "type": "thinking",
                    "content": "Analyse en cours..."
                })

                if not settings.OPENAI_API_KEY:
                    # Smart mock responses
                    mock = _get_mock_response(user_message)
                    await manager.send_message(client_id, {
                        "type": "assistant",
                        "content": mock,
                        "complete": True
                    })
                else:
                    # Stream response from Brain
                    full_response = ""
                    async for chunk in brain_service.stream_message(
                        message=user_message,
                        session_id=session_id,
                        user_id=user_id
                    ):
                        full_response += chunk
                        await manager.send_message(client_id, {
                            "type": "stream",
                            "content": chunk
                        })

                    # Send completion signal
                    await manager.send_message(client_id, {
                        "type": "assistant",
                        "content": full_response,
                        "complete": True
                    })

            elif data.get("type") == "ping":
                await manager.send_message(client_id, {
                    "type": "pong",
                    "timestamp": time.time()
                })

            elif data.get("type") == "clear":
                brain_service.clear_history(session_id)
                await manager.send_message(client_id, {
                    "type": "system",
                    "content": "Historique effacé. Nouvelle conversation initialisée."
                })

            elif data.get("type") == "status":
                await manager.send_message(client_id, {
                    "type": "status",
                    "connected": True,
                    "session_id": session_id,
                    "llm": "active" if settings.OPENAI_API_KEY else "mock"
                })

    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error for {client_id}: {e}")
        manager.disconnect(client_id)


def _get_mock_response(message: str) -> str:
    """Generate intelligent mock responses when no OpenAI key is configured."""
    msg_lower = message.lower()

    if any(w in msg_lower for w in ["bonjour", "salut", "hello", "hi"]):
        return "Bonjour ! Je suis A.B.E.L, votre assistant personnel. Je fonctionne en mode simulation (sans clé OpenAI). Pour activer l'IA complète, configurez `OPENAI_API_KEY` dans le fichier `.env` du serveur."

    if any(w in msg_lower for w in ["heure", "time", "quelle heure"]):
        from datetime import datetime
        now = datetime.now().strftime("%H:%M:%S")
        return f"Il est actuellement **{now}**."

    if any(w in msg_lower for w in ["aide", "help", "commandes"]):
        return """Je peux vous aider avec :

- 💬 **Conversation** : Posez-moi vos questions
- 🔧 **Code** : Aide au développement
- 📊 **Analyse** : Traitement de données
- 🌐 **APIs** : Accès à +1400 APIs publiques

Pour activer l'IA complète, configurez votre clé OpenAI."""

    if any(w in msg_lower for w in ["statut", "status", "état"]):
        uptime = time.time() - SERVER_START_TIME
        return f"""**Statut du système A.B.E.L :**

- 🟢 Serveur : En ligne ({int(uptime)}s uptime)
- 🟡 IA : Mode simulation (clé OpenAI manquante)
- 🔵 WebSocket : Connecté
- ⚡ Sessions actives : {len(brain_service.conversation_history)}"""

    if any(w in msg_lower for w in ["merci", "thanks"]):
        return "Avec plaisir ! N'hésitez pas si vous avez d'autres questions. 🚀"

    return f"""[Mode Simulation] J'ai bien reçu : *"{message}"*

Pour des réponses IA réelles, configurez `OPENAI_API_KEY` dans `server/.env`.

En attendant, je peux répondre à des questions basiques sur l'heure, le statut du système, ou l'aide générale."""


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return JSONResponse({
        "message": "A.B.E.L - Adam Beloucif Est Là",
        "status": "online",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
