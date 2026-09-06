import { ArrowUpRight } from "lucide-react";
import { PageShell, images } from "./ContentPageShell";

export const categories = [
  ["religious-horror", "Religious Horror", "Corrupted devotion, sacred architecture, and the moment a prayer begins answering back."],
  ["technology-nightmares", "Technology Nightmares", "Signals, machines, and interfaces that learn the shape of the person watching them."],
  ["liminal-spaces", "Liminal Spaces", "Corridors, waiting rooms, and thresholds that refuse to lead anywhere familiar."],
  ["body-horror", "Body Horror", "Flesh as architecture: transforming, remembering, and building rooms of its own."],
  ["weirdcore", "Weirdcore", "Childhood rooms, wrong proportions, and nostalgia with a pulse beneath it."],
  ["grotesque-architecture", "Grotesque Architecture", "Buildings that breathe, cities that watch, and facades with organs behind them."],
  ["cult-horror", "Cult Horror", "Ritual objects, shared belief, and the witness who arrives one minute too late."],
];
export default function Archive() { return <PageShell eyebrow="01 / The browsable archive" title={<>Seven doors.<br /><em>Countless specimens.</em></>} intro="A living catalogue of dark surrealism. Choose a door, enter its logic, and move between categories without leaving the house."><section className="category-grid">{categories.map(([slug, name, text], i) => <a className="category-card hover-enlarge" href={`/archive/${slug}`} key={slug}><img src={images[i]} alt="" /><div><span>DOOR / 0{i+1}</span><h2>{name}</h2><p>{text}</p><small>Open category <ArrowUpRight size={14} /></small></div></a>)}</section></PageShell>; }
