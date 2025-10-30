import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await login(username, password);
      navigate("/projects");
    } catch (e) {
      setErr("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white shadow rounded p-6 space-y-4">
        <h1 className="text-xl font-semibold">Sign in</h1>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <div>
          <label className="block text-sm mb-1">Username</label>
          <input className="w-full border rounded px-3 py-2" value={username} onChange={(e)=>setUsername(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input type="password" className="w-full border rounded px-3 py-2" value={password} onChange={(e)=>setPassword(e.target.value)} required />
        </div>
<<<<<<< Updated upstream
        <button className="w-full bg-black text-white py-2 rounded hover:bg-gray-800">Login</button>
      </form>
=======

        <div style={{ display: "flex", justifyContent: "space-between", opacity: 0.9, fontSize: "14px" }}>
          <span>Copyright © 2025 ResearchHub</span>
          <span style={{ textDecoration: "underline", cursor: "pointer" }}>Privacy Policy</span>
        </div>
      </div>

      {/* Right auth card */}
      <div style={styles.cardWrap}>
  <div className="auth-card" style={styles.card}>
          {/* Mobile brand */}
          {!isDesktop && (
            <div style={styles.mobileBrand}>
              <div style={{ ...styles.brandLogo, margin: "0 auto 12px" }}>
                <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#3F3FF3" }} />
              </div>
              <div style={{ fontSize: "18px", fontWeight: 600 }}>ResearchHub</div>
            </div>
          )}

          <div style={styles.headerRow}>
            <div style={styles.h1}>
              {view === "login" && "Sign in"}
              {view === "register" && "Create account"}
              {view === "forgot" && "Reset password"}
            </div>
            {view !== "forgot" ? (
              <button style={styles.linkBtn} type="button" onClick={() => setView(view === "login" ? "register" : "login")}>
                {view === "login" ? "Create account" : "Sign in"}
              </button>
            ) : (
              <button style={styles.linkBtn} type="button" onClick={() => setView("login")}>← Back</button>
            )}
          </div>
          <div style={styles.hint}>
            {view === "login" && "Enter your username and password to access your account."}
            {view === "register" && "Create a new account to get started."}
            {view === "forgot" && "Enter your email and we'll send you a reset link."}
          </div>

          <form onSubmit={onSubmit}>
            {view === "register" && (
              <div style={styles.inputRow}>
                <label style={styles.label}>Full name (optional)</label>
                <input style={styles.input} placeholder="John Doe" />
              </div>
            )}

            <div style={styles.inputRow}>
              <label style={styles.label}>{view === "forgot" ? "Email" : "Username"}</label>
              <input
                style={styles.input}
                type={view === "forgot" ? "email" : "text"}
                placeholder={view === "forgot" ? "user@company.com" : "your username"}
                value={view === "forgot" ? email : username}
                onChange={(e) => (view === "forgot" ? setEmail(e.target.value) : setUsername(e.target.value))}
                required
              />
            </div>

            {view !== "forgot" && (
              <div style={styles.inputRow}>
                <label style={styles.label}>Password</label>
                <div style={styles.inputAffix}>
                  <input
                    style={styles.input}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button type="button" style={styles.toggleBtn} onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            )}

            {view === "register" && (
              <div style={styles.inputRow}>
                <label style={styles.label}>Confirm password</label>
                <div style={styles.inputAffix}>
                  <input
                    style={styles.input}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button type="button" style={styles.toggleBtn} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            )}

            {view === "login" && (
              <div style={{ ...styles.rowBetween, marginBottom: "10px" }}>
                <label style={styles.checkboxLabel}>
                  <input type="checkbox" /> Remember me
                </label>
                <button type="button" style={styles.linkBtn} onClick={() => setView("forgot")}>Forgot password?</button>
              </div>
            )}

            {err && <div style={{ ...styles.err, marginBottom: "10px" }}>{err}</div>}

            <button style={styles.submit}>
              {view === "login" && "Log in"}
              {view === "register" && "Create account"}
              {view === "forgot" && "Send reset link"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "14px", color: "var(--text-secondary)", fontSize: "14px" }}>
            {view === "login" && (
              <>Don’t have an account? <button style={styles.linkBtn} onClick={() => setView("register")}>Register now.</button></>
            )}
            {view === "register" && (
              <>Already have an account? <button style={styles.linkBtn} onClick={() => setView("login")}>Sign in.</button></>
            )}
            {view === "forgot" && (
              <>Remember your password? <button style={styles.linkBtn} onClick={() => setView("login")}>Back to login.</button></>
            )}
          </div>
        </div>
      </div>
>>>>>>> Stashed changes
    </div>
  );
}