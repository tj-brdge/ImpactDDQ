import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";

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

const TAG_COLORS = {
  "clean energy": "bg-yellow-100 text-yellow-800",
  "financial inclusion": "bg-blue-100 text-blue-800",
  "healthcare access": "bg-rose-100 text-rose-800",
  "sustainable agriculture": "bg-lime-100 text-lime-800",
  "affordable housing": "bg-orange-100 text-orange-800",
  "gender lens": "bg-purple-100 text-purple-800",
  "climate adaptation": "bg-teal-100 text-teal-800",
  "circular economy": "bg-emerald-100 text-emerald-800",
  education: "bg-indigo-100 text-indigo-800",
  "water & sanitation": "bg-cyan-100 text-cyan-800",
};

export default function CompanyDetail() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedOutput, setExpandedOutput] = useState(null);

  useEffect(() => {
    api
      .getCompany(id)
      .then(setCompany)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!company) {
    return <p className="text-slate-500">Company not found.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/" className="hover:text-indigo-600">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">{company.name}</span>
      </div>

      {/* Company header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{company.name}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full font-medium text-xs">
                {company.sector}
              </span>
              <span>{company.stage}</span>
              <span>&middot;</span>
              <span>{company.location}</span>
              <span>&middot;</span>
              <span>Founded {company.founded_year}</span>
            </div>
          </div>
          <Link
            to="/upload"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm"
          >
            New Analysis
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-600 leading-relaxed">{company.description}</p>
      </div>

      {/* Research outputs */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4">
          Research Outputs ({company.research_outputs.length})
        </h2>

        {company.research_outputs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <svg
              className="w-12 h-12 mx-auto text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <p className="mt-3 text-sm text-slate-500">No research outputs yet.</p>
            <Link
              to="/upload"
              className="mt-3 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              Start Research
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {company.research_outputs.map((output) => (
              <div
                key={output.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
              >
                <div
                  onClick={() =>
                    setExpandedOutput(expandedOutput === output.id ? null : output.id)
                  }
                  className="px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-slate-800">
                        DDQ Analysis #{output.id}
                      </h3>
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                        {output.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-slate-400">
                        {output.created_at
                          ? new Date(output.created_at).toLocaleDateString()
                          : ""}
                      </span>
                      {output.source_documents && (
                        <span className="text-xs text-slate-400">
                          {output.source_documents.length} source doc(s)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {output.tags?.map((tag) => (
                      <span
                        key={tag}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          TAG_COLORS[tag] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                    <svg
                      className={`w-5 h-5 text-slate-400 transition-transform ${
                        expandedOutput === output.id ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {expandedOutput === output.id && output.ddq_output && (
                  <div className="border-t border-slate-200 px-6 py-4 space-y-4">
                    {Object.entries(output.ddq_output).map(([key, data]) => {
                      if (!data || typeof data !== "object") return null;
                      const label = SECTION_LABELS[key] || key.replace(/_/g, " ");
                      return (
                        <div key={key} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-slate-700 capitalize text-sm">
                              {label}
                            </h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                data.confidence === "high"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : data.confidence === "medium"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              {data.confidence}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {data.assessment}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
