import { useState } from "react";
import { api } from "../lib/api";

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      if (mode === "register") await api.post("/api/auth/register", { name, email, password });
      const { data } = await api.post("/api/auth/login", { email, password });
      const profile = await api.get("/api/auth/me", { headers: { Authorization: `Bearer ${data.access_token}` } });
      onAuthenticated({ token: data.access_token, user: profile.data });
    } catch (e) {
      setError(e.response?.data?.detail || "Unable to sign in. Please check the API and try again.");
    } finally { setBusy(false); }
  };
  return <div className="auth-page"><div className="auth-card">
    <div className="brand-mark">✦</div><p className="eyebrow">YOUR THOUGHT PARTNER</p>
    <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
    <p className="auth-subtitle">A clearer space to think, create, and get things done.</p>
    <form onSubmit={submit} className="auth-form">
      {mode === "register" && <label>Your name<input required minLength="2" maxLength="100" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Morgan" /></label>}
      <label>Email address<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
      <label>Password<input required type="password" minLength="8" maxLength="128" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" /></label>
      {error && <div className="auth-error" role="alert">{error}</div>}
      <button className="primary-button auth-submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
    </form>
    <p className="auth-switch">{mode === "login" ? "New to the workspace?" : "Already have an account?"} <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "Create an account" : "Sign in"}</button></p>
  </div></div>;
}
