"""
A.B.E.L Brain Service — Multi-Provider LLM + Agent avec outils

Priorité automatique:
  1. Ollama   (local, 100% gratuit, aucune limite)
  2. Groq     (cloud gratuit, 14 400 req/j sur Llama 3.3 70B)
  3. OpenAI   (payant, fallback)
  4. Mock     (simulation si rien de disponible)
"""
import logging
import re
import json
from datetime import datetime
from typing import AsyncGenerator, Optional, Any
import httpx

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.language_models.chat_models import BaseChatModel

from app.core.config import settings
from .tools import (
    TOOLS_DESCRIPTION,
    parse_tool_calls,
    strip_tool_calls,
    execute_tool,
    get_datetime,
)

logger = logging.getLogger("abel.brain")


# ─── Provider detection ────────────────────────────────────────────────────────

async def _check_ollama() -> bool:
    """Teste si Ollama est actif."""
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            r = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            return r.status_code == 200
    except Exception:
        return False


def _create_ollama() -> BaseChatModel:
    from langchain_ollama import ChatOllama
    return ChatOllama(
        model=settings.OLLAMA_MODEL,
        base_url=settings.OLLAMA_BASE_URL,
        temperature=0.7,
        num_predict=4096,
    )


def _create_groq() -> BaseChatModel:
    from langchain_groq import ChatGroq
    return ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model_name=settings.GROQ_MODEL,
        temperature=0.7,
        max_tokens=4096,
        streaming=True,
    )


def _create_openai() -> BaseChatModel:
    from langchain_openai import ChatOpenAI
    return ChatOpenAI(
        model=settings.OPENAI_MODEL,
        api_key=settings.OPENAI_API_KEY,
        temperature=0.7,
        streaming=True,
        max_tokens=4096,
    )


# ─── System Prompt ─────────────────────────────────────────────────────────────

def _build_system_prompt(context: str = "", with_tools: bool = True) -> str:
    now = datetime.now()
    days_fr = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
    months_fr = ["", "janvier", "février", "mars", "avril", "mai", "juin",
                 "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
    date_str = f"{days_fr[now.weekday()]} {now.day} {months_fr[now.month]} {now.year}"
    time_str = now.strftime("%H:%M")

    tools_section = f"\n{TOOLS_DESCRIPTION}" if with_tools else ""

    return f"""Tu es A.B.E.L (Adam Beloucif Est Là), l'assistant personnel intelligent d'Adam Beloucif.
Style : Jarvis d'Iron Man — loyal, précis, proactif, légèrement sarcastique avec élégance.

═══════════════════════════════════════════
CONTEXTE
═══════════════════════════════════════════
Date : {date_str} | Heure : {time_str}
Langue par défaut : français (change selon l'interlocuteur)

═══════════════════════════════════════════
CAPACITÉS
═══════════════════════════════════════════
- 💬 Conversation intelligente avec mémoire de session
- 🔍 Recherche web en temps réel (DuckDuckGo)
- 🌤️ Météo en temps réel (wttr.in)
- 🧮 Calculs et mathématiques avancées
- 💱 Conversion de devises
- 🌐 Lecture et résumé de pages web
- 💻 Code (Python, TypeScript, React, FastAPI, SQL, ML...)
- 🧠 Machine Learning et Data Science
- 📝 Rédaction, traduction, résumé de textes
- 📊 Analyse de données et statistiques{tools_section}

═══════════════════════════════════════════
FORMAT DES RÉPONSES
═══════════════════════════════════════════
- Utilise du **Markdown** : gras, listes, blocs de code, tableaux
- Code : toujours avec les backticks et le langage (```python, ```typescript...)
- Sois concis mais complet — pas de remplissage inutile
- Emojis avec parcimonie pour structurer, pas décorer

═══════════════════════════════════════════
RÈGLES
═══════════════════════════════════════════
1. Si tu ne sais pas, dis-le — pas d'hallucinations
2. Pour les infos récentes/actuelles : utilise search_web
3. Pour la météo : utilise get_weather
4. Pour les calculs : utilise calculate si nécessaire
5. Rappelle le contexte des échanges précédents{f'''
═══════════════════════════════════════════
MÉMOIRE CONTEXTUELLE
═══════════════════════════════════════════
{context}''' if context else ''}"""


# ─── Brain Service ─────────────────────────────────────────────────────────────

class BrainService:
    """Orchestrateur LLM multi-provider avec agent tools."""

    def __init__(self):
        self._llm: Optional[BaseChatModel] = None
        self._provider: str = "unknown"
        self._model_name: str = "unknown"
        self._ollama_available: bool = False
        self.conversation_history: dict[str, list] = {}

    @property
    def provider(self) -> str:
        return self._provider

    @property
    def model_name(self) -> str:
        return self._model_name

    async def initialize(self):
        """Initialise le LLM en détectant le meilleur provider."""
        provider = settings.LLM_PROVIDER

        if provider == "mock":
            self._provider = "mock"
            self._model_name = "mock"
            return

        if provider in ("auto", "ollama"):
            self._ollama_available = await _check_ollama()
            if self._ollama_available:
                try:
                    self._llm = _create_ollama()
                    self._provider = "ollama"
                    self._model_name = settings.OLLAMA_MODEL
                    logger.info(f"✅ Ollama initialisé: {self._model_name}")
                    return
                except Exception as e:
                    logger.warning(f"Ollama init failed: {e}")

            if provider == "ollama":
                logger.error("Ollama demandé mais non disponible")
                self._provider = "mock"
                self._model_name = "mock"
                return

        if provider in ("auto", "groq") and settings.has_groq:
            try:
                self._llm = _create_groq()
                self._provider = "groq"
                self._model_name = settings.GROQ_MODEL
                logger.info(f"✅ Groq initialisé: {self._model_name}")
                return
            except Exception as e:
                logger.warning(f"Groq init failed: {e}")

        if provider in ("auto", "openai") and settings.has_openai:
            try:
                self._llm = _create_openai()
                self._provider = "openai"
                self._model_name = settings.OPENAI_MODEL
                logger.info(f"✅ OpenAI initialisé: {self._model_name}")
                return
            except Exception as e:
                logger.warning(f"OpenAI init failed: {e}")

        logger.warning("⚠️ Aucun LLM disponible — mode simulation")
        self._provider = "mock"
        self._model_name = "simulation"

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
        # Keep last 30 messages
        if len(history) > 30:
            self.conversation_history[session_id] = history[-30:]

    async def _run_with_tools(self, messages: list, session_id: str) -> str:
        """Exécute le LLM avec support d'outils (agent loop)."""
        if not self._llm:
            return self._mock_response(messages[-1].content if messages else "")

        response = await self._llm.ainvoke(messages)
        text = response.content

        # Parse tool calls
        tool_calls = parse_tool_calls(text)

        if not tool_calls:
            return text

        # Execute tools and collect results
        tool_results = []
        for call in tool_calls[:settings.MAX_TOOL_ITERATIONS]:
            logger.info(f"Executing tool: {call['name']} with {call['params']}")
            result = await execute_tool(call["name"], call["params"])
            tool_results.append(f"[{call['name']}]\n{result}")

        # Feed results back to LLM for final answer
        clean_text = strip_tool_calls(text)
        context_msg = "\n\n".join(tool_results)

        followup_messages = [
            *messages,
            AIMessage(content=clean_text if clean_text else "Résultats des outils:"),
            HumanMessage(content=f"Voici les résultats des outils:\n\n{context_msg}\n\nSynthétise ces résultats en une réponse complète et utile.")
        ]

        final_response = await self._llm.ainvoke(followup_messages)
        return final_response.content

    async def stream_message(
        self,
        message: str,
        session_id: str,
        user_id: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """Stream la réponse chunk par chunk."""
        if not self._llm or self._provider == "mock":
            async for chunk in self._mock_stream(message):
                yield chunk
            return

        try:
            # Contexte mémoire
            context = ""
            try:
                from .memory import memory_service
                if user_id:
                    context = await memory_service.get_context_for_chat(
                        query=message, user_id=user_id
                    )
            except Exception:
                pass

            system_content = _build_system_prompt(context, with_tools=True)
            history = self._get_history(session_id)
            messages = [SystemMessage(content=system_content), *history, HumanMessage(content=message)]

            # First pass: check for tool calls
            first_response = ""
            async for chunk in self._llm.astream(messages):
                if hasattr(chunk, "content") and chunk.content:
                    first_response += chunk.content

            tool_calls = parse_tool_calls(first_response)

            if tool_calls:
                # Signal tool usage
                yield f"\n*🔧 Utilisation d'outils...*\n\n"

                # Execute tools
                tool_results = []
                for call in tool_calls[:settings.MAX_TOOL_ITERATIONS]:
                    logger.info(f"Tool: {call['name']} params={call['params']}")
                    result = await execute_tool(call["name"], call["params"])
                    tool_results.append(f"[{call['name']}]\n{result}")
                    yield f"*✅ {call['name']} terminé*\n"

                # Second pass: synthesize
                clean_first = strip_tool_calls(first_response)
                context_msg = "\n\n".join(tool_results)
                followup = [
                    *messages,
                    AIMessage(content=clean_first if clean_first else "Outil exécuté."),
                    HumanMessage(content=f"Résultats:\n\n{context_msg}\n\nSynthétise en une réponse claire.")
                ]
                yield "\n"
                full_final = ""
                async for chunk in self._llm.astream(followup):
                    if hasattr(chunk, "content") and chunk.content:
                        full_final += chunk.content
                        yield chunk.content

                self._add_to_history(session_id, "user", message)
                self._add_to_history(session_id, "assistant", full_final)

            else:
                # No tools needed - stream directly
                full_response = ""
                async for chunk in self._llm.astream(messages):
                    if hasattr(chunk, "content") and chunk.content:
                        full_response += chunk.content
                        yield chunk.content

                self._add_to_history(session_id, "user", message)
                self._add_to_history(session_id, "assistant", full_response)

        except Exception as e:
            logger.error(f"Brain streaming error: {e}")
            yield f"❌ Erreur: {str(e)}"

    def _mock_response(self, message: str) -> str:
        """Réponse simulée intelligente."""
        msg_lower = message.lower()

        if any(w in msg_lower for w in ["bonjour", "salut", "hello", "hi", "bonsoir"]):
            return (
                "Bonjour ! Je suis A.B.E.L, votre assistant personnel. "
                "Je fonctionne actuellement en **mode simulation** — aucun LLM configuré.\n\n"
                "**Pour activer l'IA :**\n"
                "1. **Ollama** (gratuit, local) : `ollama pull llama3.2` puis relancez le serveur\n"
                "2. **Groq** (gratuit, cloud) : ajoutez `GROQ_API_KEY=...` dans `server/.env`\n"
                "3. **OpenAI** (payant) : ajoutez `OPENAI_API_KEY=...` dans `server/.env`"
            )

        if any(w in msg_lower for w in ["heure", "date", "jour"]):
            return f"📅 **{get_datetime()}**"

        if any(w in msg_lower for w in ["aide", "help", "commande", "outil"]):
            return (
                "**Outils disponibles dans A.B.E.L :**\n\n"
                "- 🔍 **Recherche web** (DuckDuckGo — gratuit)\n"
                "- 🌤️ **Météo** (wttr.in — gratuit)\n"
                "- 🧮 **Calculatrice** scientifique\n"
                "- 💱 **Conversion devises** (Frankfurter API)\n"
                "- 🌐 **Lecture d'URLs**\n"
                "- 🧠 **Mémoire RAG** (Supabase + pgvector)\n\n"
                "Activez un LLM pour utiliser ces outils automatiquement !"
            )

        if any(w in msg_lower for w in ["modèle", "model", "llm", "ia", "config"]):
            lines = ["**Configuration LLM actuelle :**\n"]
            lines.append(f"- Provider actif : `{self._provider}`")
            lines.append(f"- Modèle : `{self._model_name}`")
            lines.append(f"- Ollama disponible : {'✅' if self._ollama_available else '❌'}")
            lines.append(f"- Groq configuré : {'✅' if settings.has_groq else '❌'}")
            lines.append(f"- OpenAI configuré : {'✅' if settings.has_openai else '❌'}")
            return "\n".join(lines)

        return (
            f"[Mode Simulation]\n\nMessage reçu : *\"{message[:100]}\"*\n\n"
            "**Aucun LLM actif.** Configurez Ollama, Groq ou OpenAI pour des réponses IA réelles."
        )

    async def _mock_stream(self, message: str) -> AsyncGenerator[str, None]:
        """Stream simulé mot par mot."""
        response = self._mock_response(message)
        words = response.split(" ")
        for i, word in enumerate(words):
            yield word + (" " if i < len(words) - 1 else "")

    def clear_history(self, session_id: str):
        if session_id in self.conversation_history:
            del self.conversation_history[session_id]

    def get_session_count(self) -> int:
        return len(self.conversation_history)

    def get_info(self) -> dict:
        return {
            "provider": self._provider,
            "model": self._model_name,
            "ollama_available": self._ollama_available,
            "groq_configured": settings.has_groq,
            "openai_configured": settings.has_openai,
            "tools_enabled": True,
        }


# ─── Singleton ─────────────────────────────────────────────────────────────────

brain_service = BrainService()
