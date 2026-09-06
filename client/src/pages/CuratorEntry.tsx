import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, Loader2, LockKeyhole } from "lucide-react";
import { FormEvent, useState } from "react";
import { useLocation } from "wouter";

export default function CuratorEntry() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const ownerAccess = trpc.curator.access.useQuery(undefined, {
    retry: false,
    enabled: Boolean(user),
  });
  const unlock = trpc.curator.unlock.useMutation({
    onSuccess: (result) => {
      if (result.unlocked) navigate("/curator-admin");
      else setMessage("That address is not the configured curator address.");
    },
  });
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!normalized) return;

    if (user) {
      unlock.mutate({ email: normalized });
      return;
    }

    if (!user) {
      try {
        sessionStorage.setItem("veilhouse-curator-email", normalized);
      } catch {}
      setMessage("The house has recorded your address. If you are the curator, sign in with that account to open the private desk.");
      return;
    }

    setMessage("That account is not the project curator. The public archive remains open, but the desk is reserved for its owner.");
  };

  if (loading || (user && ownerAccess.isLoading)) {
    return <div className="admin-loading"><Loader2 className="spin" size={18} /> Checking the curator key…</div>;
  }

  return (
    <div className="admin-gate">
      <LockKeyhole size={18} color="#bd5445" />
      <p className="eyebrow oxblood">Curator's desk</p>
      <h1>Leave your<br /><em>address.</em></h1>
      <p>Visitors may leave an email for the archive. The project curator can use the owner account to open the private desk and upload new matter.</p>
      <form onSubmit={submit} style={{ width: "min(100%, 420px)", display: "grid", gap: 12 }}>
        <label htmlFor="curator-email" style={{ color: "#bd5445", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", textAlign: "left" }}>Your email</label>
        <input id="curator-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" style={{ width: "100%", padding: "14px 0", border: 0, borderBottom: "1px solid rgba(229,223,211,.35)", outline: 0, background: "transparent", color: "#e5dfd3", font: "inherit", fontSize: 16 }} />
        <button className="button-outline" type="submit" disabled={unlock.isPending} style={{ justifyContent: "center" }}>{unlock.isPending ? <Loader2 className="spin" size={16} /> : null} Enter the desk <ArrowUpRight size={16} /></button>
      </form>
      {!user && <button className="button-outline" onClick={() => startLogin()}>Sign in as curator <ArrowUpRight size={16} /></button>}
      {user && !ownerAccess.data && <button className="button-outline" onClick={() => startLogin()}>Sign in with another account <ArrowUpRight size={16} /></button>}
      {message && <p role="status" style={{ maxWidth: 420, color: "#bd5445" }}>{message}</p>}
      <a className="text-link" href="/">Return to the public house</a>
    </div>
  );
}
