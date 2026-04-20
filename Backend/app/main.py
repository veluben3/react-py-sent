from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import pages, posts


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Create tables on startup (quick start; use Alembic for real migrations).
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="React-Py Backend",
    version="0.1.0",
    description="FastAPI + PostgreSQL backend for the React-Py 4-pages submission app.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["health"])
def root() -> dict[str, str]:
    return {"status": "ok", "service": "react-py-backend"}


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(pages.router)
app.include_router(posts.router)
