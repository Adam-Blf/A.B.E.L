# A.B.E.L - Instructions Claude Code

## Projet
- **Nom**: A.B.E.L (Adam Beloucif Est Là)
- **Type**: PWA Assistant Personnel Intelligent
- **Auteur**: Adam Beloucif

## Stack
- **Frontend**: React 18 + Vite 6 + TypeScript + Tailwind + Framer Motion
- **Backend**: FastAPI (Python)
- **Database**: Supabase + pgvector
- **LLM**: LangChain + OpenAI

## Agents Virtuels
- **@Agent_Researcher**: Vérifie docs avec Context7 avant implémentation
- **@Agent_UI**: Interface Cyberpunk + animations Framer Motion
- **@Agent_Connector**: Proxy API universel
- **@Agent_Brain**: LLM orchestration + RAG

## Conventions
- Dark mode par défaut
- Néons cyan (#00f5ff) et magenta (#ff00ff)
- Glassmorphism + animations fluides
- TypeScript strict
- Commits sans mention IA

## Commandes
```bash
# Frontend
cd client && npm run dev

# Backend
cd server && uvicorn app.main:app --reload
```

## Règles
1. Utiliser Context7 avant toute librairie inconnue
2. Push immédiat après chaque modification
3. README à jour obligatoire
4. Audit sécurité avant commit
