from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import DDQTemplate

router = APIRouter(prefix="/api/templates", tags=["templates"])


@router.get("")
def list_templates(db: Session = Depends(get_db)):
    templates = db.query(DDQTemplate).all()
    return [
        {
            "id": t.id,
            "name": t.name,
            "description": t.description,
            "sections": t.sections,
            "is_default": t.is_default,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        }
        for t in templates
    ]


@router.get("/{template_id}")
def get_template(template_id: int, db: Session = Depends(get_db)):
    t = db.query(DDQTemplate).filter(DDQTemplate.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    return {
        "id": t.id,
        "name": t.name,
        "description": t.description,
        "sections": t.sections,
        "is_default": t.is_default,
    }


@router.post("")
def create_template(payload: dict, db: Session = Depends(get_db)):
    if not payload.get("name") or not payload.get("sections"):
        raise HTTPException(status_code=400, detail="name and sections are required")

    template = DDQTemplate(
        name=payload["name"],
        description=payload.get("description", ""),
        sections=payload["sections"],
        is_default=False,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return {"id": template.id, "name": template.name}


@router.put("/{template_id}")
def update_template(template_id: int, payload: dict, db: Session = Depends(get_db)):
    template = db.query(DDQTemplate).filter(DDQTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    if "name" in payload:
        template.name = payload["name"]
    if "description" in payload:
        template.description = payload["description"]
    if "sections" in payload:
        template.sections = payload["sections"]
    if "is_default" in payload and payload["is_default"]:
        # Unset other defaults
        db.query(DDQTemplate).filter(DDQTemplate.id != template_id).update({"is_default": False})
        template.is_default = True

    db.commit()
    return {"id": template.id, "name": template.name, "status": "updated"}


@router.delete("/{template_id}")
def delete_template(template_id: int, db: Session = Depends(get_db)):
    template = db.query(DDQTemplate).filter(DDQTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    if template.is_default:
        raise HTTPException(status_code=400, detail="Cannot delete the default template")
    db.delete(template)
    db.commit()
    return {"status": "deleted"}
