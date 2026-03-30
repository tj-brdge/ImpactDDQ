from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Company, ResearchOutput

router = APIRouter(prefix="/api/companies", tags=["companies"])


@router.post("")
def create_company(payload: dict, db: Session = Depends(get_db)):
    required = ["name", "sector", "stage", "location", "founded_year", "description"]
    for field in required:
        if not payload.get(field):
            raise HTTPException(status_code=400, detail=f"{field} is required")

    company = Company(
        name=payload["name"],
        sector=payload["sector"],
        stage=payload["stage"],
        location=payload["location"],
        founded_year=int(payload["founded_year"]),
        description=payload["description"],
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return {
        "id": company.id,
        "name": company.name,
        "sector": company.sector,
        "stage": company.stage,
        "location": company.location,
        "founded_year": company.founded_year,
        "description": company.description,
    }


@router.get("")
def list_companies(db: Session = Depends(get_db)):
    companies = db.query(Company).all()
    result = []
    for c in companies:
        research_count = db.query(ResearchOutput).filter(
            ResearchOutput.company_id == c.id,
            ResearchOutput.status == "approved",
        ).count()
        result.append({
            "id": c.id,
            "name": c.name,
            "sector": c.sector,
            "stage": c.stage,
            "location": c.location,
            "founded_year": c.founded_year,
            "description": c.description,
            "status": "researched" if research_count > 0 else "not researched",
            "research_count": research_count,
        })
    return result


@router.get("/{company_id}")
def get_company(company_id: int, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        return {"error": "Company not found"}, 404

    outputs = db.query(ResearchOutput).filter(
        ResearchOutput.company_id == company_id
    ).all()

    return {
        "id": company.id,
        "name": company.name,
        "sector": company.sector,
        "stage": company.stage,
        "location": company.location,
        "founded_year": company.founded_year,
        "description": company.description,
        "research_outputs": [
            {
                "id": o.id,
                "ddq_output": o.ddq_output,
                "source_documents": o.source_documents,
                "status": o.status,
                "analyst_feedback": o.analyst_feedback,
                "created_at": o.created_at.isoformat() if o.created_at else None,
                "tags": [t.name for t in o.tags],
            }
            for o in outputs
        ],
    }
