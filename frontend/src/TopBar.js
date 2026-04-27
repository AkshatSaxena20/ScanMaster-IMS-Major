import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";

const DESKTOP_TABS = [
  { icon: "dashboard",       label: "FLEET", path: "/dashboard" },
  { icon: "inventory_2",     label: "STOCK", path: "/stock"     },
  { icon: "barcode_scanner", label: "SCAN",  path: "/scan"      },
  { icon: "analytics",       label: "DATA",  path: "/data"      },
];

function TopBar({ isDark, onToggleDark }) {
  const navigate     = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.dismiss();
    navigate("/login");
  };

  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-5 h-16 bg-white/80 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-[0_0_15px_rgba(139,92,246,0.05)]">
      {/* Brand + profile icon */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/profile")}
          className="w-8 h-8 rounded-full bg-primary-container/30 text-primary-container flex items-center justify-center hover:ring-2 hover:ring-primary-container/40 transition-all active:scale-95"
          title="Profile"
        >
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
            person
          </span>
        </button>
        <h1 className="font-space text-xl font-black tracking-tight text-gray-900 dark:text-white">ScanMaster</h1>
      </div>

      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-8">
        {DESKTOP_TABS.map(({ icon, label, path }) => {
          const active = pathname === path || (path === "/dashboard" && pathname === "/");
          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`font-inter text-label-caps flex items-center gap-2 transition-colors ${
                active ? "text-primary-container" : "text-gray-500 dark:text-gray-400 hover:text-primary-container"
              }`}
            >
              <span className="material-symbols-outlined text-lg">{icon}</span>
              {label}
            </button>
          );
        })}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:scale-95"
          title={isDark ? "Light mode" : "Dark mode"}
        >
          <span className="material-symbols-outlined">{isDark ? "light_mode" : "dark_mode"}</span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors active:scale-95"
          title="Logout"
        >
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>
    </header>
  );
}

export default TopBar;
