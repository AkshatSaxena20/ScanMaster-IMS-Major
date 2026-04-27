import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        localStorage.setItem("token", result.data.token);
        toast.dismiss();
        toast.success("Login successful!");
        setTimeout(() => navigate("/"), 100);
      } else {
        toast.error(result.message || "Login failed");
      }
    } catch (err) {
      toast.error("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Full-screen dark background with atmospheric glows — matches login_light_mode/code.html */
    <div className="min-h-screen bg-[#15121b] flex items-center justify-center p-5 relative overflow-hidden">

      {/* Atmospheric glow blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-secondary/15 blur-[120px] pointer-events-none" />

      {/* Auth card */}
      <main className="relative z-10 w-full max-w-[420px] bg-surface/80 backdrop-blur-2xl border border-outline-variant/40 rounded-xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">

        {/* Brand header */}
        <header className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-surface-container-high border border-outline-variant/60 mb-4 flex items-center justify-center shadow-[0_0_20px_rgba(208,188,255,0.15)]">
            <span
              className="material-symbols-outlined text-[32px] text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              barcode_scanner
            </span>
          </div>
          <h1 className="font-space text-headline-lg text-on-surface tracking-tight">ScanMaster</h1>
          <p className="font-inter text-label-caps text-secondary tracking-widest mt-1 uppercase opacity-80">
            Operational Intelligence
          </p>
        </header>

        {/* Form */}
        <form className="flex flex-col gap-4" onSubmit={handleLogin}>

          {/* Email field */}
          <div className="flex flex-col gap-1 hud-field">
            <label className="font-inter text-label-caps text-on-surface-variant uppercase" htmlFor="login-email">
              Operator ID
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                person
              </span>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full bg-surface-container-high text-on-surface font-inter text-body-md pl-9 pr-3 py-2 border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 focus:bg-surface-bright transition-all duration-300 placeholder:text-outline/50 outline-none"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-1 hud-field">
            <label className="font-inter text-label-caps text-on-surface-variant uppercase" htmlFor="login-password">
              Security Passcode
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                key
              </span>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-container-high text-on-surface font-inter text-body-md pl-9 pr-3 py-2 border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 focus:bg-surface-bright transition-all duration-300 placeholder:text-outline/50 outline-none"
              />
            </div>
          </div>

          {/* Primary CTA — gradient matches Stitch design */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-4 rounded-lg bg-gradient-to-r from-primary-container to-secondary text-on-primary-fixed font-space text-headline-md text-[18px] uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all duration-200 shadow-[0_0_20px_rgba(208,188,255,0.25)] border border-white/10 relative overflow-hidden group disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-on-primary-fixed border-t-transparent rounded-full animate-spin" />
                Initializing…
              </>
            ) : (
              <>
                Initialize Link
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Divider + secondary action */}
        <div className="mt-6 pt-6 border-t border-outline-variant/30 text-center">
          <button
            type="button"
            className="w-full py-2 rounded-lg bg-transparent border-[1.5px] border-outline-variant text-on-surface-variant font-inter text-label-caps uppercase tracking-widest hover:bg-surface-container hover:text-on-surface hover:border-outline transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">badge</span>
            Authenticate via SSO Hub
          </button>
        </div>

      </main>
    </div>
  );
}

export default Login;
