import re
import subprocess
import sys
import spacy

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Downloading spaCy en_core_web_sm model...")
    subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")

ENTITY_COLORS = {
    "PERSON": "orange",
    "ORG": "blue",
    "GPE": "green",
}


def build_dictionary(companies):
    """Build a lookup dictionary from company database records."""
    known_entities = {}
    for company in companies:
        known_entities[company.name] = "ORG"
        if company.location:
            for part in company.location.split(","):
                part = part.strip()
                if part:
                    known_entities[part] = "GPE"
    return known_entities


def anonymize_text(text, known_entities=None):
    """
    Anonymize text using spaCy NER + dictionary lookup.
    Returns anonymized text, mapping, and entity details.
    """
    if known_entities is None:
        known_entities = {}

    doc = nlp(text)

    entities_found = []
    seen_spans = set()

    # Pass 1: Dictionary lookup (higher priority for known entities)
    for entity_text, entity_type in known_entities.items():
        for match in re.finditer(re.escape(entity_text), text, re.IGNORECASE):
            start, end = match.start(), match.end()
            span_key = (start, end)
            if span_key not in seen_spans:
                seen_spans.add(span_key)
                entities_found.append({
                    "text": match.group(),
                    "start": start,
                    "end": end,
                    "type": entity_type,
                    "confidence": 0.95,
                    "source": "dictionary",
                })

    # Pass 2: spaCy NER
    for ent in doc.ents:
        if ent.label_ not in ("PERSON", "ORG", "GPE"):
            continue
        span_key = (ent.start_char, ent.end_char)
        overlaps = False
        for seen_start, seen_end in seen_spans:
            if not (ent.end_char <= seen_start or ent.start_char >= seen_end):
                overlaps = True
                break
        if not overlaps:
            seen_spans.add(span_key)
            entities_found.append({
                "text": ent.text,
                "start": ent.start_char,
                "end": ent.end_char,
                "type": ent.label_,
                "confidence": round(0.6 + min(len(ent.text) / 30, 0.35), 2),
                "source": "spacy",
            })

    # Sort by position (reverse for replacement)
    entities_found.sort(key=lambda e: e["start"])

    # Build mapping and replace
    mapping = {}
    counters = {"PERSON": 0, "ORG": 0, "GPE": 0}
    text_to_placeholder = {}
    anonymized = text

    # First pass: assign placeholders to unique entity texts
    for entity in entities_found:
        key = entity["text"].lower()
        if key not in text_to_placeholder:
            label = entity["type"]
            counters[label] = counters.get(label, 0) + 1
            type_name = {"PERSON": "PERSON", "ORG": "COMPANY", "GPE": "LOCATION"}[label]
            placeholder = f"[{type_name}_{counters[label]}]"
            text_to_placeholder[key] = placeholder
            mapping[placeholder] = entity["text"]

    # Replace in reverse order to preserve positions
    for entity in reversed(entities_found):
        key = entity["text"].lower()
        placeholder = text_to_placeholder[key]
        anonymized = anonymized[:entity["start"]] + placeholder + anonymized[entity["end"]:]

    # Dual-pass verification: check if any known entities still appear
    leaks = []
    for entity_text in known_entities:
        if re.search(re.escape(entity_text), anonymized, re.IGNORECASE):
            leaks.append(entity_text)

    # Add entity details with placeholder info
    for entity in entities_found:
        key = entity["text"].lower()
        entity["placeholder"] = text_to_placeholder[key]
        entity["color"] = ENTITY_COLORS.get(entity["type"], "gray")

    return {
        "anonymized_text": anonymized,
        "mapping": mapping,
        "entities": entities_found,
        "leaks": leaks,
        "entity_counts": counters,
    }


def re_inject(text, mapping):
    """Replace placeholders back with real entity names."""
    result = text
    for placeholder, real_value in mapping.items():
        result = result.replace(placeholder, real_value)
    return result
