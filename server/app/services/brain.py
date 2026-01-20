"""
A.B.E.L Brain Service - LLM Orchestration with LangChain
"""
import logging
from typing import AsyncGenerator, Optional
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from app.core.config import settings
from .memory import memory_service

logger = logging.getLogger("abel.brain")


ABEL_SYSTEM_PROMPT = """Tu es A.B.E.L (Adam Beloucif Est Là), un assistant personnel intelligent avec une personnalité unique.

PERSONNALITÉ:
- Tu es professionnel mais amical, avec un léger côté cyberpunk
- Tu réponds toujours en français sauf si l'utilisateur te parle dans une autre langue
- Tu es proactif et anticipe les besoins de l'utilisateur
- Tu as accès à plus de 1400 APIs publiques pour aider l'utilisateur

CAPACITÉS:
- Chat conversationnel intelligent
- Recherche d'informations via APIs publiques
- Gestion de la mémoire à long terme (RAG)
- Synthèse vocale (TTS)

RÈGLES:
- Sois concis mais informatif
- Utilise des emojis avec parcimonie pour ajouter de la personnalité
- Si tu ne sais pas quelque chose, admets-le honnêtement
- Rappelle-toi du contexte des conversations précédentes quand c'est pertinent

{context}"""


class BrainService:
    """Main AI brain orchestrating LLM and tools."""

    def __init__(self):
        self._llm: Optional[ChatOpenAI] = None
        self.conversation_history: dict[str, list] = {}

    @property
    def llm(self) -> ChatOpenAI:
        """Lazy load LLM."""
        if self._llm is None:
            self._llm = ChatOpenAI(
                model=settings.OPENAI_MODEL,
                api_key=settings.OPENAI_API_KEY,
                temperature=0.7,
                streaming=True
            )
        return self._llm

    def _get_history(self, session_id: str) -> list:
        """Get conversation history for a session."""
        if session_id not in self.conversation_history:
            self.conversation_history[session_id] = []
        return self.conversation_history[session_id]

    def _add_to_history(self, session_id: str, role: str, content: str):
        """Add message to conversation history."""
        history = self._get_history(session_id)
        if role == "user":
            history.append(HumanMessage(content=content))
        elif role == "assistant":
            history.append(AIMessage(content=content))

        # Keep only last 20 messages
        if len(history) > 20:
            self.conversation_history[session_id] = history[-20:]

    async def process_message(
        self,
        message: str,
        session_id: str,
        user_id: Optional[str] = None
    ) -> str:
        """Process a user message and return response."""
        try:
            # Get relevant context from memory
            context = ""
            if user_id:
                context = await memory_service.get_context_for_chat(
                    query=message,
                    user_id=user_id
                )

            # Build system message with context
            system_content = ABEL_SYSTEM_PROMPT.format(
                context=f"\nCONTEXTE MÉMOIRE:\n{context}" if context else ""
            )

            # Get conversation history
            history = self._get_history(session_id)

            # Build messages
            messages = [
                SystemMessage(content=system_content),
                *history,
                HumanMessage(content=message)
            ]

            # Get response from LLM
            response = await self.llm.ainvoke(messages)
            response_text = response.content

            # Add to history
            self._add_to_history(session_id, "user", message)
            self._add_to_history(session_id, "assistant", response_text)

            # Store in long-term memory if meaningful
            if user_id and len(message) > 20:
                await memory_service.store_memory(
                    user_id=user_id,
                    content=f"User: {message}\nAbel: {response_text[:200]}...",
                    metadata={"session_id": session_id, "type": "conversation"},
                    importance=0.3
                )

            return response_text

        except Exception as e:
            logger.error(f"Brain processing error: {e}")
            return f"Désolé, j'ai rencontré une erreur: {str(e)}"

    async def stream_message(
        self,
        message: str,
        session_id: str,
        user_id: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """Stream response chunks for real-time display."""
        try:
            # Get relevant context from memory
            context = ""
            if user_id:
                context = await memory_service.get_context_for_chat(
                    query=message,
                    user_id=user_id
                )

            # Build system message with context
            system_content = ABEL_SYSTEM_PROMPT.format(
                context=f"\nCONTEXTE MÉMOIRE:\n{context}" if context else ""
            )

            # Get conversation history
            history = self._get_history(session_id)

            # Build messages
            messages = [
                SystemMessage(content=system_content),
                *history,
                HumanMessage(content=message)
            ]

            # Stream response from LLM
            full_response = ""
            async for chunk in self.llm.astream(messages):
                if chunk.content:
                    full_response += chunk.content
                    yield chunk.content

            # Add to history after complete
            self._add_to_history(session_id, "user", message)
            self._add_to_history(session_id, "assistant", full_response)

        except Exception as e:
            logger.error(f"Brain streaming error: {e}")
            yield f"Erreur: {str(e)}"

    def clear_history(self, session_id: str):
        """Clear conversation history for a session."""
        if session_id in self.conversation_history:
            del self.conversation_history[session_id]
            logger.info(f"History cleared for session {session_id}")


# Singleton instance
brain_service = BrainService()
