import { useState } from "react";
import { ArrowUpRight, LogIn, LogOut, X } from "lucide-react";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const offeringPaths = [
  { amount: 500, label: "A small oblation", note: "Enough to open three hidden archives." },
  { amount: 1500, label: "A measured sacrifice", note: "Enough to drag ten nightmares from the 7th circle." },
  { amount: 5000, label: "The greater rite", note: "Enough to keep the House awake for a while." },
];

export default function AccountRitual({ compact = false }: { compact?: boolean }) {
  const { user, logout } = useAuth();
  const account = trpc.account.snapshot.useQuery(undefined, { enabled: Boolean(user), retry: false });
  const [offeringOpen, setOfferingOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(1500);
  const offerings = account.data?.user.offerings ?? user?.offerings ?? 0;

  if (!user) {
    return <button className={compact ? "account-trigger compact" : "account-trigger"} type="button" onClick={() => startLogin()}><LogIn size={14} /> Enter the house</button>;
  }

  return <>
    <div className="account-ritual">
      <button className={compact ? "account-sacrament compact" : "account-sacrament"} type="button" onClick={() => setOfferingOpen(true)} aria-label={`Sacrament: ${offerings} Offerings`}>
        <span>Sacrament</span><strong>{account.isLoading ? "…" : offerings.toLocaleString()}</strong>
      </button>
      <span className="account-name">{user.name || user.email || "Resident"}</span>
      <button className="account-logout" type="button" onClick={() => void logout()} aria-label="Leave the house"><LogOut size={14} /></button>
    </div>
    {offeringOpen && <div className="offering-backdrop" role="presentation" onClick={() => setOfferingOpen(false)}>
      <section className="offering-modal" role="dialog" aria-modal="true" aria-labelledby="offering-title" onClick={(event) => event.stopPropagation()}>
        <button className="offering-close" type="button" onClick={() => setOfferingOpen(false)} aria-label="Close offering chamber"><X size={16} /></button>
        <p className="eyebrow oxblood">Sacrament / ledger {offerings.toLocaleString()}</p>
        <h2 id="offering-title">Make an<br /><em>offering.</em></h2>
        <p>The House accepts sacrifice in measured amounts. Choose the weight you intend to carry through the archive.</p>
        <div className="offering-paths">{offeringPaths.map((path) => <button key={path.amount} type="button" className={selectedAmount === path.amount ? "offering-path selected" : "offering-path"} onClick={() => setSelectedAmount(path.amount)}><span>{path.label}</span><strong>{path.amount.toLocaleString()} Offerings</strong><small>{path.note}</small></button>)}</div>
        <button className="admin-submit offering-submit" type="button" onClick={() => setOfferingOpen(false)}><ArrowUpRight size={15} /> Make an Offering</button>
        <small className="offering-footnote">The external rite is still sealed. New residents receive 1,000 Offerings at the threshold.</small>
      </section>
    </div>}
  </>;
}
