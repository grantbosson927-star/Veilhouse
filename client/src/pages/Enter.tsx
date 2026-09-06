import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, Loader2, LockKeyhole } from "lucide-react";
import { FormEvent, useState } from "react";
import { useLocation } from "wouter";

export default function Enter() {
  const [, navigate] = useLocation();
  const { user, loading, logout, refresh } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await refresh();
      navigate("/");
    },
  });
  const signup = trpc.auth.signup.useMutation({
    onSuccess: async () => {
      await refresh();
      navigate("/");
    },
  });
  const busy = login.isPending || signup.isPending;
  const error = login.error?.message || signup.error?.message || message;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    if (mode === "login") login.mutate({ email, password });
    else signup.mutate({ email, password, name: name.trim() || undefined });
  };

  if (loading) {
    return <div className="admin-loading"><Loader2 className="spin" size={18} /> Checking the door…</div>;
  }

  if (user) {
    return (
      <div className="admin-gate">
        <LockKeyhole size={18} color="#bd5445" />
        <p className="eyebrow oxblood">You are inside</p>
        <h1>Welcome<br /><em>{user.name || user.email}.</em></h1>
        <p>Signed in as {user.email}. The public archive is open. The curator desk remains a private room.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <a className="button-outline" href="/">Return to the house <ArrowUpRight size={16} /></a>
          <a className="button-outline" href="/curator-entry">Curator desk <ArrowUpRight size={16} /></a>
          <button className="button-outline" type="button" onClick={() => { void logout(); }}>Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-gate">
      <LockKeyhole size={18} color="#bd5445" />
      <p className="eyebrow oxblood">{mode === "login" ? "Return visitor" : "New name in the ledger"}</p>
      <h1>{mode === "login" ? <>Enter the<br /><em>house.</em></> : <>Leave your<br /><em>address.</em></>}</h1>
      <p>{mode === "login" ? "Sign in with the email you left at the door." : "Create an account with your email and a password of at least eight characters."}</p>
      <form onSubmit={submit} style={{ width: "min(100%, 420px)", display: "grid", gap: 12 }}>
        {mode === "signup" && (
          <>
            <label htmlFor="account-name" style={{ color: "#bd5445", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", textAlign: "left" }}>Name</label>
            <input id="account-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="What the house should call you" style={{ width: "100%", padding: "14px 0", border: 0, borderBottom: "1px solid rgba(229,223,211,.35)", outline: 0, background: "transparent", color: "#e5dfd3", font: "inherit", fontSize: 16 }} />
          </>
        )}
        <label htmlFor="account-email" style={{ color: "#bd5445", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", textAlign: "left" }}>Email</label>
        <input id="account-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" style={{ width: "100%", padding: "14px 0", border: 0, borderBottom: "1px solid rgba(229,223,211,.35)", outline: 0, background: "transparent", color: "#e5dfd3", font: "inherit", fontSize: 16 }} />
        <label htmlFor="account-password" style={{ color: "#bd5445", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", textAlign: "left" }}>Password</label>
        <input id="account-password" type="password" required autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "signup" ? 8 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "signup" ? "At least 8 characters" : "Your password"} style={{ width: "100%", padding: "14px 0", border: 0, borderBottom: "1px solid rgba(229,223,211,.35)", outline: 0, background: "transparent", color: "#e5dfd3", font: "inherit", fontSize: 16 }} />
        <button className="button-outline" type="submit" disabled={busy} style={{ justifyContent: "center" }}>{busy ? <Loader2 className="spin" size={16} /> : null}{mode === "login" ? "Sign in" : "Create account"} <ArrowUpRight size={16} /></button>
      </form>
      <button className="text-link" type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }} style={{ background: "none", border: 0, color: "#bd5445" }}>
        {mode === "login" ? "Need a key? Create an account" : "Already inside? Sign in"}
      </button>
      {error && <p role="status" style={{ maxWidth: 420, color: "#bd5445" }}>{error}</p>}
      <a className="text-link" href="/">Return to the public house</a>
    </div>
  );
}
