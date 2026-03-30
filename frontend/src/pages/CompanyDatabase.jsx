import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

const SECTORS = [
  "clean energy",
  "water & sanitation",
  "sustainable agriculture",
  "financial inclusion",
  "healthcare access",
  "education",
  "circular economy",
  "affordable housing",
  "climate adaptation",
  "gender lens",
];

const STAGES = ["seed", "series A", "series B", "growth"];

const EMPTY_FORM = {
  name: "",
  sector: SECTORS[0],
  stage: STAGES[0],
  location: "",
  founded_year: new Date().getFullYear(),
  description: "",
};

export default function CompanyDatabase() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("name");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadCompanies = () => {
    api
      .getCompanies()
      .then(setCompanies)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createCompany(form);
      setForm(EMPTY_FORM);
      setShowForm(false);
      loadCompanies();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const sorted = [...companies].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "sector") return a.sector.localeCompare(b.sector);
    if (sortBy === "stage") return a.stage.localeCompare(b.stage);
    if (sortBy === "year") return b.founded_year - a.founded_year;
    return 0;
  });

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
        <h1 className="text-xl font-bold text-slate-800">Company Database</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="name">Name</option>
              <option value="sector">Sector</option>
              <option value="stage">Stage</option>
              <option value="year">Founded Year</option>
            </select>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm"
          >
            {showForm ? "Cancel" : "Add Company"}
          </button>
        </div>
      </div>

      {/* Add Company Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
        >
          <h2 className="text-lg font-bold text-slate-800 mb-4">Add New Company</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., SolarHarvest Energy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sector</label>
              <select
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Stage</label>
              <select
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
              <input
                type="text"
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Nairobi, Kenya"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Founded Year
              </label>
              <input
                type="number"
                required
                min="1900"
                max="2030"
                value={form.founded_year}
                onChange={(e) => setForm({ ...form, founded_year: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
              placeholder="Brief description of the company and its impact focus..."
            />
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add Company"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setForm(EMPTY_FORM);
              }}
              className="px-5 py-2.5 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Company
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Sector
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Stage
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Location
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Founded
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((company) => (
              <tr key={company.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <Link
                    to={`/companies/${company.id}`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    {company.name}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 capitalize">{company.sector}</td>
                <td className="px-6 py-4 text-sm text-slate-600 capitalize">{company.stage}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{company.location}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{company.founded_year}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      company.status === "researched"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {company.status === "researched" ? "Researched" : "Pending"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
