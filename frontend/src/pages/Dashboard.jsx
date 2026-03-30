import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

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

const SECTOR_ICONS = {
  "clean energy": "sun",
  "water & sanitation": "droplet",
  "sustainable agriculture": "leaf",
  "financial inclusion": "banknote",
  "healthcare access": "heart",
  education: "book",
  "circular economy": "recycle",
  "affordable housing": "home",
  "climate adaptation": "shield",
  "gender lens": "users",
};

function SectorIcon({ sector }) {
  const icons = {
    sun: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
    heart: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
    default: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
  };
  const iconKey = SECTOR_ICONS[sector] || "default";
  return icons[iconKey] || icons.default;
}

export default function Dashboard() {
  const [companies, setCompanies] = useState([]);
  const [tagDistribution, setTagDistribution] = useState([]);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getCompanies(), api.getTagDistribution()])
      .then(([companiesData, tagData]) => {
        setCompanies(companiesData);
        setTagDistribution(tagData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = companies.filter((c) => {
    const matchesSearch =
      !filter ||
      c.name.toLowerCase().includes(filter.toLowerCase()) ||
      c.sector.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "researched" && c.status === "researched") ||
      (statusFilter === "pending" && c.status === "not researched");
    return matchesSearch && matchesStatus;
  });

  const researchedCount = companies.filter((c) => c.status === "researched").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <p className="text-sm font-medium text-slate-500">Total Companies</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{companies.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <p className="text-sm font-medium text-slate-500">Researched</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{researchedCount}</p>
          <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${(researchedCount / companies.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <p className="text-sm font-medium text-slate-500">Pending Research</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">
            {companies.length - researchedCount}
          </p>
        </div>
      </div>

      {/* Tag distribution */}
      {tagDistribution.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Portfolio Tag Distribution</h2>
          <div className="flex flex-wrap gap-3">
            {tagDistribution.map((tag) => (
              <div
                key={tag.name}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  TAG_COLORS[tag.name] || "bg-slate-100 text-slate-700"
                }`}
              >
                {tag.name}{" "}
                <span className="ml-1 font-bold opacity-75">({tag.count})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search companies..."
          className="flex-1 max-w-sm px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Status</option>
          <option value="researched">Researched</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Company grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((company) => (
          <Link
            key={company.id}
            to={`/companies/${company.id}`}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md hover:border-indigo-200 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <SectorIcon sector={company.sector} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {company.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {company.sector} &middot; {company.stage} &middot; {company.location}
                  </p>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  company.status === "researched"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {company.status === "researched" ? "Researched" : "Pending"}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600 line-clamp-2">{company.description}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
              <span>Founded {company.founded_year}</span>
              {company.research_count > 0 && (
                <>
                  <span>&middot;</span>
                  <span>{company.research_count} research output(s)</span>
                </>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
