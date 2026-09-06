/* Veilhouse House Dreams: an interactive chamber where visitors offer unstable fragments to the living archive. */
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";

const dreamImage = "/archive-assets/generated/veilhouse/hero_55e3aafa.jpg";
const dreamStates = [
  { id: "00012", title: "The Hallway Behind The Wallpaper", text: "A corridor grows one door longer each time you look away. The wallpaper remembers the shape of your hands.", material: "paper / damp plaster", sound: "low signal" },
  { id: "00013", title: "The Room That Watches Back", text: "Every window is dark except the one inside your chest. Something on the other side is learning your name.", material: "glass / held breath", sound: "distant static" },
  { id: "00014", title: "A Staircase To The Flood", text: "The stairs descend through a house that has been underwater for years. At the bottom, the bath is still warm.", material: "water / old tile", sound: "dripping below" },
  { id: "00015", title: "The Machine Beneath The Chapel", text: "Beneath the altar, an engine turns in its sleep. Its pistons beat like a heart trying to remember prayer.", material: "iron / red dust", sound: "slow machinery" },
];
const fragments = ["a room without corners", "the sound behind the signal", "a house that grew a mouth", "the last light in the nursery"];
const placeholders = ["I saw a door…", "I saw a mouth…", "The ceiling was breathing…", "The wallpaper knew my name…"];
const residualImprints = [
  { label: "IMPRINT 01", text: "I dreamt my teeth were piano keys, and something in the corner was playing a lullaby I hadn't heard since I was four.", source: "Anonymous / 03:14 AM" },
  { label: "IMPRINT 02", text: "The staircase went down forever, but the window at the bottom showed the ceiling of my own bedroom. I was looking up at myself, sleeping.", source: "Resident 044" },
  { label: "IMPRINT 03", text: "The wallpaper pattern shifted when I blinked. By the third blink, the flowers had eyes. By the fourth, they were blinking back.", source: "Unverified" },
];

function createAccession() {
  return `ONEIRIC-${String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}`;
}

export default function HouseDreams() {
  const [dreamIndex, setDreamIndex] = useState(0);
  const [dreamName, setDreamName] = useState("");
  const [inscribedName, setInscribedName] = useState("");
  const [dreamText, setDreamText] = useState("");
  const [dreamSubmitted, setDreamSubmitted] = useState(false);
  const [accession, setAccession] = useState("");
  const [fragmentIndex, setFragmentIndex] = useState(0);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [roomTurned, setRoomTurned] = useState(false);
  const [typingWarning, setTypingWarning] = useState(false);
  const lastTypedAt = useRef(0);
  const warningTimer = useRef<number | undefined>(undefined);
  const recentDreams = trpc.dreams.recent.useQuery();
  const submitDream = trpc.dreams.submit.useMutation({ onSuccess: () => { setDreamSubmitted(true); setAccession(createAccession()); setDreamText(""); } });
  const dream = dreamStates[dreamIndex];
  const fragment = useMemo(() => fragments[fragmentIndex], [fragmentIndex]);

  useEffect(() => { const timer = window.setInterval(() => setPlaceholderIndex((current) => (current + 1) % placeholders.length), 2600); return () => window.clearInterval(timer); }, []);
  useEffect(() => () => { if (warningTimer.current) window.clearTimeout(warningTimer.current); }, []);
  const nextDream = () => setDreamIndex((current) => (current + 1) % dreamStates.length);
  const previousDream = () => setDreamIndex((current) => (current - 1 + dreamStates.length) % dreamStates.length);
  const handleDreamText = (value: string) => { const now = Date.now(); if (lastTypedAt.current && now - lastTypedAt.current < 70) { setTypingWarning(true); if (warningTimer.current) window.clearTimeout(warningTimer.current); warningTimer.current = window.setTimeout(() => setTypingWarning(false), 2200); } lastTypedAt.current = now; setDreamText(value); };

  return <div className={roomTurned ? "dream-page is-turned" : "dream-page"}>
    <header className="dream-topbar"><a className="wordmark" href="/"><span>VEIL</span><i>HOUSE</i></a><a className="detail-back" href="/#signal"><ArrowLeft size={15} /> Exit chamber</a><span className="detail-issue">DREAM / {dream.id}</span></header>
    <main>
      <section className="dream-chamber" style={{ backgroundImage: `url(${dreamImage})` }}><div className="dream-chamber-overlay" /><div className="dream-orbit orbit-one" /><div className="dream-orbit orbit-two" /><div className="dream-watermark" aria-hidden="true">IT SEES YOU</div><div className="dream-chamber-copy"><p className="eyebrow oxblood">The House Dreams</p><p className="dream-counter">DREAM / {dream.id} · {dreamIndex + 1} OF {dreamStates.length}</p><h1>{dream.title}</h1><p>{dream.text}</p><div className="dream-controls"><button type="button" onClick={previousDream} aria-label="Previous dream"><ArrowLeft size={17} /></button><button type="button" onClick={nextDream} aria-label="Next dream"><ArrowRight size={17} /></button><button type="button" className="turn-room" onClick={() => setRoomTurned((current) => !current)} aria-pressed={roomTurned}><Sparkles size={14} /> Turn the room</button></div></div><div className="dream-coordinate">VH / ONEIRIC ARCHIVE<br />LAT. 00° 13′ / LONG. UNKNOWN</div></section>
      <section className="dream-console"><div className="dream-receive"><p className="eyebrow oxblood">The Dream Door receives</p><h2>Surrender the<br /><em>fragment.</em></h2><p>The walls are porous. Leave a fear, a misplaced memory, or the geometry of an impossible room. The house will digest the words.</p><textarea aria-label="Dream fragment" value={dreamText} onChange={(event) => handleDreamText(event.target.value)} placeholder={placeholders[placeholderIndex]} />{typingWarning && <p className="dream-warning">The house prefers slow confessions.</p>}<button type="button" disabled={submitDream.isPending || !dreamText.trim()} onClick={() => submitDream.mutate({ title: dreamName.trim() || dream.title, dreamText })}>{submitDream.isPending ? "The house is listening…" : "Seal the offering"} <ArrowUpRight size={15} /></button>{dreamSubmitted && <div className="dream-receipt"><strong>Specimen logged.</strong><span>The house has absorbed your offering. Do not look behind you. Return to the archive before the door closes.</span><b>ACCESSION / {accession}</b></div>}{submitDream.error && <p className="form-confirmation">The door is closed for a moment. Try again.</p>}</div><div className="dream-console-main"><div className="dream-console-head"><p className="eyebrow oxblood">A provisional chamber</p><h2>Name the<br /><em>anomaly.</em></h2><p>Designation gives the fragment a place to wait. The house does not promise it will remain there.</p></div><form className="dream-name-form" onSubmit={(event) => { event.preventDefault(); if (dreamName.trim()) setInscribedName(dreamName.trim()); }}><label htmlFor="dream-name">Designate the anomaly</label><div><input id="dream-name" value={dreamName} onChange={(event) => setDreamName(event.target.value)} placeholder="Name the chamber" /><button type="submit">Inscribe <ArrowUpRight size={16} /></button></div></form>{inscribedName && <p className="dream-inscription">The chamber is filed as <em>{inscribedName}</em>.</p>}</div><aside className="dream-specs"><span>MATERIAL</span><strong>{dream.material}</strong><span>SOUND</span><strong>{dream.sound}</strong><span>FRAGMENT</span><button type="button" onClick={() => setFragmentIndex((current) => (current + 1) % fragments.length)}>{fragment} <ArrowRight size={14} /></button></aside></section>
      <section className="dream-recent"><p className="eyebrow oxblood">Residual Imprints</p><h2>Echoes from the<br /><em>Lucid Archive.</em></h2><div className="residual-grid">{residualImprints.map((imprint) => <article key={imprint.label}><span>{imprint.label}</span><p>“{imprint.text}”</p><small>— {imprint.source}</small></article>)}{recentDreams.data?.slice(0, 3).map((entry) => <article className="visitor-imprint" key={entry.id}><span>RECENT RESIDUE</span><p>“{entry.dreamText}”</p><small>— {entry.title} / {new Date(entry.createdAt).toLocaleDateString()}</small></article>)}</div></section>
      <section className="dream-manifest"><span>HOUSE PROTOCOL / 04</span><p>Do not stay too long. Do not close the door while the room is looking at you. If the dream speaks, write down the exact words.</p><a className="button-outline" href="/#archive">Return to the archive <ArrowUpRight size={16} /></a></section>
    </main>
    <footer className="detail-footer"><a href="/">VEILHOUSE</a><span>The house remembers what you name.</span><a href="/curator">Leave something behind <ArrowUpRight size={14} /></a></footer>
  </div>;
}
