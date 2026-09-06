import { useAuth } from "@/_core/hooks/useAuth";
import { writeSessionToken } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, Loader2, LockKeyhole } from "lucide-react";
import { FormEvent, useState } from "react";

const fieldStyle = {
  width: "100%",
  padding: "14px 0",
  border: 0,
  borderBottom: "1px solid rgba(229,223,211,.35)",
  outline: 0,
  background: "transparent",
  color: "#e5dfd3",
  font: "inherit",
  fontSize: 16,
} as const;

const labelStyle = {
  color: "#bd5445",
  fontSize: 10,
  letterSpacing: ".14em",
  textTransform: "uppercase" as const,
  textAlign: "left" as const,
};

export default function Enter() {
  const { user, loading, logout, refresh } = useAuth();
  const utils = trpc.useUtils();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const applySession = async (result: { user: NonNullable<typeof user>; token: string }) => {
    writeSessionToken(result.token);
    utils.auth.me.setData(undefined, result.user);
    await refresh();
  };

  const login = trpc.auth.login.useMutation({
    onSuccess: (result) => applySession(result),
  });
  const signup = trpc.auth.signup.useMutation({
    onSuccess: (result) => applySession(result),
  });
  const busy = login.isPending || signup.isPending;
  const error = login.error?.message || signup.error?.message;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (mode === "login") login.mutate({ email: email.trim(), password });
    else signup.mutate({ email: email.trim(), password, name: name.trim() || undefined });
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
      <p className="eyebrow oxblood">Visitor ledger</p>
      <h1>{mode === "signup" ? <>Create an<br /><em>account.</em></> : <>Sign in to<br /><em>the house.</em></>}</h1>
      <p>{mode === "signup" ? "Use any email and a password of at least eight characters. You can sign back in with the same details later." : "Enter the email and password you used to create your account."}</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <button className="button-outline" type="button" onClick={() => setMode("signup")} style={mode === "signup" ? { borderColor: "#bd5445", color: "#e5dfd3" } : undefined}>Create account</button>
        <button className="button-outline" type="button" onClick={() => setMode("login")} style={mode === "login" ? { borderColor: "#bd5445", color: "#e5dfd3" } : undefined}>Sign in</button>
      </div>
      <form onSubmit={submit} style={{ width: "min(100%, 420px)", display: "grid", gap: 12 }}>
        {mode === "signup" && (
          <>
            <label htmlFor="account-name" style={labelStyle}>Name (optional)</label>
            <input id="account-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="What the house should call you" style={fieldStyle} />
          </>
        )}
        <label htmlFor="account-email" style={labelStyle}>Email</label>
        <input id="account-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" style={fieldStyle} />
        <label htmlFor="account-password" style={labelStyle}>Password</label>
        <input id="account-password" type="password" required autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" style={fieldStyle} />
        <button className="button-outline" type="submit" disabled={busy} style={{ justifyContent: "center" }}>
          {busy ? <Loader2 className="spin" size={16} /> : null}
          {mode === "signup" ? "Create account" : "Sign in"}
          <ArrowUpRight size={16} />
        </button>
      </form>
      {error && <p role="status" style={{ maxWidth: 420, color: "#bd5445" }}>{error}</p>}
      <a className="text-link" href="/">Return to the public house</a>
    </div>
  );
}
