import { useNavigate, useLocation } from "react-router-dom";

const TABS = [
  { icon: "dashboard",       label: "Fleet",  path: "/dashboard" },
  { icon: "inventory_2",     label: "Stock",  path: "/stock"     },
  { icon: "barcode_scanner", label: "Scan",   path: "/scan"      },
  { icon: "analytics",       label: "Data",   path: "/data"      },
  { icon: "person",          label: "User",   path: "/profile"   },
];

function BottomNav() {
  const navigate  = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 w-full z-50 flex justify-around items-center px-2 pb-6 pt-3 h-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-2xl">
      {TABS.map(({ icon, label, path }) => {
        const active = pathname === path || (path === "/dashboard" && pathname === "/");
        return (
          <button
            key={label}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center justify-center transition-all active:scale-90 ${
              active ? "text-[#6d3bd7] scale-110" : "text-gray-400 dark:text-gray-500 opacity-70 hover:text-[#6d3bd7]"
            }`}
          >
            <span
              className="material-symbols-outlined mb-1"
              style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {icon}
            </span>
            <span className="font-space text-[10px] uppercase tracking-widest font-bold">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default BottomNav;
