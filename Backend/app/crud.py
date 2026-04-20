from sqlalchemy.orm import Session

from . import models


def create_submission(
    db: Session, content: str, ai_reply: str
) -> models.ContentSubmission:
    entry = models.ContentSubmission(content=content, ai_reply=ai_reply)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def list_submissions(db: Session, limit: int = 50) -> list[models.ContentSubmission]:
    return (
        db.query(models.ContentSubmission)
        .order_by(models.ContentSubmission.created_at.desc())
        .limit(limit)
        .all()
    )


def get_submission(db: Session, submission_id: int) -> models.ContentSubmission | None:
    return (
        db.query(models.ContentSubmission)
        .filter(models.ContentSubmission.id == submission_id)
        .first()
    )
