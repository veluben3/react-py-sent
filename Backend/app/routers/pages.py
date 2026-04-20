from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db
from ..llm import count_words, generate_reply

router = APIRouter(prefix="/api/pages", tags=["pages"])


@router.post(
    "",
    response_model=schemas.SubmitResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_content(
    payload: schemas.ContentPayload,
    db: Session = Depends(get_db),
) -> schemas.SubmitResponse:
    try:
        ai_reply = generate_reply(payload.content)
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
        entry = crud.create_submission(db, payload.content, ai_reply)
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {exc}",
        ) from exc

    return schemas.SubmitResponse(
        id=entry.id,
        message="Content processed successfully.",
        received_chars=len(payload.content),
        ai_reply=ai_reply,
        word_count=count_words(ai_reply),
    )


@router.get("", response_model=list[schemas.ContentSubmissionOut])
def list_submissions(
    db: Session = Depends(get_db),
) -> list[schemas.ContentSubmissionOut]:
    rows = crud.list_submissions(db)
    return [schemas.ContentSubmissionOut.model_validate(r) for r in rows]


@router.get("/{submission_id}", response_model=schemas.ContentSubmissionOut)
def get_submission(
    submission_id: int,
    db: Session = Depends(get_db),
) -> schemas.ContentSubmissionOut:
    entry = crud.get_submission(db, submission_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    return schemas.ContentSubmissionOut.model_validate(entry)
