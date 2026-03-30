import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import Stepper from "../components/Stepper";
import PromptInspector from "../components/PromptInspector";
import DDQReview from "../components/DDQReview";
import TagSelector from "../components/TagSelector";

const DOC_TYPES = [
  { value: "pitch_deck", label: "Pitch Deck" },
  { value: "analyst_notes", label: "Analyst Notes" },
  { value: "internal_research", label: "Internal Research" },
  { value: "financial_statements", label: "Financial Statements" },
  { value: "impact_report", label: "Impact Report" },
  { value: "legal_docs", label: "Legal Documents" },
  { value: "press_coverage", label: "Press Coverage" },
  { value: "other", label: "Other" },
];

export default function UploadAnalyze() {
  const navigate = useNavigate();
  const fileInputRef = useRef();

  // State
  const [step, setStep] = useState("upload");
  const [companies, setCompanies] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [files, setFiles] = useState([]);
  const [docTypes, setDocTypes] = useState({});
  const [extractedTexts, setExtractedTexts] = useState([]);
  const [combinedText, setCombinedText] = useState("");
  const [anonymizeResult, setAnonymizeResult] = useState(null);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [ddqOutput, setDdqOutput] = useState(null);
  const [researchOutputId, setResearchOutputId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  useEffect(() => {
    Promise.all([api.getCompanies(), api.getTemplates()]).then(
      ([companiesData, templatesData]) => {
        setCompanies(companiesData);
        setTemplates(templatesData);
        const def = templatesData.find((t) => t.is_default);
        if (def) setSelectedTemplate(String(def.id));
      }
    );
  }, []);

  const handleFilesSelected = (newFiles) => {
    setFiles(newFiles);
    const types = { ...docTypes };
    newFiles.forEach((f) => {
      if (!types[f.name]) types[f.name] = "other";
    });
    setDocTypes(types);
  };

  // Step 1: Upload
  const handleUpload = async () => {
    if (!selectedCompany || files.length === 0) return;
    setLoading(true);
    setLoadingMessage("Extracting text from documents...");
    try {
      const result = await api.uploadDocuments(selectedCompany, files);
      const docs = result.documents.map((d) => ({
        ...d,
        doc_type: docTypes[d.filename] || "other",
      }));
      setExtractedTexts(docs);
      const combined = docs.map((d) => d.text).join("\n\n---\n\n");
      setCombinedText(combined);
      setStep("anonymize");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Anonymize
  const handleAnonymize = async () => {
    setLoading(true);
    setLoadingMessage("Running NER anonymization pipeline...");
    try {
      const templateId = selectedTemplate ? parseInt(selectedTemplate) : null;
      const [anonResult, promptResult] = await Promise.all([
        api.anonymize(selectedCompany, combinedText),
        api.getSystemPrompt(templateId),
      ]);
      setAnonymizeResult(anonResult);
      setSystemPrompt(promptResult.system_prompt);
      setStep("inspect");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Approve inspection -> Extract
  const handleApproveInspection = async () => {
    setStep("extract");
    setLoading(true);
    setLoadingMessage("Claude is analyzing the documents and extracting DDQ information...");
    try {
      const templateId = selectedTemplate ? parseInt(selectedTemplate) : null;
      const result = await api.runExtraction(
        anonymizeResult.anonymized_text,
        anonymizeResult.mapping,
        templateId
      );
      setDdqOutput(result.ddq_output);
      setStep("review");
    } catch (err) {
      console.error(err);
      setStep("inspect");
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Approve DDQ
  const handleApproveDDQ = async (editedSections, feedback) => {
    setLoading(true);
    setLoadingMessage("Saving research output...");
    try {
      const templateId = selectedTemplate ? parseInt(selectedTemplate) : null;
      const sourceDocs = extractedTexts.map((d) => ({
        filename: d.filename,
        doc_type: d.doc_type,
      }));
      const result = await api.saveResearchOutput(
        parseInt(selectedCompany),
        editedSections,
        sourceDocs,
        feedback,
        templateId
      );
      setResearchOutputId(result.id);
      setDdqOutput(editedSections);
      setStep("tag");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Step 6: Tags done
  const handleTagsDone = () => {
    setStep("done");
  };

  const companyName =
    companies.find((c) => c.id === parseInt(selectedCompany))?.name || "";
  const templateName =
    templates.find((t) => t.id === parseInt(selectedTemplate))?.name || "";

  return (
    <div className="space-y-6">
      <Stepper currentStep={step} />

      {/* Loading overlay */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-sm text-slate-600 font-medium">{loadingMessage}</p>
          <div className="mt-3 w-48 h-1.5 bg-slate-200 rounded-full mx-auto overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full animate-pulse"
              style={{ width: "60%" }}
            />
          </div>
        </div>
      )}

      {/* Step 1: Upload */}
      {step === "upload" && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-1">Upload Documents</h2>
          <p className="text-sm text-slate-500 mb-6">
            Select a company, choose a DDQ template, and upload research documents.
          </p>

          <div className="space-y-5">
            {/* Company selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Company
              </label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full max-w-md px-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a company...</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.sector})
                  </option>
                ))}
              </select>
            </div>

            {/* Template selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                DDQ Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full max-w-md px-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.is_default ? " (Default)" : ""} — {t.sections.length} sections
                  </option>
                ))}
              </select>
              {selectedTemplate && (
                <div className="mt-2 text-xs text-slate-500">
                  {templates.find((t) => t.id === parseInt(selectedTemplate))?.description}
                </div>
              )}
            </div>

            {/* File upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Documents
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors"
              >
                <svg
                  className="w-10 h-10 mx-auto text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                <p className="mt-3 text-sm text-slate-600">
                  Click to select PDF or text files
                </p>
                <p className="text-xs text-slate-400 mt-1">Supports .pdf, .txt, .md</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.txt,.md,.doc"
                onChange={(e) => handleFilesSelected(Array.from(e.target.files))}
                className="hidden"
              />

              {/* File list with doc type selectors */}
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-lg border border-slate-200"
                    >
                      <svg
                        className="w-4 h-4 text-slate-400 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                        />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 truncate">{f.name}</p>
                        <p className="text-xs text-slate-400">
                          {(f.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <select
                        value={docTypes[f.name] || "other"}
                        onChange={(e) =>
                          setDocTypes((prev) => ({ ...prev, [f.name]: e.target.value }))
                        }
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {DOC_TYPES.map((dt) => (
                          <option key={dt.value} value={dt.value}>
                            {dt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!selectedCompany || files.length === 0}
              className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Upload &amp; Extract Text
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Review extracted text and anonymize */}
      {step === "anonymize" && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-1">Extracted Text Preview</h2>
          <p className="text-sm text-slate-500 mb-4">
            Review the extracted text before anonymization. {extractedTexts.length} document(s)
            loaded for {companyName}. Template: {templateName}.
          </p>

          {extractedTexts.map((doc, i) => (
            <div key={i} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-slate-700">{doc.filename}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                  {DOC_TYPES.find((dt) => dt.value === doc.doc_type)?.label || doc.doc_type}
                </span>
                <span className="text-xs text-slate-400">
                  ({doc.char_count.toLocaleString()} chars)
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 max-h-64 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono leading-relaxed">
                  {doc.text}
                </pre>
              </div>
            </div>
          ))}

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setStep("upload")}
              className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-600 font-medium text-sm hover:bg-slate-100"
            >
              Back
            </button>
            <button
              onClick={handleAnonymize}
              className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 shadow-sm"
            >
              Run Anonymization
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Prompt Inspection */}
      {step === "inspect" && !loading && anonymizeResult && (
        <PromptInspector
          systemPrompt={systemPrompt}
          anonymizedText={anonymizeResult.anonymized_text}
          originalText={combinedText}
          entities={anonymizeResult.entities}
          mapping={anonymizeResult.mapping}
          leaks={anonymizeResult.leaks}
          onApprove={handleApproveInspection}
          onReject={() => setStep("anonymize")}
        />
      )}

      {/* Step 5: Review DDQ Output */}
      {step === "review" && !loading && ddqOutput && (
        <DDQReview
          ddqOutput={ddqOutput}
          templateSections={
            templates.find((t) => t.id === parseInt(selectedTemplate))?.sections
          }
          onApprove={handleApproveDDQ}
          onSendBack={() => setStep("inspect")}
        />
      )}

      {/* Step 6: Tagging */}
      {step === "tag" && !loading && ddqOutput && researchOutputId && (
        <TagSelector
          ddqOutput={ddqOutput}
          researchOutputId={researchOutputId}
          onDone={handleTagsDone}
        />
      )}

      {/* Step 7: Done */}
      {step === "done" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-4">Research Complete</h2>
          <p className="text-sm text-slate-500 mt-2">
            DDQ analysis for {companyName} has been saved and tagged successfully.
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => navigate(`/companies/${selectedCompany}`)}
              className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-600 font-medium text-sm hover:bg-slate-100"
            >
              View Company
            </button>
            <button
              onClick={() => {
                setStep("upload");
                setFiles([]);
                setDocTypes({});
                setExtractedTexts([]);
                setCombinedText("");
                setAnonymizeResult(null);
                setDdqOutput(null);
                setResearchOutputId(null);
                setSelectedCompany("");
              }}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 shadow-sm"
            >
              Start New Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
