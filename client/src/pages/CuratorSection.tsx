import DashboardLayout from "@/components/DashboardLayout";
import { ArrowLeft, ArrowUpRight, CheckCircle2, LockKeyhole } from "lucide-react";
import { Link, useRoute } from "wouter";

const sections: Record<string, { eyebrow: string; title: string; description: string; chamber?: string; state: string }> = {
  "archive-control": { eyebrow: "Archive control", title: "Shape the visible archive.", description: "Create, edit, hide, publish, and reorder the specimens that make up the public house.", chamber: "#specimen-manager", state: "Connected to the specimen manager" },
  "specimen-editor": { eyebrow: "Specimen editor", title: "Rewrite the record.", description: "Edit titles, accession numbers, categories, archival metadata, stories, curator notes, and generation prompts.", chamber: "#specimen-manager", state: "Connected to the specimen manager" },
  "media-chamber": { eyebrow: "Media chamber", title: "Keep every medium under glass.", description: "Attach separate specimen images, video evidence, audio narration, thumbnails, and hero media.", chamber: "#specimen-manager", state: "Image, video, and audio controls active" },
  "hero-carousel": { eyebrow: "Hero carousel control", title: "Decide what the House reveals first.", description: "Choose featured specimens and set their display order in the homepage carousel.", chamber: "#specimen-manager", state: "Featured and order controls active" },
  "submission-inbox": { eyebrow: "Submission inbox", title: "Receive what residents leave behind.", description: "Review incoming resident specimens, inspect their evidence, and prepare accepted material for the archive.", chamber: "#submissions", state: "Connected to incoming matter" },
  "dream-records": { eyebrow: "Dream records", title: "Read the residual imprints.", description: "Review submitted dreams and generated dream images before deciding which fragments become part of the living archive.", state: "Dream records chamber" },
  "resident-registry": { eyebrow: "Resident registry", title: "Count the witnesses.", description: "View registered residents, entry dates, Offering balances, and the activity carried through the House.", chamber: "#residents", state: "Connected to the resident ledger" },
  "archive-doors": { eyebrow: "Archive doors", title: "Maintain the seven thresholds.", description: "Manage category names, introductions, door order, and the distinctions between the archive’s seven rooms.", state: "Seven doors configuration" },
  "dispatches-editor": { eyebrow: "Dispatches editor", title: "File new transmissions.", description: "Create, edit, schedule, publish, revise, and withdraw field reports, essays, announcements, and recovered transmissions.", chamber: "#dispatches", state: "Connected to the dispatch ledger" },
  "field-notes-library": { eyebrow: "Field Notes library", title: "Arrange the marginal evidence.", description: "Organize journals, resident testimonies, blueprints, medical reports, and recovered margin notes.", state: "Field Notes library" },
  "manifesto-editor": { eyebrow: "Manifesto editor", title: "Keep the oath legible.", description: "Update the manifesto sections, philosophical statement, and the image associated with the House’s central declaration.", state: "Manifesto chamber" },
  "site-configuration": { eyebrow: "Site configuration", title: "Set the House protocol.", description: "Manage the curator email, house notices, featured content, and the rules governing resident access.", chamber: "#settings", state: "Connected to site settings" },
  "archive-audit": { eyebrow: "Archive audit", title: "Find what repeats.", description: "Identify duplicate images, missing media, incomplete metadata, repeated specimens, and records that have fallen out of order.", chamber: "#audit", state: "Duplicate and missing-media audit active" },
};

function SectionContent({ section }: { section: (typeof sections)[string] }) {
  return <main className="admin-gate" style={{ alignItems: "stretch", maxWidth: 920, textAlign: "left" }}><Link href="/curator-admin" className="text-link"><ArrowLeft size={15} /> Return to curator desk</Link><p className="eyebrow oxblood">{section.eyebrow}</p><h1>{section.title}</h1><p style={{ maxWidth: 650 }}>{section.description}</p><div className="admin-form" style={{ marginTop: 22, display: "grid", gap: 16 }}><div style={{ display: "flex", alignItems: "center", gap: 10, color: "#615b54" }}><CheckCircle2 size={18} color="#8c3d34" /><strong>{section.state}</strong></div><p style={{ margin: 0, color: "#615b54", lineHeight: 1.7 }}>This chamber is reserved for the curator. Open the connected desk below to work with the records without leaving the House.</p>{section.chamber ? <a className="button-outline" href={`/curator-admin${section.chamber}`}>Open the connected chamber <ArrowUpRight size={16} /></a> : <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#615b54" }}><LockKeyhole size={16} color="#8c3d34" /> The chamber is prepared for its archive records.</div>}</div></main>;
}

export default function CuratorSection() {
  const [, params] = useRoute("/curator-admin/:section");
  const section = sections[params?.section || ""] || sections["archive-control"];
  return <DashboardLayout><SectionContent section={section} /></DashboardLayout>;
}
