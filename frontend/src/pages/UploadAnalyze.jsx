import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import Stepper from "../components/Stepper";
import PromptInspector from "../components/PromptInspector";
import DDQReview from "../components/DDQReview";
import TagSelector from "../components/TagSelector";

export default function UploadAnalyze() {
  const navigate = useNavigate();
  const fileInputRef = useRef();

  // State
  const [step, setStep] = useState("upload");
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [files, setFiles] = useState([]);
  const [extractedTexts, setExtractedTexts] = useState([]);
  const [combinedText, setCombinedText] = useState("");
  const [anonymizeResult, setAnonymizeResult] = useState(null);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [ddqOutput, setDdqOutput] = useState(null);
  const [researchOutputId, setResearchOutputId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  useEffect(() => {
    api.getCompanies().then(setCompanies).catch(console.error);
  }, []);

  // Step 1: Upload
  const handleUpload = async () => {
    if (!selectedCompany || files.length === 0) return;
    setLoading(true);
    setLoadingMessage("Extracting text from documents...");
    try {
      const result = await api.uploadDocuments(selectedCompany, files);
      setExtractedTexts(result.documents);
      const combined = result.documents.map((d) => d.text).join("\n\n---\n\n");
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
      const [anonResult, promptResult] = await Promise.all([
        api.anonymize(selectedCompany, combinedText),
        api.getSystemPrompt(),
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
      const result = await api.runExtraction(
        anonymizeResult.anonymized_text,
        anonymizeResult.mapping
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
      const result = await api.saveResearchOutput(
        parseInt(selectedCompany),
        editedSections,
        extractedTexts.map((d) => d.filename),
        feedback
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

  const companyName = companies.find((c) => c.id === parseInt(selectedCompany))?.name || "";

  return (
    <div className="space-y-6">
      <Stepper currentStep={step} />

      {/* Loading overlay */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-sm text-slate-600 font-medium">{loadingMessage}</p>
          <div className="mt-3 w-48 h-1.5 bg-slate-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full animate-pulse" style={{ width: "60%" }} />
          </div>
        </div>
      )}

      {/* Step 1: Upload */}
      {step === "upload" && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-1">Upload Documents</h2>
          <p className="text-sm text-slate-500 mb-6">
            Select a company and upload research documents for analysis.
          </p>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
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

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Documents</label>
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
                onChange={(e) => setFiles(Array.from(e.target.files))}
                className="hidden"
              />
              {files.length > 0 && (
                <div className="mt-3 space-y-1">
                  {files.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg"
                    >
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      {f.name} ({(f.size / 1024).toFixed(1)} KB)
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
            loaded for {companyName}.
          </p>

          {extractedTexts.map((doc, i) => (
            <div key={i} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-slate-700">{doc.filename}</span>
                <span className="text-xs text-slate-400">({doc.char_count.toLocaleString()} chars)</span>
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
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
