export default function EntityHighlighter({ text, entities }) {
  if (!entities || entities.length === 0) {
    return <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono">{text}</pre>;
  }

  // Sort entities by start position
  const sorted = [...entities].sort((a, b) => a.start - b.start);

  const parts = [];
  let lastEnd = 0;

  for (const entity of sorted) {
    if (entity.start > lastEnd) {
      parts.push({ text: text.slice(lastEnd, entity.start), type: null });
    }
    parts.push({
      text: text.slice(entity.start, entity.end),
      type: entity.type,
      confidence: entity.confidence,
      placeholder: entity.placeholder,
    });
    lastEnd = entity.end;
  }
  if (lastEnd < text.length) {
    parts.push({ text: text.slice(lastEnd), type: null });
  }

  const classMap = {
    PERSON: "entity-person",
    ORG: "entity-org",
    GPE: "entity-gpe",
  };

  return (
    <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
      {parts.map((part, i) =>
        part.type ? (
          <span
            key={i}
            className={classMap[part.type] || ""}
            title={`${part.placeholder} (${part.type}, ${Math.round(part.confidence * 100)}%)`}
          >
            {part.text}
          </span>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </pre>
  );
}
