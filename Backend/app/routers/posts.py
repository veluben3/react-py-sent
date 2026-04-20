from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db
from ..llm import count_words, generate_reply

router = APIRouter(prefix="/api/posts", tags=["posts"])


@router.post(
    "",
    response_model=schemas.PostOut,
    status_code=status.HTTP_201_CREATED,
)
def create_post(
    payload: schemas.PostCreate,
    db: Session = Depends(get_db),
) -> schemas.PostOut:
    """Create a post by sending its content to Azure OpenAI, then storing the
    original + converted (AI-transformed) versions in PostgreSQL."""
    try:
        converted = generate_reply(payload.content)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Azure OpenAI call failed: {exc}",
        ) from exc

    try:
        post = crud.create_post(
            db=db,
            title=payload.title.strip(),
            original_content=payload.content,
            converted_content=converted,
            word_count=count_words(converted),
        )
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {exc}",
        ) from exc

    return schemas.PostOut.model_validate(post)


@router.get("", response_model=list[schemas.PostOut])
def list_posts(db: Session = Depends(get_db)) -> list[schemas.PostOut]:
    rows = crud.list_posts(db)
    return [schemas.PostOut.model_validate(r) for r in rows]


@router.get("/{post_id}", response_model=schemas.PostOut)
def get_post(post_id: int, db: Session = Depends(get_db)) -> schemas.PostOut:
    post = crud.get_post(db, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return schemas.PostOut.model_validate(post)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: int, db: Session = Depends(get_db)) -> None:
    deleted = crud.delete_post(db, post_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Post not found")
