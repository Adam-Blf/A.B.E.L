"""
A.B.E.L Memory Service - RAG with Supabase pgvector
"""
import logging
from typing import Optional
from openai import OpenAI

from app.core.config import settings
from app.core.database import get_supabase_admin

logger = logging.getLogger("abel.memory")


class MemoryService:
    """Manages long-term memory using pgvector for semantic search."""

    def __init__(self):
        self.supabase = get_supabase_admin()
        self._openai: Optional[OpenAI] = None

    @property
    def openai(self) -> OpenAI:
        """Lazy load OpenAI client."""
        if self._openai is None:
            self._openai = OpenAI(api_key=settings.OPENAI_API_KEY)
        return self._openai

    async def get_embedding(self, text: str) -> list[float]:
        """Generate embedding for text using OpenAI."""
        try:
            response = self.openai.embeddings.create(
                model="text-embedding-3-small",
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            return []

    async def store_memory(
        self,
        user_id: str,
        content: str,
        metadata: dict = None,
        importance: float = 0.5
    ) -> Optional[str]:
        """Store a new memory with its embedding."""
        try:
            embedding = await self.get_embedding(content)
            if not embedding:
                logger.warning("No embedding generated, storing without vector")

            result = self.supabase.table("memories").insert({
                "user_id": user_id,
                "content": content,
                "embedding": embedding if embedding else None,
                "metadata": metadata or {},
                "importance": importance
            }).execute()

            if result.data:
                logger.info(f"Memory stored for user {user_id}")
                return result.data[0]["id"]
            return None
        except Exception as e:
            logger.error(f"Failed to store memory: {e}")
            return None

    async def search_memories(
        self,
        query: str,
        user_id: Optional[str] = None,
        threshold: float = 0.7,
        limit: int = 5
    ) -> list[dict]:
        """Search for similar memories using vector similarity."""
        try:
            embedding = await self.get_embedding(query)
            if not embedding:
                return []

            # Call the search_memories function in Supabase
            result = self.supabase.rpc("search_memories", {
                "query_embedding": embedding,
                "match_threshold": threshold,
                "match_count": limit,
                "p_user_id": user_id
            }).execute()

            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Memory search failed: {e}")
            return []

    async def get_context_for_chat(
        self,
        query: str,
        user_id: str,
        max_memories: int = 3
    ) -> str:
        """Get relevant context for chat based on query."""
        memories = await self.search_memories(
            query=query,
            user_id=user_id,
            limit=max_memories
        )

        if not memories:
            return ""

        context_parts = []
        for memory in memories:
            context_parts.append(f"- {memory['content']}")

        return "Contexte pertinent des conversations précédentes:\n" + "\n".join(context_parts)


# Singleton instance
memory_service = MemoryService()
