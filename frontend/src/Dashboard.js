import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";

function Dashboard({ isDark, onToggleDark }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState(null);


  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close three-dot menu on outside click
  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const navigate = useNavigate();

  /* ── Auth helper ─────────────────────────────────────── */
  const handleLogout = (showExpiredToast = false) => {
    localStorage.removeItem("token");
    if (showExpiredToast) {
      toast.error("Session expired. Please login again.", { id: "session_expired" });
    }
    if (window.location.pathname !== "/login") {
      navigate("/login");
    }
  };

  /* ── Data fetch ───────────────────────────────────────── */
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) { handleLogout(false); setLoading(false); return; }

      const res = await fetch(`${process.env.REACT_APP_API_URL}/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) { handleLogout(true); return; }

      const result = await res.json();
      if (!localStorage.getItem("token")) return;

      if (res.ok && result.success) {
        setData(result.data);
      } else {
        toast.error(result.message || "Failed to load inventory");
        setData({ pagination: { total: 0 }, alerts: { low_stock_count: 0 }, items: [] });
      }
    } catch (err) {
      if (localStorage.getItem("token")) toast.error("Network error fetching dashboard.");
    } finally {
      if (localStorage.getItem("token")) setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  /* ── Stock update ─────────────────────────────────────── */
  const handleStock = async (itemId, type) => {
    setUpdatingItemId(itemId);
    try {
      const token = localStorage.getItem("token");
      if (!token) { navigate("/login"); return; }

      const res = await fetch(`${process.env.REACT_APP_API_URL}/update-stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ item_id: itemId, type, quantity: 1 }),
      });
      if (res.status === 401) { handleLogout(true); return; }

      const result = await res.json();
      if (!localStorage.getItem("token")) return;

      if (res.ok && result.success) {
        toast.success(`Stock ${type === "IN" ? "increased ↑" : "decreased ↓"}`);
        await fetchData();
      } else {
        toast.error(result.message || "Failed to update stock");
      }
    } catch (err) {
      toast.error("Stock update error");
    } finally {
      setUpdatingItemId(null);
    }
  };

  /* ── Loading state ────────────────────────────────────── */
  if (loading || !data) return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-container/30 border-t-primary-container rounded-full animate-spin" />
        <p className="font-inter text-body-sm text-gray-500 tracking-wide uppercase">Loading Dashboard…</p>
      </div>
    </div>
  );

  /* ── Render ───────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-gray-950 antialiased pb-24 md:pb-0">

      {/* ── TOP APP BAR ────────────────────────────────── */}
      <TopBar isDark={isDark} onToggleDark={onToggleDark} />

      {/* ── MAIN ───────────────────────────────────────── */}
      <main className="pt-24 px-5 md:px-6 max-w-7xl mx-auto space-y-6">

        {/* Welcome row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-space text-headline-lg text-gray-900 dark:text-white">Dashboard</h2>
            <p className="font-inter text-body-md text-gray-500 dark:text-gray-400 mt-1">Operational status for current shift.</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex-1 md:flex-none px-6 py-3 rounded-lg border-[1.5px] border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-inter text-label-caps hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-gray-400 dark:border-gray-500 border-t-[#6d3bd7] rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[18px]">refresh</span>
              )}
              {loading ? "REFRESHING…" : "REFRESH"}
            </button>
            <button
              onClick={() => navigate("/scan", { state: { autoStartCamera: true } })}
              className="flex-1 md:flex-none px-6 py-3 rounded-lg bg-[#6d3bd7] text-white font-inter text-label-caps hover:bg-[#5a2eb8] transition-colors shadow-[0_0_20px_rgba(109,59,215,0.3)] flex items-center justify-center gap-2 active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">barcode_scanner</span>
              SCAN ITEM
            </button>
          </div>
        </div>

        {/* ── STAT CARDS (Bento grid) ─────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Total Inventory */}
          <div className="glass-panel dark:bg-gray-800/70 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700" />
            <div className="flex justify-between items-start mb-6 relative z-10">
              <span className="font-inter text-label-caps text-gray-500 dark:text-gray-400">TOTAL INVENTORY</span>
              <span className="material-symbols-outlined text-primary-container">inventory</span>
            </div>
            <div className="relative z-10">
              <div className="flex items-baseline gap-2">
                <span className="font-space text-display-numeric text-gray-900 dark:text-white">{data.pagination?.total ?? 0}</span>
                <div className="flex items-center text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded text-xs font-bold">
                  <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                  items
                </div>
              </div>
            </div>
          </div>

          {/* Low Stock */}
          <div className="glass-panel dark:bg-gray-800/70 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-2 h-full bg-amber-500" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mb-10 transition-transform group-hover:scale-150 duration-700" />
            <div className="flex justify-between items-start mb-6 relative z-10 pl-4">
              <span className="font-inter text-label-caps text-gray-500 dark:text-gray-400">LOW STOCK ALERTS</span>
              <span className="material-symbols-outlined text-amber-500">warning</span>
            </div>
            <div className="relative z-10 pl-4">
              <div className="flex items-baseline gap-2">
                <span className="font-space text-display-numeric text-gray-900 dark:text-white">{data.alerts?.low_stock_count ?? 0}</span>
                <span className="font-inter text-body-sm text-gray-500 dark:text-gray-400">items</span>
              </div>
            </div>
          </div>

          {/* Today's Scans */}
          <div className="glass-panel dark:bg-gray-800/70 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700" />
            <div className="flex justify-between items-start mb-6 relative z-10">
              <span className="font-inter text-label-caps text-gray-500 dark:text-gray-400">TODAY'S SCANS</span>
              <span className="material-symbols-outlined text-secondary-container">bolt</span>
            </div>
            <div className="relative z-10">
              <div className="flex items-baseline gap-2">
                <span className="font-space text-display-numeric text-gray-900 dark:text-white">{data.today_scan ?? 0}</span>
              </div>
              <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-[#6d3bd7] w-3/4 rounded-full" />
              </div>
            </div>
          </div>

        </div>

        {/* ── INVENTORY LIST ──────────────────────────── */}
        <div className="glass-panel dark:bg-gray-800/60 rounded-xl p-0 overflow-hidden mt-8">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white/50 dark:bg-gray-800/50">
            <h3 className="font-space text-[18px] font-semibold text-gray-900 dark:text-white">Inventory Items</h3>

            {/* Three-dot menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="text-gray-400 hover:text-[#6d3bd7] transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                <span className="material-symbols-outlined">more_horiz</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-30">
                  <button
                    onClick={() => { fetchData(); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 font-inter text-body-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                    Refresh
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 font-inter text-body-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">filter_list</span>
                    Filter
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 font-inter text-body-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Export CSV
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {!data.items || data.items.length === 0 ? (
              <div className="p-10 text-center">
                <span className="material-symbols-outlined text-[48px] text-gray-300 dark:text-gray-600 block mb-2">inventory_2</span>
                <p className="font-inter text-body-sm text-gray-400 dark:text-gray-500">No inventory items found.</p>
              </div>
            ) : (
              data.items.slice(0, 10).map((item) => {
                const isLow = item.quantity <= (item.min_quantity ?? 5);
                const busy  = updatingItemId === item._id;
                return (
                  <div
                    key={item._id}
                    className={`p-4 flex items-center justify-between hover:bg-gray-50/60 dark:hover:bg-gray-700/40 transition-colors cursor-pointer ${isLow ? "border-l-4 border-l-amber-400" : ""}`}
                  >
                    {/* Left: icon + info */}
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isLow ? "bg-amber-50 dark:bg-amber-900/30 text-amber-500" : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600"}`}>
                        <span className="material-symbols-outlined text-[20px]">
                          {isLow ? "error" : "check_circle"}
                        </span>
                      </div>
                      <div>
                        <p className="font-inter font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-body-md">
                          {item.name}
                          {isLow && (
                            <span className="inline-block px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-inter text-label-caps">
                              LOW
                            </span>
                          )}
                        </p>
                        <p className="font-inter text-body-sm text-gray-500 dark:text-gray-400">
                          {item.category}{item.sku ? ` • ${item.sku}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Right: stock controls */}
                    <div className="flex items-center gap-2 bg-gray-100/80 dark:bg-gray-700 p-1 rounded-xl">
                      <button
                        disabled={busy || item.quantity <= 0}
                        onClick={() => handleStock(item._id, "OUT")}
                        className="w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-600 rounded-lg shadow-sm text-gray-600 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[18px]">remove</span>
                      </button>

                      <span className="font-space font-bold text-gray-900 dark:text-white w-7 text-center text-sm">
                        {busy ? (
                          <span className="inline-block w-4 h-4 border-2 border-gray-400 border-t-[#6d3bd7] rounded-full animate-spin" />
                        ) : item.quantity}
                      </span>

                      <button
                        disabled={busy}
                        onClick={() => handleStock(item._id, "IN")}
                        className="w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-600 rounded-lg shadow-sm text-gray-600 dark:text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </main>

      {/* ── BOTTOM NAV (mobile) ─────────────────────────── */}
      <BottomNav />


    </div>
  );
}

export default Dashboard;