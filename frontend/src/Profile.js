import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function Profile({ isDark, onToggleDark }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate              = useNavigate();

  /* ── Fetch current user ────────────────────────────── */
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) { navigate("/login"); return; }
        const res = await fetch(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) { localStorage.removeItem("token"); navigate("/login"); return; }
        const result = await res.json();
        if (result.success) setUser(result.data?.user ?? result.data ?? null);
      } catch { /* ignore — show what we have */ }
      finally { setLoading(false); }
    };
    fetchMe();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.dismiss();
    navigate("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-gray-950 antialiased pb-24 md:pb-0">
      <TopBar isDark={isDark} onToggleDark={onToggleDark} />

      <main className="pt-24 px-5 md:px-6 max-w-md mx-auto space-y-6">
        <h2 className="font-space text-headline-lg text-gray-900 dark:text-white">Profile</h2>

        {loading ? (
          <div className="p-10 flex justify-center">
            <div className="w-10 h-10 border-4 border-primary-container/30 border-t-primary-container rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Avatar card */}
            <div className="glass-panel dark:bg-gray-800/60 rounded-xl p-6 flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-container to-secondary flex items-center justify-center flex-shrink-0">
                <span className="font-space text-2xl font-black text-white">{initials}</span>
              </div>
              <div className="min-w-0">
                <p className="font-space text-headline-md text-gray-900 dark:text-white truncate">
                  {user?.name ?? "Operator"}
                </p>
                <p className="font-inter text-body-sm text-gray-500 dark:text-gray-400 truncate">
                  {user?.email ?? "—"}
                </p>
                {user?.role && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded bg-primary-container/20 text-primary-container font-inter text-label-caps uppercase">
                    {user.role}
                  </span>
                )}
              </div>
            </div>

            {/* Info rows */}
            <div className="glass-panel dark:bg-gray-800/60 rounded-xl overflow-hidden">
              {[
                { icon: "person",       label: "Name",   value: user?.name   ?? "—" },
                { icon: "mail",         label: "Email",  value: user?.email  ?? "—" },
                { icon: "badge",        label: "Role",   value: user?.role   ?? "—" },
                { icon: "verified_user",label: "Status", value: user?.isActive ? "Active" : "Inactive" },
              ].map(({ icon, label, value }, i, arr) => (
                <div
                  key={label}
                  className={`px-5 py-4 flex items-center gap-4 ${i < arr.length - 1 ? "border-b border-gray-100 dark:border-gray-700" : ""}`}
                >
                  <span className="material-symbols-outlined text-[20px] text-gray-400 flex-shrink-0">{icon}</span>
                  <div>
                    <p className="font-inter text-label-caps text-gray-400 dark:text-gray-500">{label.toUpperCase()}</p>
                    <p className="font-inter text-body-md text-gray-900 dark:text-white">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Dark mode row */}
            <div className="glass-panel dark:bg-gray-800/60 rounded-xl px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-[20px] text-gray-400">
                  {isDark ? "dark_mode" : "light_mode"}
                </span>
                <div>
                  <p className="font-inter text-label-caps text-gray-400 dark:text-gray-500">APPEARANCE</p>
                  <p className="font-inter text-body-md text-gray-900 dark:text-white">
                    {isDark ? "Dark Mode" : "Light Mode"}
                  </p>
                </div>
              </div>
              <button
                onClick={onToggleDark}
                className={`relative w-12 h-6 rounded-full transition-colors ${isDark ? "bg-primary-container" : "bg-gray-300"}`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isDark ? "left-7" : "left-1"}`}
                />
              </button>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full px-6 py-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800 font-inter text-label-caps uppercase tracking-wider hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Sign Out
            </button>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

export default Profile;
