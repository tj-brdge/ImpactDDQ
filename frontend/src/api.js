const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  getCompanies: () => request("/companies"),
  getCompany: (id) => request(`/companies/${id}`),
  createCompany: (data) =>
    request("/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  uploadDocuments: (companyId, files) => {
    const form = new FormData();
    form.append("company_id", companyId);
    files.forEach((f) => form.append("files", f));
    return request("/documents/upload", { method: "POST", body: form });
  },

  anonymize: (companyId, text) =>
    request("/documents/anonymize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_id: companyId, text }),
    }),

  getSystemPrompt: (templateId) =>
    request(`/analysis/system-prompt${templateId ? `?template_id=${templateId}` : ""}`),

  runExtraction: (anonymizedText, mapping, templateId) =>
    request("/analysis/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anonymized_text: anonymizedText, mapping, template_id: templateId }),
    }),

  suggestTags: (ddqOutput) =>
    request("/analysis/suggest-tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ddq_output: ddqOutput }),
    }),

  saveResearchOutput: (companyId, ddqOutput, sourceDocuments, analystFeedback, templateId) =>
    request("/analysis/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company_id: companyId,
        ddq_output: ddqOutput,
        source_documents: sourceDocuments,
        analyst_feedback: analystFeedback,
        template_id: templateId,
      }),
    }),

  getTags: () => request("/tags"),
  assignTags: (researchOutputId, tags) =>
    request("/tags/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ research_output_id: researchOutputId, tags }),
    }),
  getTagDistribution: () => request("/tags/distribution"),

  // Templates
  getTemplates: () => request("/templates"),
  getTemplate: (id) => request(`/templates/${id}`),
  createTemplate: (data) =>
    request("/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  updateTemplate: (id, data) =>
    request(`/templates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  deleteTemplate: (id) =>
    request(`/templates/${id}`, { method: "DELETE" }),
};
