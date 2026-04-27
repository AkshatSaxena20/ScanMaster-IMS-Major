import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { Capacitor } from "@capacitor/core";
import { BarcodeScanner } from "@capacitor-community/barcode-scanner";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const IS_NATIVE = Capacitor.isNativePlatform();

function Scan({ isDark, onToggleDark }) {
  const [qrInput, setQrInput]         = useState("");
  const [scanning, setScanning]       = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [camPermission, setCamPermission] = useState(null); // null | "granted" | "denied"
  const [scannedItem, setScanned]     = useState(null);
  const [updating, setUpdating]       = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newItemData, setNewItemData] = useState({ name: "", category: "" });
  const [creating, setCreating]       = useState(false);
  const navigate                      = useNavigate();
  const location                      = useLocation();
  const inputRef                      = useRef(null);
  const autoStarted                   = useRef(false);

  /* ── Cleanup camera on unmount ──────────────────────── */
  useEffect(() => {
    return () => {
      if (IS_NATIVE) {
        BarcodeScanner.showBackground().catch(() => {});
        BarcodeScanner.stopScan().catch(() => {});
      }
    };
  }, []);

  /* ── Auth helper ────────────────────────────────────── */
  const authHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return null; }
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  };

  /* ── API: Scan submission ───────────────────────────── */
  const handleScan = async (code) => {
    const qr = (code ?? qrInput).trim();
    if (!qr) return;
    setScanning(true);
    setScanned(null);
    setShowCreateModal(false);
    try {
      const headers = authHeaders();
      if (!headers) return;
      const res = await fetch(`${API}/inventory/${encodeURIComponent(qr)}`, {
        headers,
      });
      if (res.status === 401) { localStorage.removeItem("token"); navigate("/login"); return; }
      
      if (res.status === 404) {
        setQrInput(qr);
        setShowCreateModal(true);
        toast("New QR code detected. Create item?", { icon: "✨" });
        return;
      }
      
      const result = await res.json();
      if (!localStorage.getItem("token")) return;
      
      if (res.ok && result.success) {
        setScanned(result.data?.item ?? result.data ?? null);
        toast.success("Item scanned!");
      } else {
        toast.error(result.message || "Scan failed.");
      }
    } catch {
      toast.error("Network error during scan.");
    } finally {
      setScanning(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  };

  /* ── API: Stock update after scan ───────────────────── */
  const handleStock = async (type) => {
    if (!scannedItem) return;
    setUpdating(type);
    try {
      const headers = authHeaders();
      if (!headers) return;
      const res = await fetch(`${API}/update-stock`, {
        method: "POST",
        headers,
        body: JSON.stringify({ item_id: scannedItem._id, type, quantity: 1 }),
      });
      if (res.status === 401) { localStorage.removeItem("token"); navigate("/login"); return; }
      const result = await res.json();
      if (!localStorage.getItem("token")) return;
      if (result.success) {
        toast.success(`Stock ${type === "IN" ? "increased ↑" : "decreased ↓"}`);
        setScanned((prev) => ({
          ...prev,
          quantity: type === "IN" ? prev.quantity + 1 : Math.max(0, prev.quantity - 1),
        }));
      } else {
        toast.error(result.message || "Stock update failed.");
      }
    } catch {
      toast.error("Network error updating stock.");
    } finally {
      setUpdating(null);
    }
  };

  /* ── API: Create new item ───────────────────────────── */
  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!newItemData.name.trim() || !qrInput.trim()) return;
    setCreating(true);
    try {
      const headers = authHeaders();
      if (!headers) return;
      const res = await fetch(`${API}/inventory`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: newItemData.name.trim(),
          category: newItemData.category.trim() || "Uncategorized",
          sku: qrInput.trim(),
          qr_code: qrInput.trim(),
          quantity: 0
        }),
      });
      if (res.status === 401) { localStorage.removeItem("token"); navigate("/login"); return; }
      const result = await res.json();
      if (res.ok && result.success) {
        toast.success("Item created successfully!");
        setShowCreateModal(false);
        setNewItemData({ name: "", category: "" });
        setScanned(result.data?.item ?? null);
      } else {
        toast.error(result.message || "Failed to create item.");
      }
    } catch {
      toast.error("Network error creating item.");
    } finally {
      setCreating(false);
    }
  };

  /* ── Camera: Start scan ─────────────────────────────── */
  const startCameraScanner = async () => {
    try {
      // Request / check permission
      const status = await BarcodeScanner.checkPermission({ force: true });
      if (status.denied) {
        setCamPermission("denied");
        toast.error("Camera permission denied. Enable it in Settings.");
        return;
      }
      if (!status.granted) {
        setCamPermission("denied");
        toast.error("Camera permission not granted.");
        return;
      }
      setCamPermission("granted");

      // Hide the WebView background so camera shows through
      await BarcodeScanner.hideBackground();
      document.body.classList.add("scanner-active");
      setCameraActive(true);

      const result = await BarcodeScanner.startScan();

      // Restore after scan (success or cancel via stopCameraScanner)
      await stopCameraScanner();

      if (result.hasContent) {
        setQrInput(result.content);
        toast("QR detected — submitting…", { icon: "📷" });
        await handleScan(result.content);
      }
    } catch (err) {
      await stopCameraScanner();
      toast.error("Camera error: " + (err?.message ?? "unknown"));
    }
  };

  /* ── Camera: Stop scan ──────────────────────────────── */
  const stopCameraScanner = async () => {
    try {
      await BarcodeScanner.showBackground();
      await BarcodeScanner.stopScan();
    } catch { /* ignore */ }
    document.body.classList.remove("scanner-active");
    setCameraActive(false);
  };

  /* ── Auto-start camera if navigated from Dashboard ──── */
  useEffect(() => {
    if (IS_NATIVE && location.state?.autoStartCamera && !autoStarted.current) {
      autoStarted.current = true;
      // Clear state so it doesn't auto-start on refresh
      const state = { ...location.state };
      delete state.autoStartCamera;
      navigate(location.pathname, { replace: true, state });
      
      startCameraScanner();
    }
  }, [location.state, navigate, location.pathname]);

  const isLow = scannedItem && scannedItem.quantity <= (scannedItem.min_quantity ?? 5);

  /* ── Camera overlay (full-screen, native only) ──────── */
  if (cameraActive) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col">
        {/* Transparent "viewfinder" area — camera shows beneath */}
        <div className="flex-1 relative flex flex-col items-center justify-center">
          {/* Corner brackets */}
          <div className="w-56 h-56 relative">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
            {/* scanning line animation */}
            <div className="absolute left-1 right-1 top-0 h-0.5 bg-[#a078ff] animate-[scanLine_2s_ease-in-out_infinite]" />
          </div>
          <p className="text-white/80 font-inter text-sm mt-6 text-center px-8">
            Point camera at a QR code or barcode
          </p>
        </div>

        {/* Cancel bar */}
        <div className="bg-gray-900/90 backdrop-blur-sm px-6 py-8 flex flex-col items-center gap-3 safe-area-bottom">
          <button
            onClick={stopCameraScanner}
            className="w-full max-w-xs h-12 rounded-xl bg-white/10 border border-white/20 text-white font-inter text-label-caps uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
            Cancel Scan
          </button>
        </div>
      </div>
    );
  }

  /* ── Normal Scan page ───────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-gray-950 antialiased pb-24 md:pb-0">
      <TopBar isDark={isDark} onToggleDark={onToggleDark} />

      <main className="pt-24 px-5 md:px-6 max-w-md mx-auto space-y-6">

        <div>
          <h2 className="font-space text-headline-lg text-gray-900 dark:text-white">Scan Item</h2>
          <p className="font-inter text-body-md text-gray-500 dark:text-gray-400 mt-1">
            Scan with camera or enter a code manually.
          </p>
        </div>

        {/* Camera scan card — native only */}
        {IS_NATIVE && (
          <div className="glass-panel dark:bg-gray-800/60 rounded-xl p-5">
            <p className="font-inter text-label-caps text-gray-500 dark:text-gray-400 mb-3">CAMERA SCANNER</p>

            {camPermission === "denied" ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg p-4">
                <p className="font-inter text-body-sm text-red-600 dark:text-red-400 mb-2">
                  Camera permission was denied.
                </p>
                <button
                  onClick={() => BarcodeScanner.openAppSettings()}
                  className="font-inter text-label-caps text-[#6d3bd7] underline underline-offset-2"
                >
                  Open App Settings →
                </button>
              </div>
            ) : (
              <button
                onClick={startCameraScanner}
                className="w-full h-14 rounded-xl bg-[#6d3bd7] text-white font-inter text-label-caps uppercase tracking-wider hover:bg-[#5a2eb8] transition-all shadow-[0_0_20px_rgba(109,59,215,0.3)] flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[22px]">photo_camera</span>
                Scan with Camera
              </button>
            )}
          </div>
        )}

        {/* Manual input card */}
        <div className="glass-panel dark:bg-gray-800/60 rounded-xl p-5 space-y-4">

          {/* HUD corners */}
          <div className="relative border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-secondary-container rounded-tl" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-secondary-container rounded-tr" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-secondary-container rounded-bl" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-secondary-container rounded-br" />

            <label className="block font-inter text-label-caps text-gray-500 dark:text-gray-400 mb-2">
              MANUAL CODE ENTRY
              <span className="ml-2 font-inter text-[10px] text-gray-400 normal-case tracking-normal">
                Press Enter ⏎ to scan
              </span>
            </label>
            <form onSubmit={(e) => { e.preventDefault(); handleScan(); }} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                autoFocus={!IS_NATIVE}
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="e.g. QR-UH-002"
                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg font-inter text-body-md text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#6d3bd7] focus:ring-2 focus:ring-[#6d3bd7]/20 transition-all"
              />
              <button
                type="submit"
                disabled={scanning || !qrInput.trim()}
                className="px-4 py-3 rounded-lg bg-[#6d3bd7] text-white font-inter text-label-caps hover:bg-[#5a2eb8] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(109,59,215,0.25)] flex items-center gap-2 active:scale-95"
              >
                {scanning ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">barcode_scanner</span>
                )}
              </button>
            </form>
          </div>

          <button
            onClick={() => handleScan()}
            disabled={scanning || !qrInput.trim()}
            className={`w-full h-12 rounded-lg bg-[#6d3bd7] text-white font-inter text-label-caps uppercase tracking-wider hover:bg-[#5a2eb8] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(109,59,215,0.3)] flex items-center justify-center gap-2 active:scale-[0.98] ${scanning ? "scan-pulse" : ""}`}
          >
            {scanning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Scanning…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">search</span>
                Look Up Item
              </>
            )}
          </button>
        </div>

        {/* Scanned item result */}
        {scannedItem && (
          <div className="glass-panel dark:bg-gray-800/60 rounded-xl overflow-hidden card-enter">

            {/* Item header */}
            <div className={`p-4 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between ${isLow ? "bg-amber-50/60 dark:bg-amber-900/20" : "bg-emerald-50/60 dark:bg-emerald-900/10"}`}>
              <div>
                <span className="font-inter text-label-caps text-gray-500 dark:text-gray-400">DETECTED ITEM</span>
                <h3 className="font-space text-headline-md text-gray-900 dark:text-white mt-1">{scannedItem.name}</h3>
                <p className="font-inter text-body-sm text-gray-500 dark:text-gray-400">
                  SKU: <span className="font-mono text-[#6d3bd7]">{scannedItem.sku || scannedItem._id}</span>
                </p>
                {scannedItem.category && (
                  <p className="font-inter text-body-sm text-gray-500 dark:text-gray-400">{scannedItem.category}</p>
                )}
              </div>

              {/* Qty badge */}
              <div className="bg-white dark:bg-gray-700 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-600 flex flex-col items-end">
                <span className="font-inter text-label-caps text-gray-500 dark:text-gray-400">QTY ON HAND</span>
                <span className="font-space text-display-numeric text-gray-900 dark:text-white leading-none">{scannedItem.quantity}</span>
                {isLow && <span className="font-inter text-label-caps text-amber-700 mt-1">LOW STOCK</span>}
              </div>
            </div>

            {/* Action buttons */}
            <div className="p-4 grid grid-cols-2 gap-4">
              <button
                disabled={updating !== null || (scannedItem.quantity ?? 0) <= 0}
                onClick={() => handleStock("OUT")}
                className="h-14 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-inter text-label-caps rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
              >
                {updating === "OUT" ? (
                  <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined">remove</span>
                )}
                STOCK OUT
              </button>
              <button
                disabled={updating !== null}
                onClick={() => handleStock("IN")}
                className="h-14 bg-[#6d3bd7] text-white font-inter text-label-caps rounded-xl flex items-center justify-center gap-2 hover:bg-[#5a2eb8] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all shadow-[0_0_15px_rgba(109,59,215,0.25)]"
              >
                {updating === "IN" ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined">add</span>
                )}
                STOCK IN
              </button>
            </div>

            {/* Scan another */}
            <div className="px-4 pb-4">
              <button
                onClick={() => {
                  setScanned(null);
                  setQrInput("");
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className="w-full py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 font-inter text-label-caps text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                SCAN ANOTHER ITEM
              </button>
            </div>

          </div>
        )}

      </main>

      <BottomNav />

      {/* ── CREATE ITEM MODAL ─────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 w-full sm:max-w-md sm:rounded-xl rounded-t-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">

            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary-container text-[18px]">add_box</span>
                </div>
                <h3 className="font-space font-semibold text-gray-900 dark:text-white">Create New Item</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="p-6 space-y-4">
              <div>
                <label className="block font-inter text-label-caps text-gray-500 dark:text-gray-400 mb-2">
                  SKU / QR Code
                </label>
                <input
                  type="text"
                  readOnly
                  value={qrInput}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-lg font-inter text-body-md focus:outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-inter text-label-caps text-gray-500 dark:text-gray-400 mb-2">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newItemData.name}
                  onChange={(e) => setNewItemData({ ...newItemData, name: e.target.value })}
                  placeholder="e.g. Copper Wire 2mm"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg font-inter text-body-md focus:outline-none focus:border-[#6d3bd7] focus:ring-2 focus:ring-[#6d3bd7]/20 transition-all"
                />
              </div>

              <div>
                <label className="block font-inter text-label-caps text-gray-500 dark:text-gray-400 mb-2">
                  Category <span className="text-gray-400 normal-case">(optional)</span>
                </label>
                <input
                  type="text"
                  value={newItemData.category}
                  onChange={(e) => setNewItemData({ ...newItemData, category: e.target.value })}
                  placeholder="e.g. Electrical"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg font-inter text-body-md focus:outline-none focus:border-[#6d3bd7] focus:ring-2 focus:ring-[#6d3bd7]/20 transition-all"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={creating || !newItemData.name.trim()}
                  className="w-full h-12 rounded-lg bg-[#6d3bd7] text-white font-inter text-label-caps uppercase tracking-wider hover:bg-[#5a2eb8] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(109,59,215,0.3)] flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {creating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">add_task</span>
                      Create Item
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Scan;
