import { useState, useEffect } from "react";
import { api } from "../api";

export default function TemplateManager() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // template id or "new"
  const [form, setForm] = useState({ name: "", description: "", sections: [] });
  const [saving, setSaving] = useState(false);

  const loadTemplates = () => {
    api
      .getTemplates()
      .then(setTemplates)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const startNew = () => {
    setEditing("new");
    setForm({
      name: "",
      description: "",
      sections: [{ key: "", title: "", guidance: "" }],
    });
  };

  const startEdit = (template) => {
    setEditing(template.id);
    setForm({
      name: template.name,
      description: template.description || "",
      sections: template.sections.map((s) => ({ ...s })),
    });
  };

  const cancel = () => {
    setEditing(null);
    setForm({ name: "", description: "", sections: [] });
  };

  const addSection = () => {
    setForm((prev) => ({
      ...prev,
      sections: [...prev.sections, { key: "", title: "", guidance: "" }],
    }));
  };

  const removeSection = (idx) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== idx),
    }));
  };

  const updateSection = (idx, field, value) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((s, i) =>
        i === idx
          ? {
              ...s,
              [field]: value,
              ...(field === "title" && !s.key
                ? { key: value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+$/, "") }
                : {}),
            }
          : s
      ),
    }));
  };

  const handleSave = async () => {
    if (!form.name || form.sections.length === 0) return;
    // Auto-generate keys from titles if missing
    const sections = form.sections.map((s) => ({
      ...s,
      key: s.key || s.title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+$/, ""),
    }));
    setSaving(true);
    try {
      if (editing === "new") {
        await api.createTemplate({ ...form, sections });
      } else {
        await api.updateTemplate(editing, { ...form, sections });
      }
      cancel();
      loadTemplates();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteTemplate(id);
      loadTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.updateTemplate(id, { is_default: true });
      loadTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">DDQ Template Manager</h1>
          <p className="text-sm text-slate-500 mt-1">
            Create and customize templates that control what Claude extracts from documents.
          </p>
        </div>
        {!editing && (
          <button
            onClick={startNew}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm"
          >
            New Template
          </button>
        )}
      </div>

      {/* Editor */}
      {editing && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            {editing === "new" ? "Create Template" : "Edit Template"}
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Quick Screen Template"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Brief description of when to use this template"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-slate-700">
                  Sections ({form.sections.length})
                </label>
                <button
                  onClick={addSection}
                  className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                >
                  + Add Section
                </button>
              </div>

              <div className="space-y-3">
                {form.sections.map((section, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-lg p-4 bg-slate-50/50"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-bold text-slate-400 bg-slate-200 rounded-full w-6 h-6 flex items-center justify-center mt-1 flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={section.title}
                            onChange={(e) => updateSection(idx, "title", e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Section Title"
                          />
                          <input
                            type="text"
                            value={section.key}
                            onChange={(e) => updateSection(idx, "key", e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                            placeholder="snake_case_key (auto-generated)"
                          />
                        </div>
                        <textarea
                          value={section.guidance}
                          onChange={(e) => updateSection(idx, "guidance", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                          rows={2}
                          placeholder="Guidance for Claude: what to look for and include in this section..."
                        />
                      </div>
                      <button
                        onClick={() => removeSection(idx)}
                        className="text-slate-400 hover:text-red-500 mt-1 flex-shrink-0"
                        title="Remove section"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving || !form.name || form.sections.length === 0}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-sm disabled:opacity-50"
              >
                {saving ? "Saving..." : editing === "new" ? "Create Template" : "Save Changes"}
              </button>
              <button
                onClick={cancel}
                className="px-5 py-2.5 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template list */}
      <div className="space-y-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-800">{template.name}</h3>
                  {template.is_default && (
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                      Default
                    </span>
                  )}
                </div>
                {template.description && (
                  <p className="text-sm text-slate-500 mt-1">{template.description}</p>
                )}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {template.sections.map((s) => (
                    <span
                      key={s.key}
                      className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs"
                    >
                      {s.title}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                {!template.is_default && (
                  <button
                    onClick={() => handleSetDefault(template.id)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-500 border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => startEdit(template)}
                  className="px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50"
                >
                  Edit
                </button>
                {!template.is_default && (
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="px-3 py-1.5 text-xs font-medium text-red-500 border border-red-300 rounded-lg hover:bg-red-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
