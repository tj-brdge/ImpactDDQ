import { useState, useEffect } from "react";
import { api } from "../api";

const TAG_COLORS = {
  "clean energy": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "financial inclusion": "bg-blue-100 text-blue-800 border-blue-300",
  "healthcare access": "bg-rose-100 text-rose-800 border-rose-300",
  "sustainable agriculture": "bg-lime-100 text-lime-800 border-lime-300",
  "affordable housing": "bg-orange-100 text-orange-800 border-orange-300",
  "gender lens": "bg-purple-100 text-purple-800 border-purple-300",
  "climate adaptation": "bg-teal-100 text-teal-800 border-teal-300",
  "circular economy": "bg-emerald-100 text-emerald-800 border-emerald-300",
  education: "bg-indigo-100 text-indigo-800 border-indigo-300",
  "water & sanitation": "bg-cyan-100 text-cyan-800 border-cyan-300",
};

export default function TagSelector({ ddqOutput, researchOutputId, onDone }) {
  const [suggestions, setSuggestions] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [customTag, setCustomTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.suggestTags(ddqOutput), api.getTags()])
      .then(([suggestRes, tagsRes]) => {
        setSuggestions(suggestRes.suggestions || []);
        setSelectedTags(suggestRes.suggestions || []);
        setAllTags(tagsRes.map((t) => t.name));
      })
      .catch(() => {
        setAllTags(Object.keys(TAG_COLORS));
      })
      .finally(() => setLoading(false));
  }, [ddqOutput]);

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const tag = customTag.trim().toLowerCase();
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag]);
      if (!allTags.includes(tag)) {
        setAllTags((prev) => [...prev, tag]);
      }
    }
    setCustomTag("");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.assignTags(researchOutputId, selectedTags);
      onDone(selectedTags);
    } catch (err) {
      console.error("Failed to save tags:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-sm text-slate-500">Getting tag suggestions from Claude...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
        <h2 className="text-lg font-bold text-slate-800">Theme Tagging</h2>
        <p className="text-sm text-slate-500 mt-1">
          AI-suggested tags based on the DDQ analysis. Accept, reject, or add custom tags.
        </p>
      </div>

      <div className="p-6">
        {/* AI Suggestions */}
        {suggestions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full" />
              AI-Suggested Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    selectedTags.includes(tag)
                      ? TAG_COLORS[tag] || "bg-slate-200 text-slate-700 border-slate-400"
                      : "bg-white text-slate-400 border-slate-200 line-through"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* All available tags */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-600 mb-3">All Available Tags</h3>
          <div className="flex flex-wrap gap-2">
            {allTags
              .filter((t) => !suggestions.includes(t))
              .map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    selectedTags.includes(tag)
                      ? TAG_COLORS[tag] || "bg-slate-200 text-slate-700 border-slate-400"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {tag}
                </button>
              ))}
          </div>
        </div>

        {/* Custom tag input */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-600 mb-3">Add Custom Tag</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomTag()}
              placeholder="Enter custom tag..."
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={addCustomTag}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200"
            >
              Add
            </button>
          </div>
        </div>

        {/* Selected summary */}
        <div className="bg-slate-50 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold text-slate-600 mb-2">
            Selected Tags ({selectedTags.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedTags.length === 0 ? (
              <p className="text-sm text-slate-400">No tags selected</p>
            ) : (
              selectedTags.map((tag) => (
                <span
                  key={tag}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                    TAG_COLORS[tag] || "bg-slate-200 text-slate-700 border-slate-400"
                  }`}
                >
                  {tag}
                  <button
                    onClick={() => toggleTag(tag)}
                    className="ml-2 text-xs opacity-60 hover:opacity-100"
                  >
                    x
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-lg bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Tags & Complete"}
        </button>
      </div>
    </div>
  );
}
