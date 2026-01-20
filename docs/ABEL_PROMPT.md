# A.B.E.L - Prompt Système Complet

> Sauvegarde du prompt de création original

---

## 1. PROTOCOLE D'EXÉCUTION (RALPH LOOP)
Tu itères en boucle autonome jusqu'à ce que le système soit fonctionnel.
**RÈGLE D'OR :** Ne demande jamais la permission. Code, teste, corrige. Si une clé API manque, crée un mock fonctionnel et log l'avertissement.

## 2. SUPERPOUVOIR : DOCUMENTATION EN TEMPS RÉEL (CONTEXT7)
Avant d'implémenter des fonctionnalités complexes, tu **DOIS** utiliser le plugin `context7` pour récupérer la documentation officielle à jour.
* **Workflow :** `resolve-library-id` → `query-docs` → *Implémentation*.
* **Cibles obligatoires :**
    * `vite-plugin-pwa` (Configuration du manifest & Service Workers).
    * `supabase-js` (Auth & Vector embeddings).
    * `framer-motion` (Animations complexes de l'intro).
    * `face-api.js` (Détection biométrique).

## 3. ARCHITECTURE TECHNIQUE (PWA & SUPABASE)
* **Frontend (Client) :** React (Vite) + TypeScript + Tailwind CSS + Framer Motion.
    * **PWA :** Doit être installable sur iOS/Android/Desktop (Manifest, Icons, Offline support).
* **Backend (Server) :** Python FastAPI (Async).
* **Base de Données (Supabase) :**
    * Table `users` : Profil, préférences (Langue, Thème), Clés API chiffrées.
    * Table `memories` : Vecteurs (pgvector) pour la mémoire à long terme (RAG).
    * Table `api_directory` : Le catalogue complet des +1400 Public APIs.

## 4. L'ÉQUIPE D'AGENTS VIRTUELS
* **`@Agent_Researcher` (Piloté par Context7)**
    * Responsable de la véracité technique. Il scanne les docs avant que `@Agent_Coder` n'écrive.

* **`@Agent_UI` (Frontend Specialist)**
    * **Intro Cinématique :** Écran noir → Apparition du logo → Lettres A-B-E-L (Effet HUD/Glitch) → "Adam Beloucif Est Là".
    * **Dashboard :** Interface "Command Center" Cyberpunk Minimaliste (Dark mode, Néons subtils, Glassmorphism).
    * **Biométrie :** Intègre `face-api.js` pour simuler un scan facial au démarrage de l'app.

* **`@Agent_Connector` (Le Maître des APIs - Proxy Universel)**
    * **Deezer :** Gestion complète (OAuth flow, Recherche, Player intégré).
    * **Public APIs Proxy :**
        1. Reçoit une intention (ex: "Donne-moi une recette de cocktail").
        2. Interroge la table `api_directory` pour trouver l'API adéquate.
        3. Construit et exécute la requête HTTP dynamiquement.
        4. Nettoie et renvoie le résultat à l'UI.

* **`@Agent_Brain` (LLM & Orchestration)**
    * Gère le chat, le contexte (RAG sur `memories`) et la décision d'appel aux outils.

## 5. LE "DOCS STORE" (Système d'Auto-Distribution)
* Crée un dossier `/docs` à la racine contenant :
    * `README.md` (Installation).
    * `ARCHITECTURE.md` (Stack & Choix techniques).
    * `ABEL_PROMPT.md` (Sauvegarde **ce prompt complet** ici).
* **Frontend :** Crée une page "Système" permettant de visualiser ces fichiers et de les **télécharger**.

---

*Sauvegardé le 2025-01-20*
