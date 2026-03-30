from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ResearchOutput
from app.claude_client import extract_ddq, suggest_tags, DDQ_SYSTEM_PROMPT
from app.anonymizer import re_inject

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@router.get("/system-prompt")
def get_system_prompt():
    """Return the DDQ system prompt for display in the inspection screen."""
    return {"system_prompt": DDQ_SYSTEM_PROMPT}


@router.post("/extract")
async def run_extraction(payload: dict):
    """Run Claude DDQ extraction on anonymized text."""
    anonymized_text = payload.get("anonymized_text", "")
    mapping = payload.get("mapping", {})

    if not anonymized_text:
        raise HTTPException(status_code=400, detail="No text provided")

    # Call Claude with anonymized text
    ddq_output = extract_ddq(anonymized_text)

    # Re-inject real entity names
    re_injected = {}
    for section_key, section_data in ddq_output.items():
        if isinstance(section_data, dict):
            re_injected[section_key] = {
                "assessment": re_inject(section_data.get("assessment", ""), mapping),
                "confidence": section_data.get("confidence", "medium"),
                "sources": re_inject(section_data.get("sources", ""), mapping),
            }
        else:
            re_injected[section_key] = section_data

    return {
        "ddq_output": re_injected,
        "raw_output": ddq_output,
    }


@router.post("/suggest-tags")
async def get_tag_suggestions(payload: dict):
    """Get auto-suggested tags based on DDQ output."""
    ddq_output = payload.get("ddq_output", {})
    suggestions = suggest_tags(ddq_output)
    return {"suggestions": suggestions}


@router.post("/save")
async def save_research_output(payload: dict, db: Session = Depends(get_db)):
    """Save approved research output."""
    company_id = payload.get("company_id")
    ddq_output = payload.get("ddq_output")
    source_documents = payload.get("source_documents", [])
    analyst_feedback = payload.get("analyst_feedback")

    if not company_id or not ddq_output:
        raise HTTPException(status_code=400, detail="company_id and ddq_output required")

    output = ResearchOutput(
        company_id=company_id,
        ddq_output=ddq_output,
        source_documents=source_documents,
        status="approved",
        analyst_feedback=analyst_feedback,
    )
    db.add(output)
    db.commit()
    db.refresh(output)

    return {"id": output.id, "status": "saved"}
