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


def create_post(
    db: Session,
    title: str,
    original_content: str,
    converted_content: str,
    word_count: int,
) -> models.Post:
    post = models.Post(
        title=title,
        original_content=original_content,
        converted_content=converted_content,
        word_count=word_count,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


def list_posts(db: Session, limit: int = 100) -> list[models.Post]:
    return (
        db.query(models.Post)
        .order_by(models.Post.created_at.desc())
        .limit(limit)
        .all()
    )


def get_post(db: Session, post_id: int) -> models.Post | None:
    return db.query(models.Post).filter(models.Post.id == post_id).first()


def delete_post(db: Session, post_id: int) -> bool:
    post = get_post(db, post_id)
    if post is None:
        return False
    db.delete(post)
    db.commit()
    return True
