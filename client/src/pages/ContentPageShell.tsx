import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

const mark = "/archive-assets/generated/veilhouse/veilhouse-mark_d304fc45.png";
const images = [
  "/archive-assets/generated/veilhouse/faith_62552905.jpg",
  "/archive-assets/generated/veilhouse/machine_7126fb05.jpg",
  "/archive-assets/generated/veilhouse/liminal_2e0c1ac0.jpg",
  "/archive-assets/generated/veilhouse/body_034f1343.jpg",
  "/archive-assets/generated/veilhouse/weirdcore_2a609490.jpg",
  "/archive-assets/generated/veilhouse/gargoyle_734fe71c.jpg",
  "/archive-assets/generated/veilhouse/ritual_77455d59.jpg",
  "/archive-assets/generated/veilhouse/hero_55e3aafa.jpg",
];

export function PageShell({ eyebrow, title, intro, children }: { eyebrow: string; title: ReactNode; intro: string; children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const timer = window.setTimeout(() => setLoading(false), 420); return () => window.clearTimeout(timer); }, []);
  if (loading) return <div className="horror-loader"><img src={mark} alt="" /><p>THE HOUSE IS REARRANGING ITSELF</p><span>PLEASE WAIT FOR THE DOOR TO SETTLE</span></div>;
  return <div className="content-page"><header className="content-topbar"><a className="wordmark" href="/"><img className="wordmark-mark" src={mark} alt="" /><span>VEIL</span><i>HOUSE</i></a><nav><a href="/archive">Archive</a><a href="/manifesto">Manifesto</a><a href="/dispatches">Dispatches</a><a href="/curator">Curator</a><a href="/field-notes">Field Notes</a><a href="/dreams">Dreams</a></nav><a className="detail-back" href="/"><ArrowLeft size={14} /> Exit</a></header><main><section className="content-hero"><p className="eyebrow oxblood">{eyebrow}</p><h1>{title}</h1><p>{intro}</p></section>{children}</main><footer className="detail-footer"><a href="/">VEILHOUSE</a><span>The house remembers what you name.</span><a href="/curator">Leave something behind <ArrowUpRight size={14} /></a></footer></div>;
}

export { images, mark };
