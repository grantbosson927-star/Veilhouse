import { FormEvent, useState } from "react";
import { ArrowUpRight, Loader2, Mail } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

export default function SignIn() {
  const [, navigate] = useLocation();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const signIn = trpc.auth.signInEmail.useMutation({ onSuccess: async () => { await refresh(); navigate("/"); } });
  const submit = (event: FormEvent) => { event.preventDefault(); if (email.trim()) signIn.mutate({ email: email.trim().toLowerCase() }); };
  return <main className="admin-gate"><Mail size={18} color="#bd5445" /><p className="eyebrow oxblood">Resident access</p><h1>Leave your<br /><em>address.</em></h1><p>The House does not require a third-party key. Give it an email and it will remember you at the threshold.</p><form onSubmit={submit} style={{ width: "min(100%, 420px)", display: "grid", gap: 12 }}><label htmlFor="resident-email" style={{ color: "#bd5445", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", textAlign: "left" }}>Your email</label><input id="resident-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoFocus style={{ width: "100%", padding: "14px 0", border: 0, borderBottom: "1px solid rgba(229,223,211,.35)", outline: 0, background: "transparent", color: "#e5dfd3", font: "inherit", fontSize: 16 }} /><button className="button-outline" type="submit" disabled={signIn.isPending}>{signIn.isPending ? <Loader2 className="spin" size={16} /> : null} Enter the House <ArrowUpRight size={16} /></button></form>{signIn.error && <p role="alert" style={{ maxWidth: 420, color: "#bd5445" }}>{signIn.error.message}</p>}<a className="text-link" href="/">Return to the public house</a></main>;
}

export const startEmailLogin = () => { window.location.href = "/sign-in"; };
export const emailLoginPath = "/sign-in";
