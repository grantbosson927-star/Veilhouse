import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { PageShell } from "./ContentPageShell";
import { categories } from "./Archive";
import { useLocation, useRoute } from "wouter";
import { religiousHorrorRecords } from "./religiousHorror";
import { archiveImages } from "./archiveImages";
import { archiveMetadata, type ArchiveMetadata } from "./archiveMetadata";
import { trpc } from "@/lib/trpc";
import { openVeilhouseLightbox } from "@/components/VeilhouseLightbox";

const religiousHorrorImages = [
  "/archive-assets/generated/veilhouse/religious-horror-rerender/RH-001.jpg", "/archive-assets/generated/veilhouse/religious-horror-rerender/RH-002.jpg", "/archive-assets/generated/veilhouse/religious-horror-rerender/RH-003.jpg", "/archive-assets/generated/veilhouse/religious-horror-rerender/RH-004.jpg",
  "/archive-assets/generated/veilhouse/religious-horror-rerender/RH-005.jpg", "/archive-assets/generated/veilhouse/religious-horror-rerender/RH-006.jpg", "/archive-assets/generated/veilhouse/religious-horror-rerender/RH-007.jpg", "/archive-assets/generated/veilhouse/religious-horror-rerender/RH-008.jpg",
  "/archive-assets/generated/veilhouse/religious-horror-rerender/RH-009.jpg", "/archive-assets/generated/veilhouse/religious-horror-rerender/RH-010.jpg", "/archive-assets/generated/veilhouse/religious-horror-rerender/RH-011.jpg", "/archive-assets/generated/veilhouse/religious-horror-rerender/RH-012.jpg",
];

type Specimen = ArchiveMetadata & { image?: string };

const introductions: Record<string, string> = {
  "religious-horror": "When devotion corrupts the flesh, when stone learns to bleed, when prayer leaves scars. This vault contains specimens of faith that has turned inward—architecture that digests its congregation, saints whose bones have learned to rearrange themselves, and icons that weep something far darker than tears.",
  "technology-nightmares": "The signal is watching back. This door collects obsolete machines that have learned to bleed, screens that act as membranes, and analog ghosts trapped in magnetic tape. When technology rots, it does not simply break down—it digests.",
  "liminal-spaces": "A corridor with no outside. These are transitional spaces that have rotted from the inside out—the hallways, pools, malls, and waiting rooms that exist only to move you somewhere, but have decided to keep you.",
  "body-horror": "The body is not a temple. It is a building site, and the contractors have gone mad. Here, flesh is a rotting material, bones are load-bearing structures, and the boundary between self and meat dissolves.",
  "weirdcore": "A childhood memory with teeth. This door collects low-resolution artifacts of nostalgia turned sour: familiar places made wrong, digital decay, flash photography in dark rooms, and memories that do not belong to you.",
  "grotesque-architecture": "The city seen from above, and it is looking back. This door documents buildings that are alive, structures made of bone and flesh, and urban landscapes that have realized they are hungry.",
  "cult-horror": "No ceremony without a witness. This door collects rituals in the dark, collective madness, symbols carved into flesh, and the terrifying realization that you are not the worshipper, but the offering.",
};

const religious: Specimen[] = religiousHorrorRecords.map((record, index) => ({
  id: `RH-${String(index + 1).padStart(3, "0")}`,
  title: record.title,
  medium: record.medium,
  location: record.location,
  accessionDate: record.accessionDate,
  description: record.description,
  curatorNote: record.curatorNote,
  prompt: record.prompt,
  image: religiousHorrorImages[index],
}));

export default function CategoryArchive() {
  const [, params] = useRoute("/archive/:slug");
  const slug = (params?.slug || categories[0][0]).replace(/\/$/, "");
  const index = Math.max(0, categories.findIndex((category) => category[0] === slug));
  const category = categories[index] || categories[0];
  const records = category[0] === "religious-horror" ? religious : archiveMetadata[category[0]] || [];
  const overridesQuery = trpc.curator.specimens.useQuery();
  const doorsQuery = trpc.editorial.doors.useQuery();
  const specimens: Specimen[] = records.map((record, specimenIndex) => ({ ...record, image: category[0] === "religious-horror" ? religiousHorrorImages[specimenIndex] : archiveImages[category[0]]?.[specimenIndex] })).map((specimen) => { const override = overridesQuery.data?.find((item) => item.slug === specimen.title.toLowerCase().replaceAll(" ", "-")); return { ...specimen, image: override?.imageUrl || specimen.image, description: override?.excerpt || specimen.description, displayOrder: override?.displayOrder || 0, visible: override?.visible ?? true }; }).filter((specimen) => specimen.visible).sort((left, right) => (left.displayOrder || 0) - (right.displayOrder || 0));
  const [, navigate] = useLocation();

  const savedDoor = doorsQuery.data?.find((door) => door.slug === category[0]);
  return <PageShell eyebrow={`01 / Door 0${index + 1}`} title={<>{savedDoor?.name || category[1]}<br /><em>has a pulse.</em></>} intro={savedDoor?.introduction || category[2]}>
    <div className="category-intro"><p>{savedDoor?.introduction || introductions[category[0]] || "A sealed room in the living archive."}</p><span>INTRODUCTION / {(savedDoor?.name || category[1]).toUpperCase()}</span></div>
    <div className="specimen-grid">{specimens.map((specimen) => <article className="specimen-card hover-enlarge" key={specimen.id}>
      <img src={specimen.image} alt={specimen.title} onClick={(event) => openVeilhouseLightbox(event, specimen.image || "", specimen.title)} />
      <div><span>{specimen.id} / {category[1]}</span><h2>{specimen.title}</h2><p>{specimen.description}</p>
        <details className="specimen-record"><summary>Open archive record</summary><dl><div><dt>MEDIUM</dt><dd>{specimen.medium}</dd></div><div><dt>LOCATION</dt><dd>{specimen.location}</dd></div><div><dt>ACCESSION DATE</dt><dd>{specimen.accessionDate}</dd></div></dl><p><strong>CURATOR'S NOTE</strong><br />{specimen.curatorNote}</p><p><strong>AI IMAGE PROMPT</strong><br />{specimen.prompt}</p></details>
        <a href={`/specimen/${specimen.title.toLowerCase().replaceAll(" ", "-")}`}>Read label <ArrowUpRight size={14} /></a>
      </div>
    </article>)}</div>
    <div className="category-nav"><button type="button" onClick={() => navigate(`/archive/${categories[(index + categories.length - 1) % categories.length][0]}`)}><ArrowLeft size={15} /> Previous door</button><a href="/archive">All doors</a><button type="button" onClick={() => navigate(`/archive/${categories[(index + 1) % categories.length][0]}`)}>Next door <ArrowRight size={15} /></button></div>
  </PageShell>;
}
