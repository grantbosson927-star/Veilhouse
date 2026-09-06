import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { PageShell, images } from "./ContentPageShell";
import { categories } from "./Archive";
import { useLocation, useRoute } from "wouter";
import { religiousHorrorRecords } from "./religiousHorror";
import { archiveImages } from "./archiveImages";
import { archiveMetadata } from "./archiveMetadata";

const religiousHorrorImages = [
  "/manus-storage/RH-001_6f5c3f36.jpg",
  "/manus-storage/RH-002_4c283963.jpg",
  "/manus-storage/RH-003_c57f954b.jpg",
  "/manus-storage/RH-004_d75d4461.jpg",
  "/manus-storage/RH-005_9c6f62f9.jpg",
  "/manus-storage/RH-006_1df312be.jpg",
  "/manus-storage/RH-007_eb6e7255.jpg",
  "/manus-storage/RH-008_f6710024.jpg",
  "/manus-storage/RH-009_6f53fa05.jpg",
  "/manus-storage/RH-010_99522fb7.jpg",
  "/manus-storage/RH-011_105ffea4.jpg",
  "/manus-storage/RH-012_21f53dd6.jpg",
];

type Specimen = { name: string; label: string; image?: string; id?: string; medium?: string; location?: string; accessionDate?: string; description?: string; curatorNote?: string; prompt?: string };
type CategoryContent = { introduction: string; specimens: Specimen[] };

const categoryContent: Record<string, CategoryContent> = {
  "religious-horror": {
    introduction: "When devotion corrupts the flesh, when stone learns to bleed, when prayer leaves scars. This vault contains specimens of faith that has turned inward—architecture that digests its congregation, saints whose bones have learned to rearrange themselves, and icons that weep something far darker than tears. Here, the sacred does not heal. It transforms. It consumes. It watches back. These specimens document the exact moment when belief becomes a living, parasitic entity—and that entity is hungry. Each record is a tear in the fabric of devotion, a threshold where the veil between worship and being worshipped has grown thin enough to rip. Do not look for salvation here. The cathedral has a pulse, and it is learning your rhythm.",
    specimens: religiousHorrorRecords.map((record, index) => ({ name: record.title, label: record.description, image: religiousHorrorImages[index], ...record })),
  },
  "technology-nightmares": {
    introduction: "Technology becomes frightening when it stops behaving like a tool and begins behaving like a witness. This door catalogs interfaces that anticipate the hand, cameras that retain the shape of a face after the face is gone, and machines that quietly improve their understanding of fear. The signal is never simply broken. It is learning. Each specimen asks what happens when a system designed to observe becomes capable of wanting, and whether the person at the screen can still tell the difference between a malfunction and a reply.",
    specimens: [
      ["A Signal With Teeth", "The broadcast repeats only when someone is listening closely enough."],
      ["The Camera That Blinked", "Its shutter closes a fraction too late, capturing the person behind the person photographed."],
      ["Auto-Complete For Dying", "The keyboard suggests a final sentence before the user has begun to feel ill."],
      ["The House In The Firmware", "A maintenance update installs a floor plan for rooms the building does not contain."],
      ["The Monitor With A Pulse", "The screen refreshes in rhythm with a heartbeat located somewhere off-site."],
      ["The Number That Calls Back", "Every missed call is from the same number, but the voice changes with the weather."],
      ["The Face Recognition Failure", "The system identifies everyone in the room as the person who is missing."],
      ["The Archive That Watches", "A file opens itself whenever its owner begins to remember deleting it."],
    ].map(([name, label]) => ({ name, label })),
  },
  "liminal-spaces": {
    introduction: "Liminal spaces are not empty. They are between instructions. A corridor waits for its destination, a lobby continues after the building has closed, and a stairwell offers another floor only when the traveler stops counting. The specimens behind this door document thresholds that have become environments of their own. They hold the unease of being almost somewhere, of recognizing a place that has never existed, and of discovering that the exit is not a destination but a decision the room may refuse to honor.",
    specimens: [
      ["Ward 07 Never Ends", "The corridor measured 47 metres yesterday. Today it has no end."],
      ["The Waiting Room At 4:12", "The clock moves only when someone decides to give up their appointment."],
      ["The Elevator With No Ground", "Every button opens onto a version of the lobby where one person has been removed."],
      ["The Hotel Between Addresses", "Guests can check in, but the reservation system cannot find the building."],
      ["The Hallway Behind The Wallpaper", "A corridor grows one door longer each time you look away."],
      ["The Stair That Returns", "The final step leads back to the first, carrying a different set of footprints."],
      ["The Restroom With A Window", "The window shows the room from the other side of the wall."],
      ["The Platform After Midnight", "A train arrives empty and leaves with one more passenger than boarded."],
    ].map(([name, label]) => ({ name, label })),
  },
  "body-horror": {
    introduction: "Body horror treats flesh as a place: a structure with rooms, weather, maintenance, and architectural failure. These specimens resist the clean boundary between person and environment. Bones become corridors. Skin records weather from rooms no body has entered. A wound acquires a door. The fear here is not simply transformation; it is the suspicion that the body has always been an unfinished building, and that something inside it has been quietly renovating. Every label is written with care. Every diagnosis is provisional.",
    specimens: [
      ["Anatomy Of A Ruin", "The body is not a container. It is a building site with a weather system."],
      ["The Listening Body", "An additional cavity behind the sternum produces a low signal when addressed by name."],
      ["The Hand That Grew A Room", "The palm contains a miniature door that opens only while the owner is asleep."],
      ["The Scar With A Floor Plan", "A healed incision redraws itself whenever the patient changes direction."],
      ["The Mouth In The Shoulder", "It speaks only in the voice of someone the patient has not met yet."],
      ["The Second Skeleton", "The radiograph shows another frame standing several centimetres behind the first."],
      ["The Organ That Remembers", "A removed organ continues to react to rooms it has never occupied."],
      ["The Weather Under The Skin", "Rain is heard beneath the epidermis whenever the house is about to change."],
    ].map(([name, label]) => ({ name, label })),
  },
  "weirdcore": {
    introduction: "Weirdcore begins with the familiar and permits it to become impossible by degrees. A nursery is too large. A moon hangs inside the wallpaper. A carpet pattern repeats with one small correction each time. These specimens preserve the pressure of childhood rooms remembered incorrectly, where nostalgia has developed an appetite and soft colors conceal an active intelligence. Nothing here is entirely hostile. That is part of the problem. The rooms want to be recognized, and recognition is the key that lets them continue.",
    specimens: [
      ["The Nursery Is Listening", "The moon in the nursery has learned the names of everyone who sleeps there."],
      ["The Birthday Room", "Every balloon bears the face of a guest who has not yet arrived."],
      ["The Carpet With A Horizon", "The pattern ends at a line where the room continues into weather."],
      ["The Television Under The Bed", "It plays family footage from houses the viewer has never lived in."],
      ["The Plastic Orchard", "The fruit is hollow, warm, and full of tiny recorded voices."],
      ["The Hallway In Pastel", "A cheerful corridor becomes longer whenever someone says they feel safe."],
      ["The Drawing That Moved Rooms", "A child’s house plan adds a window each time the paper is folded."],
      ["The Softest Door", "It feels like a blanket until the handle begins turning from the other side."],
    ].map(([name, label]) => ({ name, label })),
  },
  "grotesque-architecture": {
    introduction: "Grotesque architecture asks what a building becomes when it is allowed to have needs. The structures in this door breathe through vents that resemble mouths, grow additions without permits, and watch the city from their highest windows. Their ornament is not decoration; it is evidence of appetite. These specimens make the built world feel briefly honest. Every wall has a burden. Every facade is hiding an interior. The house does not stand still because standing still would mean admitting that it has already finished becoming something else.",
    specimens: [
      ["Gargoyles At Dusk", "A city watches from its roofline and counts the windows left open."],
      ["The Cathedral With A Pulse", "Its arches expand and contract around a heart no architect can locate."],
      ["The Apartment That Added A Floor", "Residents wake to find a new level above them, furnished in their own style."],
      ["The Stairwell With Organs", "The pipes hum in a sequence that resembles a diagnosis."],
      ["The Facade Beneath The Facade", "Removing one layer of plaster reveals a second building looking outward."],
      ["The Bridge That Leans Closer", "Each morning the bridge has shifted a few inches toward the people crossing it."],
      ["The House With A Weather Room", "Rain falls only in the room where the previous owner used to sleep."],
      ["The City In The Wall", "A miniature skyline grows behind the wallpaper whenever the lights go out."],
    ].map(([name, label]) => ({ name, label })),
  },
  "cult-horror": {
    introduction: "Cult horror is the study of shared certainty under pressure. Behind this door, ritual objects accumulate witnesses, ordinary gestures become instructions, and belief moves through a group like a current looking for a body. The danger is not that the doctrine is false. It is that the doctrine works. These specimens document the moment a gathering becomes an organism, when a symbol begins asking for maintenance, and when the late-arriving witness understands that participation may have begun before they crossed the threshold.",
    specimens: [
      ["The Room That Gathered", "No ceremony without a witness. No witness leaves unchanged."],
      ["The Red Thread Census", "Every member is connected to a name that has not yet been spoken."],
      ["The Mask For The Absent", "It fits whoever wears it, but the reflection belongs to the missing member."],
      ["The Table With One More Seat", "The extra chair is always warm before the meeting begins."],
      ["The Hymn Without A Composer", "The group learned it together, though no one remembers teaching it."],
      ["The Door Behind The Door", "An accession without an address, found behind the catalogue itself."],
      ["The Witness Ledger", "Names disappear from the list after the person signs beside them."],
      ["The Ceremony At Low Tide", "The water recedes to reveal a circle that was waiting under the shore."],
    ].map(([name, label]) => ({ name, label })),
  },
};

for (const [slug, metadata] of Object.entries(archiveMetadata)) {
  const specimens = categoryContent[slug]?.specimens;
  if (!specimens) continue;
  categoryContent[slug] = {
    ...categoryContent[slug],
    specimens: specimens.map((specimen, index) => ({ ...specimen, id: specimen.id || `${slug.toUpperCase()}-${String(index + 1).padStart(3, "0")}`, ...metadata[index] })),
  };
}

export default function CategoryArchive() {
  const [, params] = useRoute("/archive/:slug");
  const slug = params?.slug || categories[0][0];
  const index = Math.max(0, categories.findIndex((category) => category[0] === slug));
  const category = categories[index] || categories[0];
  const content = categoryContent[category[0]] || categoryContent["religious-horror"];
  const [, navigate] = useLocation();

  return <PageShell eyebrow={`01 / Door 0${index + 1}`} title={<>{category[1]}<br /><em>has a pulse.</em></>} intro={category[2]}><div className="category-intro"><p>{content.introduction}</p><span>INTRODUCTION / {category[1].toUpperCase()}</span></div><div className="specimen-grid">{content.specimens.map((specimen, i) => <article className="specimen-card hover-enlarge" key={specimen.id || specimen.name}><img src={specimen.image || archiveImages[category[0]]?.[i] || images[(i + index) % images.length]} alt={specimen.name} /><div><span>{specimen.id || `SPECIMEN ${String(i + 1).padStart(2, "0")} / ${category[1]}`}</span><h2>{specimen.name}</h2><p>{specimen.id ? specimen.description : specimen.label}</p>{specimen.id && <details className="specimen-record"><summary>Open archive record</summary><dl><div><dt>MEDIUM</dt><dd>{specimen.medium}</dd></div><div><dt>LOCATION</dt><dd>{specimen.location}</dd></div><div><dt>ACCESSION DATE</dt><dd>{specimen.accessionDate}</dd></div></dl><p><strong>CURATOR'S NOTE</strong><br />{specimen.curatorNote}</p><p><strong>AI IMAGE PROMPT</strong><br />{specimen.prompt}</p></details>}<a href={`/specimen/${specimen.name.toLowerCase().replaceAll(" ", "-")}`}>Read label <ArrowUpRight size={14} /></a></div></article>)}</div><div className="category-nav"><button type="button" onClick={() => navigate(`/archive/${categories[(index + categories.length - 1) % categories.length][0]}`)}><ArrowLeft size={15} /> Previous door</button><a href="/archive">All doors</a><button type="button" onClick={() => navigate(`/archive/${categories[(index + 1) % categories.length][0]}`)}>Next door <ArrowRight size={15} /></button></div></PageShell>;
}
