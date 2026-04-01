import { mockLeads, mockClients } from "@/lib/mock-data";

export default function Pulse() {
  const totalLeadsToday = mockClients.reduce((sum, c) => sum + c.leadsToday, 0);

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
        {mockClients.slice(0, 4).map((client) => (
          <div key={client.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xl font-bold text-gray-900">{client.leadsToday}</div>
            <div className="text-xs font-medium text-gray-700 mt-0.5 truncate">{client.name}</div>
            <div className="text-xs text-gray-400">{client.activeConvs} active convs</div>
            <div className="mt-2 h-1 bg-gray-100 rounded-full">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, client.leadsToday * 5)}%`,
                  background: "#6366f1",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Leads table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-sm">All Leads</h2>
          <div className="flex gap-2">
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
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">When</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {mockLeads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{lead.name}</div>
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
                  <div className="flex items-center gap-1.5">
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
                <td className="px-4 py-3 text-xs text-gray-500">{lead.createdAt}</td>
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
            ))}
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
