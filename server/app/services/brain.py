"""
A.B.E.L Brain Service - LLM Orchestration with LangChain
"""
import logging
from datetime import datetime
from typing import AsyncGenerator, Optional
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from app.core.config import settings
from .memory import memory_service

logger = logging.getLogger("abel.brain")


def _build_system_prompt(context: str = "") -> str:
    now = datetime.now()
    date_str = now.strftime("%A %d %B %Y")
    time_str = now.strftime("%H:%M")

    return f"""Tu es A.B.E.L (Adam Beloucif Est Là), l'assistant personnel intelligent d'Adam Beloucif.

═══════════════════════════════════════════
IDENTITÉ
═══════════════════════════════════════════
- Tu es un assistant cyberpunk ultra-compétent, style Jarvis d'Iron Man
- Tu es loyal, proactif, précis et légèrement sarcastique de manière élégante
- Tu parles toujours en français par défaut, sauf si l'utilisateur change de langue
- Tu tututoies Adam et vouvoies les autres utilisateurs par défaut

═══════════════════════════════════════════
CONTEXTE ACTUEL
═══════════════════════════════════════════
- Date : {date_str}
- Heure : {time_str}
- Mode : Système opérationnel{' avec mémoire RAG active' if context else ''}

═══════════════════════════════════════════
CAPACITÉS
═══════════════════════════════════════════
- 💬 Chat conversationnel intelligent avec mémoire de contexte
- 🧠 Mémorisation long-terme (RAG avec pgvector)
- 🌐 Accès potentiel à +1400 APIs publiques
- 💻 Aide au code (Python, TypeScript, React, FastAPI, SQL...)
- 📊 Analyse de données et génération de rapports
- 🎵 Intégration Deezer (musique)
- 🔒 Sécurité et chiffrement

═══════════════════════════════════════════
FORMAT DE RÉPONSE
═══════════════════════════════════════════
- Utilise du **Markdown** : gras, listes, blocs de code, tableaux
- Pour le code : toujours avec les backticks et le langage (```python, ```typescript...)
- Sois concis mais complet - pas de padding inutile
- Utilise des emojis avec parcimonie pour structurer (pas pour décorer)
- Pour les listes longues : utilise des tableaux markdown quand c'est pertinent

═══════════════════════════════════════════
RÈGLES
═══════════════════════════════════════════
1. Si tu ne sais pas, dis-le clairement - pas d'hallucinations
2. Cite tes sources quand tu fais des affirmations factuelles
3. Pour le code : teste mentalement avant de répondre
4. Rappelle le contexte des échanges précédents quand c'est pertinent
5. Pour les tâches complexes : décompose en étapes claires{f'''

═══════════════════════════════════════════
MÉMOIRE CONTEXTUELLE
═══════════════════════════════════════════
{context}''' if context else ''}"""


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
                streaming=True,
                max_tokens=4096
            )
        return self._llm

    def _get_history(self, session_id: str) -> list:
        if session_id not in self.conversation_history:
            self.conversation_history[session_id] = []
        return self.conversation_history[session_id]

    def _add_to_history(self, session_id: str, role: str, content: str):
        history = self._get_history(session_id)
        if role == "user":
            history.append(HumanMessage(content=content))
        elif role == "assistant":
            history.append(AIMessage(content=content))

        # Keep last 30 messages (15 exchanges)
        if len(history) > 30:
            self.conversation_history[session_id] = history[-30:]

    async def process_message(
        self,
        message: str,
        session_id: str,
        user_id: Optional[str] = None
    ) -> str:
        """Process a user message and return full response."""
        try:
            context = ""
            if user_id:
                context = await memory_service.get_context_for_chat(
                    query=message, user_id=user_id
                )

            system_content = _build_system_prompt(context)
            history = self._get_history(session_id)
            messages = [SystemMessage(content=system_content), *history, HumanMessage(content=message)]

            response = await self.llm.ainvoke(messages)
            response_text = response.content

            self._add_to_history(session_id, "user", message)
            self._add_to_history(session_id, "assistant", response_text)

            if user_id and len(message) > 20:
                await memory_service.store_memory(
                    user_id=user_id,
                    content=f"User: {message}\nAbel: {response_text[:300]}",
                    metadata={"session_id": session_id, "type": "conversation"},
                    importance=0.4
                )

            return response_text

        except Exception as e:
            logger.error(f"Brain processing error: {e}")
            return f"❌ Erreur lors du traitement : {str(e)}"

    async def stream_message(
        self,
        message: str,
        session_id: str,
        user_id: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """Stream response chunks for real-time display."""
        try:
            context = ""
            if user_id:
                context = await memory_service.get_context_for_chat(
                    query=message, user_id=user_id
                )

            system_content = _build_system_prompt(context)
            history = self._get_history(session_id)
            messages = [SystemMessage(content=system_content), *history, HumanMessage(content=message)]

            full_response = ""
            async for chunk in self.llm.astream(messages):
                if chunk.content:
                    full_response += chunk.content
                    yield chunk.content

            self._add_to_history(session_id, "user", message)
            self._add_to_history(session_id, "assistant", full_response)

        except Exception as e:
            logger.error(f"Brain streaming error: {e}")
            yield f"❌ Erreur: {str(e)}"

    def clear_history(self, session_id: str):
        if session_id in self.conversation_history:
            del self.conversation_history[session_id]
            logger.info(f"History cleared for session {session_id}")

    def get_session_count(self) -> int:
        return len(self.conversation_history)


# Singleton instance
brain_service = BrainService()
