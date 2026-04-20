---
name: fastapi-postgres
description: Guidance for building Python FastAPI services backed by PostgreSQL in this workspace, including project layout, SQLAlchemy models, Pydantic schemas, async endpoints, CORS, migrations with Alembic, and environment configuration. Use whenever the user is working on files in the Backend/ folder or any FastAPI / SQLAlchemy / Alembic file.
---

# FastAPI + PostgreSQL Skill

Apply these conventions whenever you touch Python backend code in this
workspace (primarily the `Backend/` folder).

## Project layout

```
Backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI app + CORS + router wiring
│   ├── config.py        # Settings loaded from env
│   ├── database.py      # SQLAlchemy engine + SessionLocal + Base
│   ├── models.py        # SQLAlchemy ORM models
│   ├── schemas.py       # Pydantic request/response models
│   ├── crud.py          # DB access helpers
│   ├── llm.py           # LangChain AzureChatOpenAI wrapper
│   └── routers/
│       └── pages.py     # /api/pages endpoints
├── requirements.txt
├── .env.example
└── alembic/             # (optional) migrations
```

## Coding rules

1. Use **FastAPI** with Pydantic v2 models for request/response validation.
2. Use **SQLAlchemy 2.x** (sync style is fine; use async only if the rest of
   the stack is async).
3. Keep HTTP concerns (routers) separate from persistence (crud / models).
4. Type every function signature. Prefer `list[Foo]` over `List[Foo]`.
5. Load configuration from environment variables via `pydantic-settings`
   (`BaseSettings`). Never hard-code secrets or DB URLs.
6. Return Pydantic response models from routes; don't return raw ORM
   objects.

## Database

- Connection URL format:
  `postgresql+psycopg2://<user>:<password>@<host>:<port>/<db>`
- Driver: `psycopg2-binary` (sync) or `asyncpg` (async).
- Use a single `SessionLocal` and a `get_db()` dependency that yields a
  session and closes it in `finally`.
- Create tables at startup with `Base.metadata.create_all(bind=engine)` for
  quick setup, or use **Alembic** for real migrations.

Reference `database.py`:

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

## CORS

- The React frontend runs on `http://localhost:5173` (Vite default).
- Register `CORSMiddleware` with that origin (plus any others from config).

```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Endpoints

- Prefix API routes with `/api`.
- Use explicit `status_code=` on POSTs that create rows (usually 201).
- Validate inputs via Pydantic — no manual `request.json()` parsing.

## Dev commands

```bash
cd Backend
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                 # then edit DATABASE_URL
uvicorn app.main:app --reload --port 8000
# Interactive docs: http://localhost:8000/docs
```

## Environment variables

Document every variable in `.env.example`:

```
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/reactpy
CORS_ORIGINS=http://localhost:5173
AZURE_OPENAI_ENDPOINT=https://<resource>.openai.azure.com/
AZURE_OPENAI_API_KEY=<key>
AZURE_OPENAI_DEPLOYMENT=<deployment-name>
AZURE_OPENAI_API_VERSION=2024-08-01-preview
MAX_RESPONSE_WORDS=250
```

## LangChain + Azure OpenAI

- Use `langchain-openai`'s `AzureChatOpenAI` (NOT `ChatOpenAI`).
- Construct the client once (memoize with `functools.lru_cache`) and reuse
  it per request.
- Pass `azure_endpoint`, `api_key`, `azure_deployment`, `api_version`.
- Send messages using `SystemMessage` + `HumanMessage` from
  `langchain_core.messages`.
- Instruct the model in the system prompt to stay within the word limit,
  and post-process the reply to **hard-trim** any overflow as a safety net.
- Raise a `RuntimeError` (mapped to HTTP 503) if Azure OpenAI env vars are
  missing; map other client errors to HTTP 502.

## Do / Don't

- DO use dependency injection (`Depends`) for DB sessions and auth.
- DO keep routers thin — push logic into `crud.py` or a service layer.
- DON'T commit `.env` — only `.env.example`.
- DON'T return SQLAlchemy models directly; map through Pydantic schemas
  with `model_config = ConfigDict(from_attributes=True)`.
