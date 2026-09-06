import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

const mark = "/manus-storage/veilhouse-mark_d304fc45_cf2dffe7.png";
const images = [
  "/manus-storage/faith_62552905_f758bc59.jpg",
  "/manus-storage/machine_7126fb05_361805ef.jpg",
  "/manus-storage/liminal_2e0c1ac0_11783296.jpg",
  "/manus-storage/body_034f1343_8c04d7fc.jpg",
  "/manus-storage/weirdcore_2a609490_c751c3dc.jpg",
  "/manus-storage/gargoyle_734fe71c_26f9172d.jpg",
  "/manus-storage/ritual_77455d59_5f2cee8c.jpg",
  "/manus-storage/hero_55e3aafa_b28eacd7.jpg",
];

export function PageShell({ eyebrow, title, intro, children }: { eyebrow: string; title: ReactNode; intro: string; children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const timer = window.setTimeout(() => setLoading(false), 420); return () => window.clearTimeout(timer); }, []);
  if (loading) return <div className="horror-loader"><img src={mark} alt="" /><p>THE HOUSE IS REARRANGING ITSELF</p><span>PLEASE WAIT FOR THE DOOR TO SETTLE</span></div>;
  return <div className="content-page"><header className="content-topbar"><a className="wordmark" href="/"><img className="wordmark-mark" src={mark} alt="" /><span>VEIL</span><i>HOUSE</i></a><nav><a href="/archive">Archive</a><a href="/manifesto">Manifesto</a><a href="/dispatches">Dispatches</a><a href="/curator">Curator</a><a href="/field-notes">Field Notes</a><a href="/dreams">Dreams</a></nav><a className="detail-back" href="/"><ArrowLeft size={14} /> Exit</a></header><main><section className="content-hero"><p className="eyebrow oxblood">{eyebrow}</p><h1>{title}</h1><p>{intro}</p></section>{children}</main><footer className="detail-footer"><a href="/">VEILHOUSE</a><span>The house remembers what you name.</span><a href="/curator">Leave something behind <ArrowUpRight size={14} /></a></footer></div>;
}

export { images, mark };
