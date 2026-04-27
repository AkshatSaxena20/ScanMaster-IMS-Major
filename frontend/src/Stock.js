import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function Stock({ isDark, onToggleDark }) {
  const [items, setItems]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [updatingId, setUpdatingId]     = useState(null);
  const [openMenuId, setOpenMenuId]     = useState(null);   // three-dot per-item
  const [search, setSearch]             = useState("");
  const menuRefs                        = useRef({});
  const navigate                        = useNavigate();

  /* ── Auth helper ───────────────────────────────────── */
  const authHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return null; }
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  };

  /* ── Fetch inventory ───────────────────────────────── */
  const fetchItems = async () => {
    setLoading(true);
    try {
      const headers = authHeaders();
      if (!headers) return;
      const res = await fetch(`${API}/inventory`, { headers });
      if (res.status === 401) { localStorage.removeItem("token"); navigate("/login"); return; }
      const result = await res.json();
      if (result.success) setItems(result.data?.items ?? []);
      else toast.error(result.message || "Failed to load inventory");
    } catch {
      toast.error("Network error loading stock.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // close menu on outside click
    const handler = (e) => {
      const open = openMenuId;
      if (open && menuRefs.current[open] && !menuRefs.current[open].contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenuId]);

  /* ── Stock update ──────────────────────────────────── */
  const handleStock = async (itemId, type) => {
    setUpdatingId(itemId);
    try {
      const headers = authHeaders();
      if (!headers) return;
      const res = await fetch(`${API}/update-stock`, {
        method: "POST",
        headers,
        body: JSON.stringify({ item_id: itemId, type, quantity: 1 }),
      });
      if (res.status === 401) { localStorage.removeItem("token"); navigate("/login"); return; }
      const result = await res.json();
      if (!localStorage.getItem("token")) return;
      if (result.success) {
        toast.success(`Stock ${type === "IN" ? "increased ↑" : "decreased ↓"}`);
        await fetchItems();
      } else {
        toast.error(result.message || "Stock update failed");
      }
    } catch {
      toast.error("Network error updating stock.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = items.filter(
    (i) =>
      i.name?.toLowerCase().includes(search.toLowerCase()) ||
      i.category?.toLowerCase().includes(search.toLowerCase()) ||
      i.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-gray-950 antialiased pb-24 md:pb-0">
      <TopBar isDark={isDark} onToggleDark={onToggleDark} />

      <main className="pt-24 px-5 md:px-6 max-w-7xl mx-auto space-y-6">

        {/* Header row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
          <div>
            <h2 className="font-space text-headline-lg text-gray-900 dark:text-white">Stock Management</h2>
            <p className="font-inter text-body-md text-gray-500 dark:text-gray-400 mt-1">
              {items.length} items tracked
            </p>
          </div>
          <button
            onClick={fetchItems}
            disabled={loading}
            className="px-6 py-3 rounded-lg border-[1.5px] border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-inter text-label-caps hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-[#6d3bd7] rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[18px]">refresh</span>
            )}
            {loading ? "REFRESHING…" : "REFRESH"}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, category or SKU…"
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-inter text-body-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#6d3bd7] transition-all"
          />
        </div>

        {/* List */}
        <div className="glass-panel dark:bg-gray-800/60 rounded-xl p-0 overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-primary-container/30 border-t-primary-container rounded-full animate-spin" />
              <p className="font-inter text-body-sm text-gray-400">Loading stock…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-[48px] text-gray-300 block mb-2">inventory_2</span>
              <p className="font-inter text-body-sm text-gray-400">No items found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700 card-enter">
              {filtered.map((item) => {
                const isLow  = item.quantity <= (item.min_quantity ?? 5);
                const busy   = updatingId === item._id;
                const isOpen = openMenuId === item._id;
                return (
                  <div
                    key={item._id}
                    className={`p-4 flex items-center justify-between hover:bg-gray-50/60 dark:hover:bg-gray-700/40 transition-colors ${isLow ? "border-l-4 border-l-amber-400" : ""}`}
                  >
                    {/* Left */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isLow ? "bg-amber-50 text-amber-500" : "bg-emerald-50 text-emerald-600"}`}>
                        <span className="material-symbols-outlined text-[20px]">{isLow ? "error" : "check_circle"}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-inter font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-body-md truncate">
                          {item.name}
                          {isLow && <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-inter text-label-caps flex-shrink-0">LOW</span>}
                        </p>
                        <p className="font-inter text-body-sm text-gray-500 dark:text-gray-400 truncate">
                          {item.category}{item.sku ? ` • ${item.sku}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Right: controls + three-dot */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Stock controls */}
                      <div className="flex items-center gap-2 bg-gray-100/80 dark:bg-gray-700 p-1 rounded-xl">
                        <button
                          disabled={busy || item.quantity <= 0}
                          onClick={() => handleStock(item._id, "OUT")}
                          className="w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-600 rounded-lg shadow-sm text-gray-600 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[18px]">remove</span>
                        </button>
                        <span className="font-space font-bold text-gray-900 dark:text-white w-7 text-center text-sm">
                          {busy ? <span className="inline-block w-4 h-4 border-2 border-gray-400 border-t-[#6d3bd7] rounded-full animate-spin" /> : item.quantity}
                        </span>
                        <button
                          disabled={busy}
                          onClick={() => handleStock(item._id, "IN")}
                          className="w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-600 rounded-lg shadow-sm text-gray-600 dark:text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[18px]">add</span>
                        </button>
                      </div>

                      {/* Per-item three-dot menu */}
                      <div className="relative" ref={(el) => (menuRefs.current[item._id] = el)}>
                        <button
                          onClick={() => setOpenMenuId(isOpen ? null : item._id)}
                          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-[#6d3bd7] hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </button>
                        {isOpen && (
                          <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-30">
                            <button
                              onClick={() => { handleStock(item._id, "IN"); setOpenMenuId(null); }}
                              className="w-full text-left px-4 py-2 font-inter text-body-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-[16px] text-emerald-500">add_circle</span>
                              Stock In
                            </button>
                            <button
                              onClick={() => { handleStock(item._id, "OUT"); setOpenMenuId(null); }}
                              className="w-full text-left px-4 py-2 font-inter text-body-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-[16px] text-red-400">remove_circle</span>
                              Stock Out
                            </button>
                            <hr className="my-1 border-gray-100 dark:border-gray-700" />
                            <button
                              onClick={() => { navigator.clipboard.writeText(item.sku ?? item._id); toast.success("Copied!"); setOpenMenuId(null); }}
                              className="w-full text-left px-4 py-2 font-inter text-body-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-[16px]">content_copy</span>
                              Copy SKU
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

export default Stock;
