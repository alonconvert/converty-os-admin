"use client";

import { useState, useMemo } from "react";
import { mockLeads, mockClients } from "@/lib/mock-data";

function ScoreSparkline({ score }: { score: number }) {
  const data = [
    Math.max(0, score - 20 + Math.floor(score * 0.05)),
    Math.max(0, score - 12),
    Math.max(0, score - 6),
    Math.max(0, score - 2),
    score,
  ];
  const max = 100, w = 30, h = 12;
  const pts = data.map((v, i) => `${(i / 4) * w},${h - (v / max) * h}`).join(" ");
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444";
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function parseAgeHours(age: string): number {
  if (age.includes("min")) return 0;
  if (age.includes("1.5h")) return 1.5;
  if (age.includes("1h")) return 1;
  if (age.includes("2h")) return 2;
  if (age.includes("3h") || age.includes("4h") || age.includes("d")) return 4;
  return 0;
}

export default function Pulse() {
  const totalLeadsToday = mockClients.reduce((sum, c) => sum + c.leadsToday, 0);
  const [hotFilter, setHotFilter] = useState(false);
  const [sortColumn, setSortColumn] = useState("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const hotCount = mockLeads.filter((l) => l.score >= 80).length;

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(col);
      setSortDir("desc");
    }
  };

  const sortArrow = (col: string) => {
    if (sortColumn !== col) return <span style={{ color: "#d1d5db", marginLeft: 2 }}>↕</span>;
    return <span style={{ marginLeft: 2 }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const filteredLeads = hotFilter ? mockLeads.filter((l) => l.score >= 80) : mockLeads;

  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      let aVal: string | number = 0;
      let bVal: string | number = 0;
      if (sortColumn === "score") { aVal = a.score; bVal = b.score; }
      else if (sortColumn === "status") { aVal = a.status; bVal = b.status; }
      else if (sortColumn === "when") { aVal = parseAgeHours(a.createdAt); bVal = parseAgeHours(b.createdAt); }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredLeads, sortColumn, sortDir]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pulse</h1>
          <p className="text-sm text-gray-500 mt-0.5">Lead tracker — operator view · {totalLeadsToday} leads today</p>
        </div>
        <button
          className="text-sm px-4 py-2 rounded-lg text-white font-medium"
          style={{ background: "#6366f1" }}
        >
          + Manual Entry
        </button>
      </div>

      {/* Per-client lead counts */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {mockClients.slice(0, 4).map((client) => {
          const total = client.leadsToday;
          const funnel = {
            new: Math.round(total * 0.5),
            contacted: Math.round(total * 0.3),
            qualified: Math.round(total * 0.15),
            closed: Math.round(total * 0.05),
          };
          const cpl = Math.round(client.monthlyBudget / Math.max(1, client.leadsToday * 30));
          const cplOk = cpl <= client.cplTarget;
          return (
            <div key={client.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-xl font-bold text-gray-900">{client.leadsToday}</div>
              <div className="text-xs font-medium text-gray-700 mt-0.5 truncate">{client.name}</div>
              <div className="text-xs text-gray-400">{client.activeConvs} active convs</div>
              {/* Funnel pills replacing progress bar */}
              <div style={{ display: "flex", gap: 3, marginTop: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, fontWeight: 600, background: "#eff6ff", color: "#2563eb" }}>New/{funnel.new}</span>
                <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, fontWeight: 600, background: "#fffbeb", color: "#d97706" }}>Ctd/{funnel.contacted}</span>
                <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, fontWeight: 600, background: "#f0fdf4", color: "#16a34a" }}>Qual/{funnel.qualified}</span>
                <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, fontWeight: 600, background: "#dcfce7", color: "#15803d" }}>Cls/{funnel.closed}</span>
              </div>
              {/* CPL indicator */}
              <div className="text-xs font-medium mt-1" style={{ color: cplOk ? "#059669" : "#dc2626" }}>
                CPL {cplOk ? `₪${cpl} ✓` : `₪${cpl} ↑`}
                {!cplOk && (
                  <span style={{ color: "#dc2626", marginLeft: 4 }}>
                    (Δ {Math.round((client.cplTarget - cpl) * 0.8) > 0 ? "+" : ""}{Math.round((client.cplTarget - cpl) * 0.8)})
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leads table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h2 className="font-semibold text-gray-900 text-sm">All Leads</h2>
            {/* Sort by Hottest quick button */}
            <button
              onClick={() => { setSortColumn("score"); setSortDir("desc"); }}
              style={{
                fontSize: 11, padding: "3px 10px", borderRadius: 99,
                background: sortColumn === "score" ? "#4F46E5" : "#f3f4f6",
                color: sortColumn === "score" ? "#fff" : "#6b7280",
                border: "none", cursor: "pointer", fontWeight: 600,
              }}
            >
              Sort by Hottest
            </button>
          </div>
          <div className="flex gap-2" style={{ alignItems: "center" }}>
            {/* Hot filter button */}
            <button
              onClick={() => setHotFilter(!hotFilter)}
              style={{
                fontSize: 11, padding: "3px 10px", borderRadius: 99,
                background: hotFilter ? "#dc2626" : "#fef2f2",
                color: hotFilter ? "#fff" : "#dc2626",
                border: "1px solid #fca5a5", cursor: "pointer", fontWeight: 600,
              }}
            >
              🔥 Hot ({hotCount})
            </button>
            <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700">
              <option>All Status</option>
              <option>New</option>
              <option>Contacted</option>
              <option>Closed</option>
            </select>
            <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700">
              <option>All Sources</option>
              <option>Google</option>
              <option>Facebook</option>
              <option>Landing Page</option>
            </select>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Lead</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</th>
              <th
                className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                style={{ cursor: "pointer", userSelect: "none" }}
                onClick={() => handleSort("score")}
              >
                Score {sortArrow("score")}
              </th>
              <th
                className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                style={{ cursor: "pointer", userSelect: "none" }}
                onClick={() => handleSort("status")}
              >
                Status {sortArrow("status")}
              </th>
              <th
                className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                style={{ cursor: "pointer", userSelect: "none" }}
                onClick={() => handleSort("when")}
              >
                When {sortArrow("when")}
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sortedLeads.map((lead) => {
              const ageH = parseAgeHours(lead.createdAt);
              const ageColor = ageH < 1 ? "#059669" : ageH < 2 ? "#d97706" : "#dc2626";
              const isStale = ageH >= 2;
              return (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {lead.name}
                      {lead.score >= 80 && <span>🔥</span>}
                    </div>
                    <div className="text-xs text-gray-400">{lead.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{lead.clientName}</td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: lead.source === "google" ? "#eff6ff" : lead.source === "facebook" ? "#f5f3ff" : "#f0fdf4",
                        color: lead.source === "google" ? "#2563eb" : lead.source === "facebook" ? "#7c3aed" : "#16a34a",
                      }}
                    >
                      {lead.source}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <ScoreSparkline score={lead.score} />
                      <div className="w-8 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${lead.score}%`,
                            background: lead.score >= 80 ? "#22c55e" : lead.score >= 60 ? "#eab308" : "#ef4444",
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">{lead.score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background: lead.status === "new" ? "#fef9c3" : lead.status === "contacted" ? "#dcfce7" : "#f3f4f6",
                        color: lead.status === "new" ? "#854d0e" : lead.status === "contacted" ? "#166534" : "#6b7280",
                      }}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: ageColor }}>
                    {lead.createdAt}
                    {isStale && (
                      <span style={{ marginLeft: 4, fontSize: 9, color: "#dc2626", background: "#fef2f2", padding: "1px 4px", borderRadius: 3, fontWeight: 600 }}>
                        Stale
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded font-medium hover:bg-indigo-100 transition-colors">
                        View
                      </button>
                      <button className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded font-medium hover:bg-gray-200 transition-colors">
                        Note
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pulse tenants */}
      <div className="mt-4 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm">Pulse Tenant Status</h2>
        </div>
        <div className="p-4 grid grid-cols-4 gap-3">
          {mockClients.slice(0, 4).map((client) => (
            <div key={client.id} className="border border-gray-100 rounded-lg p-3">
              <div className="text-xs font-medium text-gray-800 mb-2 truncate">{client.name}</div>
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`w-1.5 h-1.5 rounded-full ${client.status === "active" ? "bg-green-500" : "bg-gray-300"}`} />
                <span className="text-xs text-gray-500">{client.status === "active" ? "Online" : "Paused"}</span>
              </div>
              <a href="#" className="text-xs text-indigo-600 hover:underline">Open Pulse →</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
