import { useState } from "react";

const SECTION_LABELS = {
  company_overview: "Company Overview",
  impact_thesis: "Impact Thesis",
  business_model: "Business Model",
  market_opportunity: "Market Opportunity",
  team_governance: "Team & Governance",
  financial_profile: "Financial Profile",
  impact_measurement: "Impact Measurement",
  risk_factors: "Risk Factors",
  esg_considerations: "ESG Considerations",
};

function ConfidenceBadge({ level }) {
  const styles = {
    high: "bg-emerald-100 text-emerald-700 border-emerald-300",
    medium: "bg-amber-100 text-amber-700 border-amber-300",
    low: "bg-red-100 text-red-700 border-red-300",
  };
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[level] || styles.medium}`}
    >
      {level || "medium"}
    </span>
  );
}

export default function DDQReview({ ddqOutput, onApprove, onSendBack }) {
  const [sections, setSections] = useState(ddqOutput || {});
  const [editing, setEditing] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [expandedSources, setExpandedSources] = useState({});

  const updateAssessment = (key, value) => {
    setSections((prev) => ({
      ...prev,
      [key]: { ...prev[key], assessment: value },
    }));
  };

  const setFeedbackForSection = (key, value) => {
    setFeedback((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSources = (key) => {
    setExpandedSources((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-6 py-4">
        <h2 className="text-lg font-bold text-slate-800">DDQ Analysis Review</h2>
        <p className="text-sm text-slate-500 mt-1">
          Review Claude&apos;s analysis. Click any section to edit. Provide feedback per section.
        </p>
      </div>

      {Object.entries(sections).map(([key, data]) => {
        if (!data || typeof data !== "object") return null;
        const label = SECTION_LABELS[key] || key.replace(/_/g, " ");
        const isEditing = editing === key;
        const sectionFeedback = feedback[key];

        return (
          <div
            key={key}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          >
            {/* Section header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-slate-800 capitalize">{label}</h3>
                <ConfidenceBadge level={data.confidence} />
              </div>
              <div className="flex items-center gap-2">
                {/* Feedback buttons */}
                <button
                  onClick={() =>
                    setFeedbackForSection(key, sectionFeedback === "good" ? null : "good")
                  }
                  className={`p-2 rounded-lg transition-colors ${
                    sectionFeedback === "good"
                      ? "bg-emerald-100 text-emerald-600"
                      : "text-slate-400 hover:bg-slate-100"
                  }`}
                  title="Good"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905a3.61 3.61 0 01-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                </button>
                <button
                  onClick={() =>
                    setFeedbackForSection(key, sectionFeedback === "bad" ? null : "bad")
                  }
                  className={`p-2 rounded-lg transition-colors ${
                    sectionFeedback === "bad"
                      ? "bg-red-100 text-red-600"
                      : "text-slate-400 hover:bg-slate-100"
                  }`}
                  title="Needs improvement"
                >
                  <svg className="w-5 h-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905a3.61 3.61 0 01-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                </button>
                <button
                  onClick={() =>
                    setFeedbackForSection(
                      key,
                      sectionFeedback === "rewrite" ? null : "rewrite"
                    )
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    sectionFeedback === "rewrite"
                      ? "bg-amber-100 text-amber-700 border border-amber-300"
                      : "text-slate-400 hover:bg-slate-100 border border-transparent"
                  }`}
                >
                  Needs Rewrite
                </button>
              </div>
            </div>

            {/* Section body */}
            <div className="px-6 py-4">
              {isEditing ? (
                <div>
                  <textarea
                    value={data.assessment}
                    onChange={(e) => updateAssessment(key, e.target.value)}
                    className="w-full h-40 p-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
                  />
                  <button
                    onClick={() => setEditing(null)}
                    className="mt-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                  >
                    Done Editing
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => setEditing(key)}
                  className="cursor-pointer hover:bg-slate-50 rounded-lg p-2 -m-2 transition-colors group"
                >
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {data.assessment || "No data available."}
                  </p>
                  <p className="text-xs text-slate-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to edit
                  </p>
                </div>
              )}

              {/* Sources */}
              {data.sources && (
                <div className="mt-3">
                  <button
                    onClick={() => toggleSources(key)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    {expandedSources[key] ? "Hide sources" : "Show sources"}
                  </button>
                  {expandedSources[key] && (
                    <p className="mt-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {data.sources}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Action buttons */}
      <div className="flex justify-between items-center pt-4">
        <button
          onClick={() => onSendBack(sections, feedback)}
          className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-600 font-medium text-sm hover:bg-slate-100 transition-colors"
        >
          Send Back for Re-extraction
        </button>
        <button
          onClick={() => onApprove(sections, feedback)}
          className="px-6 py-2.5 rounded-lg bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors shadow-sm"
        >
          Approve &amp; Save
        </button>
      </div>
    </div>
  );
}
