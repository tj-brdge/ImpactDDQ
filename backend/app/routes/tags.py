from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Tag, ResearchOutput

router = APIRouter(prefix="/api/tags", tags=["tags"])


@router.get("")
def list_tags(db: Session = Depends(get_db)):
    tags = db.query(Tag).all()
    return [{"id": t.id, "name": t.name} for t in tags]


@router.post("/assign")
def assign_tags(payload: dict, db: Session = Depends(get_db)):
    """Assign tags to a research output."""
    research_output_id = payload.get("research_output_id")
    tag_names = payload.get("tags", [])

    output = db.query(ResearchOutput).filter(ResearchOutput.id == research_output_id).first()
    if not output:
        raise HTTPException(status_code=404, detail="Research output not found")

    # Clear existing tags
    output.tags = []

    for name in tag_names:
        tag = db.query(Tag).filter(Tag.name == name).first()
        if not tag:
            tag = Tag(name=name)
            db.add(tag)
            db.flush()
        output.tags.append(tag)

    db.commit()
    return {"status": "ok", "tags": [t.name for t in output.tags]}


@router.get("/distribution")
def tag_distribution(db: Session = Depends(get_db)):
    """Get tag distribution across all research outputs."""
    tags = db.query(Tag).all()
    distribution = []
    for tag in tags:
        count = len(tag.research_outputs)
        if count > 0:
            distribution.append({"name": tag.name, "count": count})
    distribution.sort(key=lambda x: x["count"], reverse=True)
    return distribution
