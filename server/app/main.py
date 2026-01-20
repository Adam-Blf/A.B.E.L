from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.core.config import settings
from app.core.database import check_database_connection

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("abel")


# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

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


manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    logger.info("=" * 50)
    logger.info(f"  A.B.E.L - Adam Beloucif Est Là")
    logger.info(f"  Version: {settings.APP_VERSION}")
    logger.info("=" * 50)

    # Check database
    db_ok = await check_database_connection()
    if db_ok:
        logger.info("Database connection: OK")
    else:
        logger.warning("Database connection: FAILED (running in mock mode)")

    yield

    # Shutdown
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


# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    db_status = await check_database_connection()
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "database": "connected" if db_status else "disconnected"
    }


# API info
@app.get("/api/info")
async def api_info():
    """Get API information."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": "Adam Beloucif Est Là - Assistant Personnel Intelligent",
        "endpoints": {
            "health": "/health",
            "chat": "/ws/chat/{client_id}",
            "apis": "/api/apis",
            "docs": "/api/docs"
        }
    }


# WebSocket chat endpoint
@app.websocket("/ws/chat/{client_id}")
async def websocket_chat(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time chat."""
    await manager.connect(websocket, client_id)

    try:
        # Send welcome message
        await manager.send_message(client_id, {
            "type": "system",
            "content": "Connexion établie avec A.B.E.L. Comment puis-je vous aider?"
        })

        while True:
            # Receive message from client
            data = await websocket.receive_json()

            if data.get("type") == "message":
                user_message = data.get("content", "")

                # Send acknowledgment
                await manager.send_message(client_id, {
                    "type": "thinking",
                    "content": "Analyse en cours..."
                })

                # TODO: Process with Brain agent
                # For now, echo back
                response = f"[A.B.E.L] J'ai bien reçu: {user_message}"

                await manager.send_message(client_id, {
                    "type": "assistant",
                    "content": response
                })

            elif data.get("type") == "ping":
                await manager.send_message(client_id, {"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error for {client_id}: {e}")
        manager.disconnect(client_id)


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return JSONResponse({
        "message": "A.B.E.L - Adam Beloucif Est Là",
        "status": "online",
        "docs": "/docs"
    })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
