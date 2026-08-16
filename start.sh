#!/usr/bin/env bash
# ╔═══════════════════════════════════════════════════════════════╗
# ║  A.B.E.L — Script de démarrage                               ║
# ║  Lance frontend + backend + affiche l'URL iPhone             ║
# ╚═══════════════════════════════════════════════════════════════╝

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
ORANGE='\033[0;33m'
RED='\033[0;31m'
BOLD='\033[1m'
RESET='\033[0m'

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLIENT="$ROOT/client"
SERVER="$ROOT/server"

# ─── IP locale ──────────────────────────────────────────────────
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || \
           ip route get 1.1.1.1 2>/dev/null | grep -oP 'src \K\S+' || \
           echo "localhost")

echo ""
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════╗${RESET}"
echo -e "${CYAN}${BOLD}║     A.B.E.L — Démarrage              ║${RESET}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════╝${RESET}"
echo ""

# ─── Vérification .env ──────────────────────────────────────────
if [ ! -f "$SERVER/.env" ]; then
    echo -e "${ORANGE}⚠  Fichier .env absent — création depuis .env.example${RESET}"
    cp "$SERVER/.env.example" "$SERVER/.env"
    echo -e "${GREEN}✅ .env créé dans server/${RESET}"
fi

# ─── Vérification Ollama ─────────────────────────────────────────
OLLAMA_STATUS=""
if command -v ollama &>/dev/null; then
    if ollama list 2>/dev/null | grep -q .; then
        MODELS=$(ollama list 2>/dev/null | tail -n +2 | awk '{print $1}' | tr '\n' ', ' | sed 's/,$//')
        OLLAMA_STATUS="${GREEN}✅ Ollama actif — modèles: $MODELS${RESET}"
    else
        OLLAMA_STATUS="${ORANGE}⚠  Ollama installé mais aucun modèle — lancez: ollama pull llama3.2${RESET}"
    fi
else
    OLLAMA_STATUS="${ORANGE}⚠  Ollama non installé — mode Groq/OpenAI (voir server/.env)${RESET}"
fi

# ─── Dépendances npm ─────────────────────────────────────────────
if [ ! -d "$CLIENT/node_modules" ]; then
    echo -e "${CYAN}📦 Installation des dépendances npm...${RESET}"
    cd "$CLIENT" && npm install --silent
    echo -e "${GREEN}✅ npm install terminé${RESET}"
fi

# ─── Affichage URLs ──────────────────────────────────────────────
echo -e "${GREEN}${BOLD}🚀 Démarrage des services...${RESET}"
echo ""
echo -e "  ${BOLD}Frontend${RESET}  → ${CYAN}http://localhost:5173${RESET}"
echo -e "  ${BOLD}Backend${RESET}   → ${CYAN}http://localhost:8000${RESET}"
echo ""
echo -e "${GREEN}${BOLD}📱 URL iPhone (même réseau WiFi) :${RESET}"
echo -e "  ${CYAN}${BOLD}http://${LOCAL_IP}:5173${RESET}"
echo ""
echo -e "  Sur Safari iPhone :"
echo -e "  1. Ouvrez ${CYAN}http://${LOCAL_IP}:5173${RESET}"
echo -e "  2. Tapez ${BOLD}Partager${RESET} → ${BOLD}Sur l'écran d'accueil${RESET}"
echo -e "  3. A.B.E.L est installé comme app !"
echo ""
echo -e "$OLLAMA_STATUS"
echo ""
echo -e "${ORANGE}Ctrl+C pour arrêter tous les services${RESET}"
echo ""

# ─── Lancement ───────────────────────────────────────────────────
cleanup() {
    echo ""
    echo -e "${ORANGE}Arrêt des services A.B.E.L...${RESET}"
    kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# Backend FastAPI
cd "$SERVER"
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload \
    --log-level warning &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend démarré (PID $BACKEND_PID)${RESET}"

# Frontend Vite
cd "$CLIENT"
npm run dev -- --host &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend démarré (PID $FRONTEND_PID)${RESET}"
echo ""

wait
