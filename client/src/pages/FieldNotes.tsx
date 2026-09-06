import { ArrowUpRight } from "lucide-react";
import { PageShell, images } from "./ContentPageShell";

const notes = [
  ["Curator's Journal", "FIELD NOTE 017: Ward 07", "Nurse J. Morrison reported on 03/14/2024: ‘The corridor measured 47 meters on Monday. Today it measures 63 meters. We have not added space. The walls are breathing. Patients are reporting that their rooms move when they are not looking.’ Curator's annotation: The house confirms. Ward 07 has no outside.", 2],
  ["Resident Testimonies", "Statement from Room 714", "I woke because someone was moving furniture in the hallway. When I opened the door, the hallway was inside my room. I could see the bed from both sides. I have not slept there since, but every morning the pillow is warm.", 4],
  ["Architect's Blueprints", "Plan: The Unfinished Stair", "The stair rises through three floors and returns to its own underside. Annotation in red pencil: do not measure the distance between landings while standing on a landing.", 5],
  ["Medical Reports", "Case 04: The Listening Body", "Patient presents with an additional cavity behind the sternum. The cavity produces a low signal when addressed by name. Patient insists the sound is not inside them; it is waiting for them inside the room.", 3],
  ["Recovered Margin Notes", "Found between pages 18 and 19", "The house is not empty.\nThe house is not full.\nThe difference is who is doing the counting.", 7],
];

export default function FieldNotes() {
  return <PageShell eyebrow="03 / Recovered documents" title={<>Field notes from<br /><em>the other side.</em></>} intro="Micro-fictions, testimonies, technical drawings, clinical reports, and cryptic annotations recovered from the walls of the house."><div className="notes-library">{notes.map(([type, title, text, image]) => <article className="note-card" key={title}><img className="hover-enlarge" src={images[image as number]} alt="" /><div><span>{type}</span><h2>{title}</h2><p>{text}</p><a href={`/field-notes/${String(title).toLowerCase().replaceAll(" ", "-")}`}>Open document <ArrowUpRight size={14} /></a></div></article>)}</div></PageShell>;
}
