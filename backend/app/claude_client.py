import os
import json
from anthropic import Anthropic

client = Anthropic()

DDQ_SYSTEM_PROMPT = """You are a due diligence research analyst. Extract structured information from the provided documents and fill out the following DDQ sections. For each section, provide your assessment and cite which part of the source document informed your answer. If information is not available, say "Not addressed in provided documents."

## DDQ Sections:

1. **Company Overview** — Business description, founding story, mission, core products/services
2. **Impact Thesis** — Theory of change, target beneficiaries, intended social/environmental outcomes, alignment with SDGs
3. **Business Model** — Revenue model, unit economics, customer segments, competitive positioning
4. **Market Opportunity** — TAM/SAM/SOM, market trends, regulatory tailwinds/headwinds
5. **Team & Governance** — Key leadership, board composition, governance structure, key person risk
6. **Financial Profile** — Revenue, growth trajectory, profitability/burn, funding history
7. **Impact Measurement** — KPIs tracked, measurement framework (IRIS+, custom), third-party verification
8. **Risk Factors** — Key business risks, impact risks, regulatory risks, concentration risks
9. **ESG Considerations** — Environmental practices, labor/social policies, governance standards, controversies

Respond in JSON format with each section as a key (use snake_case like "company_overview", "impact_thesis", etc.), containing:
- "assessment": your analysis (string)
- "confidence": "high", "medium", or "low"
- "sources": which parts of the document informed this (string)

Return ONLY valid JSON, no markdown fencing or extra text."""


def extract_ddq(anonymized_text):
    """Send anonymized text to Claude for DDQ extraction."""
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        system=DDQ_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": f"Please analyze the following document and extract DDQ information:\n\n{anonymized_text}",
            }
        ],
    )

    response_text = message.content[0].text

    # Try to parse JSON from response
    try:
        # Handle potential markdown code fences
        cleaned = response_text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
            cleaned = cleaned.rsplit("```", 1)[0]
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Return as raw text in a structured format if parsing fails
        return {
            "company_overview": {"assessment": response_text, "confidence": "low", "sources": "Raw response - JSON parsing failed"},
        }


def suggest_tags(ddq_output):
    """Ask Claude to suggest tags based on DDQ output."""
    taxonomy = [
        "clean energy", "financial inclusion", "healthcare access",
        "sustainable agriculture", "affordable housing", "gender lens",
        "climate adaptation", "circular economy", "education", "water & sanitation"
    ]

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=256,
        messages=[
            {
                "role": "user",
                "content": f"""Based on this DDQ output, suggest 3-5 theme tags from this taxonomy: {json.dumps(taxonomy)}

DDQ Output:
{json.dumps(ddq_output, indent=2)[:3000]}

Respond with ONLY a JSON array of strings, e.g. ["clean energy", "climate adaptation"]. No other text.""",
            }
        ],
    )

    try:
        text = message.content[0].text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0]
        return json.loads(text)
    except (json.JSONDecodeError, IndexError):
        return ["clean energy"]
