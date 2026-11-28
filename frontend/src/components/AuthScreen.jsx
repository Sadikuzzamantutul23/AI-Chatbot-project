import { useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { api } from "../lib/api";

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      const detail = e.response?.data?.detail;
      setError(Array.isArray(detail) ? detail.map((item) => item.msg).join(" · ") : detail || "Unable to sign in. Please check your details and try again.");
    } finally { setBusy(false); }
  };
  return <main className="grid min-h-dvh place-items-center bg-gradient-to-b from-accent-soft to-page p-6"><section className="w-full max-w-[420px] rounded-[20px] border border-border bg-surface px-[38px] pb-[30px] pt-9 shadow-xl max-[480px]:px-6 max-[480px]:py-8" aria-labelledby="auth-heading">
    <div className="mx-auto mb-5 grid size-[42px] place-items-center rounded-[14px] bg-accent-strong text-[22px] text-page" aria-hidden="true">✦</div><p className="mb-2 text-center text-[10px] font-bold tracking-[.16em] text-ink-muted">YOUR THOUGHT PARTNER</p>
    <h1 className="m-0 text-center text-[27px] font-semibold leading-tight tracking-tight text-ink" id="auth-heading">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
    <p className="mb-6 mt-2.5 text-center text-[13px] leading-relaxed text-ink-muted">A clearer space to think, create, and get things done.</p>
    <form onSubmit={submit} className="grid gap-[15px]">
      {mode === "register" && <label className="grid gap-1.5 text-xs font-semibold text-ink-secondary" htmlFor="auth-name">Your name<input className="h-[43px] w-full rounded-lg border border-border bg-surface px-3 text-[13px] font-normal text-ink outline-none transition focus:border-accent focus:ring-[3px] focus:ring-accent/20 placeholder:text-ink-muted" id="auth-name" autoComplete="name" required minLength="2" maxLength="100" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Morgan" /></label>}
      <label className="grid gap-1.5 text-xs font-semibold text-ink-secondary" htmlFor="auth-email">Email address<input className="h-[43px] w-full rounded-lg border border-border bg-surface px-3 text-[13px] font-normal text-ink outline-none transition focus:border-accent focus:ring-[3px] focus:ring-accent/20 placeholder:text-ink-muted" id="auth-email" autoComplete="email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
      <label className="grid gap-1.5 text-xs font-semibold text-ink-secondary" htmlFor="auth-password">Password<span className="relative block"><input className="h-[43px] w-full rounded-lg border border-border bg-surface px-3 pr-11 text-[13px] font-normal text-ink outline-none transition focus:border-accent focus:ring-[3px] focus:ring-accent/20 placeholder:text-ink-muted" id="auth-password" autoComplete={mode === "login" ? "current-password" : "new-password"} required type={showPassword ? "text" : "password"} minLength="8" maxLength="128" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" /><button className="absolute right-1 top-1 grid size-[35px] place-items-center rounded-md text-ink-muted hover:bg-surface-hover hover:text-ink" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}</button></span></label>
      {error && <div className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2.5 text-xs leading-relaxed text-danger" role="alert">{error}</div>}
      <button className="mt-0.5 flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent-strong text-[13px] font-semibold text-white transition-colors hover:bg-accent disabled:cursor-wait disabled:opacity-75" disabled={busy}>{busy ? <><LoaderCircle className="animate-spin" size={18} strokeWidth={1.75} />Please wait…</> : mode === "login" ? "Sign in" : "Create account"}</button>
    </form>
    <p className="mb-0 mt-5 text-center text-xs text-ink-muted">{mode === "login" ? "New to the workspace?" : "Already have an account?"} <button className="pl-1 font-semibold text-accent-strong" type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "Create an account" : "Sign in"}</button></p>
  </section></main>;
}
