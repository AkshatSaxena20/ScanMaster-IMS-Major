import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Login     from "./Login";
import Dashboard from "./Dashboard";
import Stock     from "./Stock";
import Scan      from "./Scan";
import Data      from "./Data";
import Profile   from "./Profile";

/* ── Dark mode helper ─────────────────────────────────── */
function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("darkMode", isDark);
  }, [isDark]);

  return [isDark, () => setIsDark((d) => !d)];
}

/* ── Protected route ──────────────────────────────────── */
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

/* ── App ──────────────────────────────────────────────── */
function App() {
  const [isDark, toggleDark] = useDarkMode();

  const protectedProps = { isDark, onToggleDark: toggleDark };

  return (
    <Router>
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={10}
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: "'Inter', sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            borderRadius: "10px",
            padding: "12px 16px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            maxWidth: "380px",
          },
          success: {
            style: {
              background: "#fff",
              color: "#111827",
              borderLeft: "4px solid #6d3bd7",
            },
            iconTheme: { primary: "#6d3bd7", secondary: "#fff" },
          },
          error: {
            style: {
              background: "#fff",
              color: "#111827",
              borderLeft: "4px solid #ef4444",
            },
            iconTheme: { primary: "#ef4444", secondary: "#fff" },
          },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected */}
        <Route path="/"          element={<ProtectedRoute><Dashboard {...protectedProps} /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard {...protectedProps} /></ProtectedRoute>} />
        <Route path="/stock"     element={<ProtectedRoute><Stock     {...protectedProps} /></ProtectedRoute>} />
        <Route path="/scan"      element={<ProtectedRoute><Scan      {...protectedProps} /></ProtectedRoute>} />
        <Route path="/data"      element={<ProtectedRoute><Data      {...protectedProps} /></ProtectedRoute>} />
        <Route path="/profile"   element={<ProtectedRoute><Profile   {...protectedProps} /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;