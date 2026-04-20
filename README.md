# React-Py

Full-stack starter where a React + TypeScript single page submits **content**
to a **FastAPI** backend. The backend forwards the content to **Azure OpenAI**
via **LangChain** (`AzureChatOpenAI`) and returns a reply limited to
**250 words**. Submissions + AI replies are persisted in **PostgreSQL**.

```
React-Py/
├── .claude/
│   └── skills/
│       ├── reactjs-typescript/SKILL.md
│       └── fastapi-postgres/SKILL.md
├── Frontend/                 # Vite + React 18 + TypeScript
└── Backend/                  # FastAPI + LangChain + SQLAlchemy + Postgres
```

---

## Stack

### Frontend (`Frontend/`)

| Library | Version | Purpose |
| --- | --- | --- |
| React | ^18.3.1 | UI library |
| React DOM | ^18.3.1 | DOM renderer |
| TypeScript | ^5.6.3 | Static typing |
| Vite | ^5.4.10 | Dev server + bundler |
| @vitejs/plugin-react | ^4.3.3 | React fast-refresh plugin |
| **fetch** (native) | — | HTTP calls to backend |

### Backend (`Backend/`)

| Library | Version | Purpose |
| --- | --- | --- |
| FastAPI | 0.115.4 | Web framework |
| Uvicorn | 0.32.0 | ASGI server |
| SQLAlchemy | 2.0.36 | ORM |
| psycopg2-binary | 2.9.10 | PostgreSQL driver |
| Pydantic | 2.9.2 | Validation & response models |
| pydantic-settings | 2.6.1 | Env-based config |
| python-dotenv | 1.0.1 | `.env` loading |
| langchain | 0.3.7 | LLM orchestration |
| langchain-openai | 0.2.8 | `AzureChatOpenAI` client |

### External services

- **Azure OpenAI** — a deployment of a chat model (e.g. `gpt-4o-mini`,
  `gpt-4o`, `gpt-35-turbo`) in your Azure resource.
- **PostgreSQL 14+** — any modern version.

---

## Prerequisites

- **Node.js** 18+ and **npm**
- **Python** 3.10+
- **PostgreSQL** running locally (or reachable by URL)
- **Azure OpenAI resource** with a chat-completions deployment and API key

---

## 1. Database setup

```bash
createdb reactpy
# or
psql -U postgres -c "CREATE DATABASE reactpy;"
```

Default connection string:

```
postgresql+psycopg2://postgres:postgres@localhost:5432/reactpy
```

Tables are **created automatically on startup** via
`Base.metadata.create_all(...)`.

---

## 2. Run the backend

```bash
cd Backend
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env                 # fill in Azure OpenAI + DB values
uvicorn app.main:app --reload --port 8000
# Alt: python -m uvicorn app.main:app --reload --port 8000
```

- API base URL: <http://localhost:8000>
- Swagger docs: <http://localhost:8000/docs>
- Health check: <http://localhost:8000/health>

### Environment variables (`Backend/.env`)

```
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/reactpy
CORS_ORIGINS=http://localhost:5173

AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com/
AZURE_OPENAI_API_KEY=<your-azure-openai-key>
AZURE_OPENAI_DEPLOYMENT=<your-deployment-name>     # e.g. gpt-4o-mini
AZURE_OPENAI_API_VERSION=2024-08-01-preview

MAX_RESPONSE_WORDS=250
```

### Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Health probe |
| `POST` | `/api/pages` | Submit content → Azure OpenAI reply (≤ 250 words) |
| `GET` | `/api/pages` | List latest submissions |
| `GET` | `/api/pages/{id}` | Fetch a single submission |

Example `POST /api/pages` request:

```json
{
  "content": "Summarize the following article into 5 bullet points..."
}
```

Response:

```json
{
  "id": 1,
  "message": "Content processed successfully.",
  "received_chars": 183,
  "ai_reply": "Here are five key takeaways...",
  "word_count": 137
}
```

The server instructs the model to stay within `MAX_RESPONSE_WORDS` words
and additionally **hard-trims** the reply as a safety net, so the returned
`word_count` is guaranteed to be `≤ 250`.

---

## 3. Run the frontend

In a second terminal:

```bash
cd Frontend
npm install
cp .env.example .env                 # VITE_API_URL=http://localhost:8000
npm run dev
```

Open <http://localhost:5173>. Paste any text and click **Submit** — the AI
reply appears inline.

### Frontend scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Serve the production build locally |

---

## 4. Using the app end-to-end

1. Start Postgres.
2. Start the FastAPI backend on port `8000` (`.env` populated with Azure
   OpenAI credentials).
3. Start the Vite frontend on port `5173`.
4. Visit <http://localhost:5173>.
5. Enter content and click **Submit**.
6. Inspect the stored row:
   - <http://localhost:8000/api/pages>
   - `psql reactpy -c "SELECT id, created_at FROM content_submissions;"`

---

## 5. Claude / Cursor skills

This repo ships with two agent skills under `.claude/skills/`:

- `reactjs-typescript` — conventions for the `Frontend/` React + TS code.
- `fastapi-postgres` — conventions for the `Backend/` FastAPI + Postgres code.

Agents with skill support will read these automatically when working in the
respective folders.

---

## 6. Troubleshooting

- **`503 … Azure OpenAI is not configured`** — fill in
  `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT`
  in `Backend/.env` and restart Uvicorn.
- **`502 Azure OpenAI call failed: …`** — wrong endpoint, wrong API version,
  wrong deployment name, or network error. Double-check the values shown in
  the Azure Portal under *Keys and Endpoint* / *Deployments*.
- **CORS errors in the browser** — make sure `CORS_ORIGINS` contains the
  frontend origin (default `http://localhost:5173`).
- **`connection refused` on submit** — ensure the backend is running on
  `:8000` and `VITE_API_URL` points to it.
- **`FATAL: database "reactpy" does not exist`** — create the DB (step 1)
  or point `DATABASE_URL` at an existing DB.
- **`psycopg2` build errors on Python 3.14+** — swap `psycopg2-binary`
  for `psycopg[binary]==3.2.3` in `requirements.txt` and change the DB URL
  scheme to `postgresql+psycopg://...`.
- **Reply looks cut off with a trailing `…`** — that's the 250-word safety
  trim. Increase `MAX_RESPONSE_WORDS` (and `max_tokens` in `app/llm.py`) if
  you want longer responses.
