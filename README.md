# A.B.E.L - Adam Beloucif Est Là

<!-- adam-badges:start -->
[![commits](https://img.shields.io/github/commit-activity/t/Adam-Blf/A.B.E.L?color=001329&label=commits&style=flat-square)](https://github.com/Adam-Blf/A.B.E.L/commits) [![visites](https://hits.sh/github.com/Adam-Blf/A.B.E.L.svg?style=flat-square&label=visites&color=001329)](https://hits.sh/github.com/Adam-Blf/A.B.E.L/) [![last commit](https://img.shields.io/github/last-commit/Adam-Blf/A.B.E.L?color=D4A437&style=flat-square&label=dernier%20push)](https://github.com/Adam-Blf/A.B.E.L/commits) [![top language](https://img.shields.io/github/languages/top/Adam-Blf/A.B.E.L?style=flat-square)](https://github.com/Adam-Blf/A.B.E.L) [![license](https://img.shields.io/github/license/Adam-Blf/A.B.E.L?style=flat-square&color=D4A437)](LICENSE)
<!-- adam-badges:end -->


![Status](https://img.shields.io/badge/status-wip-yellow)
![React](https://img.shields.io/badge/React_18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)

> **Assistant Personnel Intelligent** - Interface Cyberpunk PWA avec Chat AI, Mémoire RAG & Proxy API Universel

## Architecture

```mermaid
flowchart TB
    PWA["Client React 18 + Vite 6<br/>PWA · Workbox · TypeScript strict"]
    PAGES["Pages<br/>Intro HUD · Home · Chat · System · Settings"]
    STORE["État Zustand<br/>hooks/useAbelChat.ts · stores"]
    API["Backend FastAPI<br/>server/app/main.py · endpoints api/"]
    CORE["Core<br/>core/config.py · core/database.py"]
    BRAIN["Service Brain<br/>services/brain.py · orchestration LLM"]
    MEM["Service Memory<br/>services/memory.py · RAG"]
    DB["Supabase + pgvector<br/>mémoire vectorielle"]
    LLM["LangChain + OpenAI<br/>génération réponses"]

    PWA --> PAGES
    PAGES --> STORE
    STORE -->|WebSocket / HTTP| API
    API --> CORE
    API --> BRAIN
    BRAIN --> MEM
    MEM --> DB
    CORE --> DB
    BRAIN --> LLM
```

## Features

- [x] PWA installable (iOS, Android, Desktop)
- [x] Animation intro HUD Cyberpunk
- [x] Interface Command Center
- [x] Chat AI temps réel (WebSocket)
- [ ] Mémoire RAG avec pgvector
- [ ] Proxy API Universel (+1400 APIs)
- [ ] Authentification biométrique (face-api.js)
- [ ] Intégration Deezer

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite 6 + TypeScript |
| PWA | vite-plugin-pwa + Workbox |
| Styling | Tailwind CSS + Framer Motion |
| State | Zustand |
| Backend | FastAPI (Python) |
| Database | Supabase + pgvector |
| LLM | LangChain + OpenAI |

## Installation

### Prerequisites
- Node.js 20+
- Python 3.11+
- Compte Supabase (gratuit)

### Frontend

```bash
cd client
npm install
npm run dev
```

### Backend

```bash
cd server
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Environment Variables

Copier `.env.example` vers `.env` et remplir les valeurs :

```bash
cp .env.example .env
```

## Structure

```
A.B.E.L/
├── client/              # Frontend React PWA
│   ├── src/
│   │   ├── components/  # UI Components
│   │   ├── pages/       # App Pages
│   │   ├── hooks/       # Custom Hooks
│   │   └── stores/      # Zustand Stores
│   └── public/          # Static Assets
│
├── server/              # Backend FastAPI
│   ├── app/
│   │   ├── api/         # Endpoints
│   │   ├── core/        # Config & DB
│   │   └── services/    # Business Logic
│   └── scripts/         # Utilities
│
└── docs/                # Documentation
```

## Commands

```bash
# Development
npm run dev          # Start frontend
uvicorn app.main:app --reload  # Start backend

# Build
npm run build        # Build PWA
npm run preview      # Preview build
```

## Changelog

### v1.0.0 (2025-01-20)
- Initial release
- PWA setup with vite-plugin-pwa
- Cyberpunk UI components
- Animation intro HUD
- Basic chat interface

---

**Author**: Adam Beloucif


---

<p align="center">
  <sub>Par <a href="https://adam.beloucif.com">Adam Beloucif</a> · Data Engineer &amp; Fullstack Developer · <a href="https://github.com/Adam-Blf">GitHub</a> · <a href="https://www.linkedin.com/in/adambeloucif/">LinkedIn</a></sub>
</p>