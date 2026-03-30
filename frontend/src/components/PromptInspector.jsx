import { useState } from "react";
import EntityHighlighter from "./EntityHighlighter";

export default function PromptInspector({
  systemPrompt,
  anonymizedText,
  originalText,
  entities,
  mapping,
  leaks,
  onApprove,
  onReject,
}) {
  const [tab, setTab] = useState("anonymized");
  const [entityOverrides, setEntityOverrides] = useState({});

  const entityTypes = { PERSON: "orange", ORG: "blue", GPE: "green" };

  const toggleFalsePositive = (idx) => {
    setEntityOverrides((prev) => ({
      ...prev,
      [idx]: prev[idx] === "false_positive" ? null : "false_positive",
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
        <h2 className="text-lg font-bold text-slate-800">Prompt Inspection Center</h2>
        <p className="text-sm text-slate-500 mt-1">
          Review exactly what will be sent to Claude. Verify all sensitive entities are anonymized.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Main content */}
        <div className="flex-1 p-6">
          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-slate-100 rounded-lg p-1 w-fit">
            {[
              { key: "anonymized", label: "Anonymized Text" },
              { key: "system", label: "System Prompt" },
              { key: "original", label: "Original (highlighted)" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  tab === t.key
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 max-h-[500px] overflow-y-auto">
            {tab === "anonymized" && (
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono text-slate-700">
                {anonymizedText}
              </pre>
            )}
            {tab === "system" && (
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono text-slate-600">
                {systemPrompt}
              </pre>
            )}
            {tab === "original" && (
              <EntityHighlighter text={originalText} entities={entities} />
            )}
          </div>

          {/* Leak warnings */}
          {leaks && leaks.length > 0 && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-sm font-bold text-red-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Potential Data Leaks Detected
              </h4>
              <ul className="mt-2 text-sm text-red-600">
                {leaks.map((leak, i) => (
                  <li key={i}>
                    &bull; &quot;{leak}&quot; still appears in anonymized text
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Entity sidebar */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-200 p-6 bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">
            Detected Entities
          </h3>

          {/* Legend */}
          <div className="flex gap-3 mb-4 text-xs">
            {Object.entries(entityTypes).map(([type, color]) => (
              <span key={type} className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: color === "orange" ? "#f97316" : color === "blue" ? "#3b82f6" : "#22c55e" }}
                />
                {type}
              </span>
            ))}
          </div>

          {/* Entity count badges */}
          <div className="flex gap-2 mb-4">
            {Object.entries(entityTypes).map(([type]) => {
              const count = entities.filter((e) => e.type === type).length;
              return (
                <span
                  key={type}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-700"
                >
                  {count} {type}
                </span>
              );
            })}
          </div>

          {/* Entity list */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {entities.map((entity, idx) => {
              const isFP = entityOverrides[idx] === "false_positive";
              const colorClass =
                entity.type === "PERSON"
                  ? "border-l-orange-400"
                  : entity.type === "ORG"
                    ? "border-l-blue-400"
                    : "border-l-green-400";
              return (
                <div
                  key={idx}
                  className={`bg-white rounded-lg p-3 border border-slate-200 border-l-4 ${colorClass} ${
                    isFP ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {entity.text}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {entity.placeholder} &middot; {entity.source}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold ml-2 ${
                        entity.confidence >= 0.8
                          ? "text-emerald-600"
                          : entity.confidence >= 0.6
                            ? "text-amber-600"
                            : "text-red-500"
                      }`}
                    >
                      {Math.round(entity.confidence * 100)}%
                    </span>
                  </div>
                  <button
                    onClick={() => toggleFalsePositive(idx)}
                    className={`mt-2 text-xs px-2 py-1 rounded transition-colors ${
                      isFP
                        ? "bg-amber-100 text-amber-700 border border-amber-300"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {isFP ? "Marked: False Positive" : "Mark False Positive"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-between items-center">
        <p className="text-sm text-slate-500">
          {entities.length} entities anonymized &middot; {Object.keys(mapping).length} unique
          replacements
        </p>
        <div className="flex gap-3">
          <button
            onClick={onReject}
            className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-600 font-medium text-sm hover:bg-slate-100 transition-colors"
          >
            Reject &amp; Re-anonymize
          </button>
          <button
            onClick={onApprove}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Approve &amp; Send to Claude
          </button>
        </div>
      </div>
    </div>
  );
}
