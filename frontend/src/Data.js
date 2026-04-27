import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const TYPE_CONFIG = {
  IN:     { label: "Stock In",  icon: "arrow_downward", cls: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" },
  OUT:    { label: "Stock Out", icon: "arrow_upward",   cls: "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400" },
  SCAN:   { label: "Scan",      icon: "qr_code_scanner",cls: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
  ADJUST: { label: "Adjust",    icon: "tune",           cls: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" },
};

function Data({ isDark, onToggleDark }) {
  const [history, setHistory]     = useState([]);
  const [summary, setSummary]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(false);
  const navigate                  = useNavigate();

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return null; }
    return { Authorization: `Bearer ${token}` };
  };

  /* ── Fetch summary ─────────────────────────────────── */
  const fetchSummary = async () => {
    try {
      const headers = authHeaders();
      if (!headers) return;
      const res = await fetch(`${API}/history/summary`, { headers });
      if (res.status === 401) { localStorage.removeItem("token"); navigate("/login"); return; }
      const result = await res.json();
      if (result.success) setSummary(result.data ?? null);
    } catch { /* silent */ }
  };

  /* ── Fetch history ─────────────────────────────────── */
  const fetchHistory = async (p = 1) => {
    setLoading(true);
    try {
      const headers = authHeaders();
      if (!headers) return;
      const res = await fetch(`${API}/history?page=${p}&limit=20`, { headers });
      if (res.status === 401) { localStorage.removeItem("token"); navigate("/login"); return; }
      const result = await res.json();
      if (result.success) {
        const rows = result.data?.transactions ?? result.data?.history ?? result.data ?? [];
        setHistory(p === 1 ? rows : (prev) => [...prev, ...rows]);
        setHasMore(rows.length === 20);
        setPage(p);
      } else {
        toast.error(result.message || "Failed to load history");
      }
    } catch {
      toast.error("Network error loading history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchHistory(1);
  }, []);

  const formatDate = (raw) => {
    if (!raw) return "—";
    const d = new Date(raw);
    return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-gray-950 antialiased pb-24 md:pb-0">
      <TopBar isDark={isDark} onToggleDark={onToggleDark} />

      <main className="pt-24 px-5 md:px-6 max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-space text-headline-lg text-gray-900 dark:text-white">Data &amp; Analytics</h2>
            <p className="font-inter text-body-md text-gray-500 dark:text-gray-400 mt-1">
              Transaction history and stock movement
            </p>
          </div>
          <button
            onClick={() => { fetchSummary(); fetchHistory(1); }}
            disabled={loading}
            className="px-6 py-3 rounded-lg border-[1.5px] border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-inter text-label-caps hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-[#6d3bd7] rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[18px]">refresh</span>
            )}
            {loading ? "REFRESHING…" : "REFRESH"}
          </button>
        </div>

        {/* Summary cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 card-enter">
            {[
              { label: "Total In",   value: summary.total_in   ?? "—", icon: "arrow_downward", color: "text-emerald-500" },
              { label: "Total Out",  value: summary.total_out  ?? "—", icon: "arrow_upward",   color: "text-red-500"     },
              { label: "Total Scans",value: summary.total_scans?? "—", icon: "qr_code_scanner",color: "text-blue-500"    },
              { label: "Items",      value: summary.total_items?? "—", icon: "inventory_2",    color: "text-primary-container" },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="glass-panel dark:bg-gray-800/60 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-inter text-label-caps text-gray-500 dark:text-gray-400">{label.toUpperCase()}</span>
                  <span className={`material-symbols-outlined text-[20px] ${color}`}>{icon}</span>
                </div>
                <span className="font-space text-[32px] font-bold text-gray-900 dark:text-white leading-none">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Transaction list */}
        <div className="glass-panel dark:bg-gray-800/60 rounded-xl p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
            <h3 className="font-space text-[18px] font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
          </div>

          {loading && history.length === 0 ? (
            <div className="p-12 flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-primary-container/30 border-t-primary-container rounded-full animate-spin" />
              <p className="font-inter text-body-sm text-gray-400">Loading history…</p>
            </div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-[48px] text-gray-300 block mb-2">history</span>
              <p className="font-inter text-body-sm text-gray-400">No transactions recorded yet.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100 dark:divide-gray-700 card-enter">
                {history.map((tx, i) => {
                  const cfg = TYPE_CONFIG[tx.type] ?? TYPE_CONFIG.SCAN;
                  return (
                    <div key={tx._id ?? i} className="p-4 flex items-center justify-between hover:bg-gray-50/60 dark:hover:bg-gray-700/40 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.cls}`}>
                          <span className="material-symbols-outlined text-[20px]">{cfg.icon}</span>
                        </div>
                        <div>
                          <p className="font-inter font-semibold text-gray-900 dark:text-white text-body-md">
                            {tx.item?.name ?? tx.item_name ?? "Unknown Item"}
                          </p>
                          <p className="font-inter text-body-sm text-gray-500 dark:text-gray-400">
                            {tx.item?.sku ?? tx.sku ?? ""}{tx.notes ? ` • ${tx.notes}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <span className={`inline-block px-2 py-0.5 rounded font-inter text-label-caps ${cfg.cls} mb-1`}>
                          {cfg.label} {tx.quantity != null ? `× ${tx.quantity}` : ""}
                        </span>
                        <p className="font-inter text-body-sm text-gray-400 text-xs">{formatDate(tx.created_at ?? tx.timestamp)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load more */}
              {hasMore && (
                <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => fetchHistory(page + 1)}
                    disabled={loading}
                    className="w-full py-2 rounded-lg border-[1.5px] border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-inter text-label-caps hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-[#6d3bd7] rounded-full animate-spin" />
                        Loading…
                      </>
                    ) : "Load More"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </main>

      <BottomNav />
    </div>
  );
}

export default Data;
