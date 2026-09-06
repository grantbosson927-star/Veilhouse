/* Veilhouse House Dreams: a full-page interactive chamber where the archive generates and names unstable dream fragments. */
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";

const dreamImage = "/manus-storage/hero_55e3aafa_b28eacd7.jpg";
const dreamStates = [
  { id: "00012", title: "The Hallway Behind The Wallpaper", text: "A corridor grows one door longer each time you look away. The wallpaper remembers the shape of your hands.", material: "paper / damp plaster", sound: "low signal" },
  { id: "00013", title: "The Room That Watches Back", text: "Every window is dark except the one inside your chest. Something on the other side is learning your name.", material: "glass / held breath", sound: "distant static" },
  { id: "00014", title: "A Staircase To The Flood", text: "The stairs descend through a house that has been underwater for years. At the bottom, the bath is still warm.", material: "water / old tile", sound: "dripping below" },
  { id: "00015", title: "The Machine Beneath The Chapel", text: "Beneath the altar, an engine turns in its sleep. Its pistons beat like a heart trying to remember prayer.", material: "iron / red dust", sound: "slow machinery" },
];

const fragments = ["a room without corners", "the sound behind the signal", "a house that grew a mouth", "the last light in the nursery"];

export default function HouseDreams() {
  const [dreamIndex, setDreamIndex] = useState(0);
  const [dreamName, setDreamName] = useState("");
  const [inscribedName, setInscribedName] = useState("");
  const [fragmentIndex, setFragmentIndex] = useState(0);
  const dream = dreamStates[dreamIndex];
  const fragment = useMemo(() => fragments[fragmentIndex], [fragmentIndex]);

  const nextDream = () => setDreamIndex((current) => (current + 1) % dreamStates.length);
  const previousDream = () => setDreamIndex((current) => (current - 1 + dreamStates.length) % dreamStates.length);

  return (
    <div className="dream-page">
      <header className="dream-topbar"><a className="wordmark" href="/"><span>VEIL</span><i>HOUSE</i></a><a className="detail-back" href="/#signal"><ArrowLeft size={15} /> Exit chamber</a><span className="detail-issue">DREAM / {dream.id}</span></header>
      <main>
        <section className="dream-chamber" style={{ backgroundImage: `url(${dreamImage})` }}><div className="dream-chamber-overlay" /><div className="dream-orbit orbit-one" /><div className="dream-orbit orbit-two" /><div className="dream-chamber-copy"><p className="eyebrow oxblood">The House Dreams</p><p className="dream-counter">DREAM / {dream.id} · {dreamIndex + 1} OF {dreamStates.length}</p><h1>{dream.title}</h1><p>{dream.text}</p><div className="dream-controls"><button type="button" onClick={previousDream} aria-label="Previous dream"><ArrowLeft size={17} /></button><button type="button" onClick={nextDream} aria-label="Next dream"><ArrowRight size={17} /></button><span>Turn the room</span></div></div><div className="dream-coordinate">VH / ONEIRIC ARCHIVE<br />LAT. 00° 13′ / LONG. UNKNOWN</div></section>
        <section className="dream-console"><div className="dream-console-main"><div className="dream-console-head"><p className="eyebrow oxblood">A generative field note</p><h2>Give the dream<br /><em>a name.</em></h2><p>Every chamber is a temporary record. Name what you saw and the house will hold it for this session.</p></div><form className="dream-name-form" onSubmit={(event) => { event.preventDefault(); if (dreamName.trim()) setInscribedName(dreamName.trim()); }}><label htmlFor="dream-name">Your title for this dream</label><div><input id="dream-name" value={dreamName} onChange={(event) => setDreamName(event.target.value)} placeholder="Name the thing behind the door" /><button type="submit">Inscribe <ArrowUpRight size={16} /></button></div></form>{inscribedName && <p className="dream-inscription">Dream {dream.id} is now filed as <em>{inscribedName}</em>.</p>}</div><aside className="dream-specs"><span>MATERIAL</span><strong>{dream.material}</strong><span>SOUND</span><strong>{dream.sound}</strong><span>FRAGMENT</span><button type="button" onClick={() => setFragmentIndex((current) => (current + 1) % fragments.length)}>{fragment} <ArrowRight size={14} /></button></aside></section>
        <section className="dream-manifest"><span>HOUSE PROTOCOL / 04</span><p>Do not stay too long. Do not close the door while the room is looking at you. If the dream speaks, write down the exact words.</p><a className="button-outline" href="/#archive">Return to the archive <ArrowUpRight size={16} /></a></section>
      </main>
      <footer className="detail-footer"><a href="/">VEILHOUSE</a><span>The house remembers what you name.</span><a href="/#curator">Leave something behind <ArrowUpRight size={14} /></a></footer>
    </div>
  );
}
