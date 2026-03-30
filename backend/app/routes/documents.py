import fitz  # PyMuPDF
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Company
from app.anonymizer import anonymize_text, build_dictionary

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("/upload")
async def upload_documents(
    company_id: int = Form(...),
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    extracted = []
    for f in files:
        content = await f.read()
        if f.filename.lower().endswith(".pdf"):
            doc = fitz.open(stream=content, filetype="pdf")
            text = "\n\n".join(page.get_text() for page in doc)
            doc.close()
        else:
            text = content.decode("utf-8", errors="replace")

        extracted.append({
            "filename": f.filename,
            "text": text,
            "char_count": len(text),
        })

    return {
        "company_id": company_id,
        "company_name": company.name,
        "documents": extracted,
    }


@router.post("/anonymize")
async def anonymize_documents(
    payload: dict,
    db: Session = Depends(get_db),
):
    company_id = payload.get("company_id")
    text = payload.get("text", "")

    companies = db.query(Company).all()
    known_entities = build_dictionary(companies)

    result = anonymize_text(text, known_entities)

    return {
        "company_id": company_id,
        "anonymized_text": result["anonymized_text"],
        "mapping": result["mapping"],
        "entities": result["entities"],
        "leaks": result["leaks"],
        "entity_counts": result["entity_counts"],
    }
