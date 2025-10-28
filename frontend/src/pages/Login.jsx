import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import api from "../api";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [view, setView] = useState("login"); // 'login' | 'register' | 'forgot'

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [err, setErr] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    try {
      if (view === "register") {
        if (password !== confirmPassword) {
          setErr("Passwords do not match");
          return;
        }
        await api.post("auth/register/", { username, password, email });
      }

      if (view === "login" || view === "register") {
        await login(username, password);
        navigate("/projects");
        return;
      }

      // forgot view (placeholder only)
      setView("login");
    } catch (e) {
      setErr(e?.response?.data?.detail || "Request failed");
    }
  };

  const styles = {
    page: {
      minHeight: "100vh",
      display: "grid",
      gridTemplateColumns: "1fr",
      background: "var(--background)",
    },
    gridDesktop: {
      gridTemplateColumns: "1fr 1fr",
    },
    leftPanel: {
      display: "none",
    },
    leftPanelDesktop: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "48px",
      background: "#3F3FF3",
      color: "#fff",
      minHeight: "100%",
    },
    brandRow: { display: "flex", alignItems: "center" },
    brandLogo: {
      width: "32px",
      height: "32px",
      background: "#fff",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginRight: "12px",
    },
    cardWrap: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px",
      background: "var(--background)",
    },
    card: {
      width: "100%",
      maxWidth: "440px",
      background: "#fff",
      border: "1px solid var(--border)",
      borderRadius: "16px",
      boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
      padding: "28px",
    },
    headerRow: { display: "flex", justifyContent: "space-between", marginBottom: "12px" },
    h1: { fontSize: "22px", fontWeight: 600, color: "var(--text-primary)" },
    hint: { color: "var(--text-secondary)", fontSize: "14px", marginBottom: "16px" },
    label: { display: "block", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "6px" },
    input: {
      width: "100%",
      height: "44px",
      border: "1px solid var(--border)",
      borderRadius: "10px",
      padding: "0 12px",
      background: "#fff",
      color: "var(--text-primary)",
    },
    inputRow: { marginBottom: "14px" },
    inputAffix: { position: "relative" },
    toggleBtn: {
      position: "absolute",
      right: 0,
      top: 0,
      height: "44px",
      padding: "0 10px",
      border: 0,
      background: "transparent",
      color: "var(--text-secondary)",
      cursor: "pointer",
    },
    linkBtn: { border: 0, background: "transparent", color: "#3F3FF3", cursor: "pointer" },
    submit: {
      width: "100%",
      height: "44px",
      border: 0,
      borderRadius: "10px",
      background: "#3F3FF3",
      color: "#fff",
      fontWeight: 600,
      cursor: "pointer",
      marginTop: "6px",
    },
    rowBetween: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    checkboxLabel: { display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "14px" },
    err: { color: "#dc2626", fontSize: "14px" },
    mobileBrand: { textAlign: "center", marginBottom: "16px" },
  };

  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;

  return (
    <div style={{ ...styles.page, ...(isDesktop ? styles.gridDesktop : {}) }}>
      {/* Left brand panel (desktop only) */}
      <div style={isDesktop ? styles.leftPanelDesktop : styles.leftPanel}>
        <div style={styles.brandRow}>
          <div style={styles.brandLogo}>
            <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#3F3FF3" }} />
          </div>
          <div style={{ fontSize: "18px", fontWeight: 600 }}>ResearchHub</div>
        </div>

        <div style={{ maxWidth: "520px" }}>
          <div style={{ fontSize: "36px", fontWeight: 600, lineHeight: 1.2, marginBottom: "12px" }}>Effortlessly manage your research projects.</div>
          <div style={{ opacity: 0.95, fontSize: "18px" }}>Sign in to collaborate, organize sources, and track progress.</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", opacity: 0.9, fontSize: "14px" }}>
          <span>Copyright © 2025 ResearchHub</span>
          <span style={{ textDecoration: "underline", cursor: "pointer" }}>Privacy Policy</span>
        </div>
      </div>

      {/* Right auth card */}
      <div style={styles.cardWrap}>
        <div style={styles.card}>
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
    </div>
  );
}