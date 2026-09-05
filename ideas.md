# Veilhouse Design Directions

## Approach 1 — Occult Editorial

**Very Brief Intro:** A dark literary archive with the restraint of an art-book imprint: bone paper, oxblood accents, engraved imagery, and asymmetric editorial pacing. It makes the site feel collected, haunted, and deliberate.

**Probability:** 0.06

## Approach 2 — Signal / Ruin

**Very Brief Intro:** A forensic interface for impossible transmissions, using black glass, degraded scanlines, and restrained spectral color to make the archive feel like evidence recovered from a damaged system.

**Probability:** 0.04

## Approach 3 — Pale Anatomy

**Very Brief Intro:** A high-key museum-like direction with chalk, faded medical blue, and red annotation marks, treating dark surrealism as an exposed specimen under clinical light.

**Probability:** 0.02

## Selected Direction — Occult Editorial

### Design Movement
Contemporary dark editorialism informed by avant-garde art books, early modernist print layouts, occult ephemera, and quiet luxury publishing.

### Core Principles
1. **Unease through restraint:** tension comes from proportion, silence, and precise interruptions rather than visual noise.
2. **Editorial asymmetry:** use strong left anchors, offset columns, and large negative space instead of centered marketing blocks.
3. **Material contrast:** pair near-black ink, warm paper, oxblood marks, and grain-like texture so the interface feels printed and handled.
4. **Archive as ritual:** navigation, numbering, filters, and dispatches behave like cataloguing instruments, not generic UI controls.

### Color Philosophy
The palette is built from charcoal ink, aged bone, and a single oxblood signal. Bone provides the tactile warmth of paper, charcoal creates the depth of a sealed archive, and oxblood marks the moments where the archive feels alive. Color is sparse and intentional: red is a disturbance, never decoration.

### Layout Paradigm
A vertical editorial composition with a persistent, hairline navigation rail; each section is laid out like a spread with a small index column, a dominant text column, and an offset image or stamp. Full-bleed moments are used as interruptions between denser cataloguing zones.

### Signature Elements
- Small issue numbers and specimen labels in condensed uppercase.
- Oxblood italic emphasis paired with hairline rules and archive stamps.
- Large, quiet image fields that emerge from darkness with subtle grain and parallax.

### Interaction Philosophy
Interactions should feel like handling a physical archive: filters behave as tabs in a catalogue, search is quiet and exact, navigation reveals itself without theatrics, and focus states remain visible as thin oxblood marks. No interaction should feel louder than the content it reveals.

### Animation
Use short, low-amplitude reveals: opacity and a 12–20px vertical shift for section entrances, 180–260ms easing for filters and menu states, and restrained image scale on hover. Avoid bouncing, overshoot, or continuous decorative motion. Respect reduced-motion preferences and keep page-load motion staggered by 40–70ms.

### Typography System
Use **Cormorant Garamond** for literary display headlines and italic emphasis, paired with **IBM Plex Sans** for navigation, metadata, labels, and body copy. Headings use generous line-height and deliberate breaks; metadata is condensed, uppercase, and tracked wide. Never use Inter.

### Brand Essence
**Veilhouse is a living archive of dark surrealism for readers who want images that refuse to stay still; it is different because it curates atmosphere as carefully as subject matter.**

Personality: **haunted, exacting, literary**.

### Brand Voice
Headlines are spare, evocative, and slightly threatening. CTAs are invitations into a room, not conversion commands. Microcopy reads like a field note.

Example lines:
- “Something is waiting in the walls.”
- “Three doors. No map. Enter carefully.”

### Wordmark & Logo
The wordmark remains a two-part typographic lockup: VEIL in upright small caps and HOUSE in a narrow italic serif, separated by a slight baseline offset. The symbol is a split arch / eye mark formed from two incomplete vertical strokes, suggesting a doorway that cannot quite close.

### Signature Brand Color
**Oxblood Signal — #8E3F35**, used sparingly for emphasis, active archive states, and the occasional warning-like annotation.

### Style Decisions
- Keep imagery dark and text-safe; never place pale text over an uncontrolled bright image.
- Preserve the asymmetric editorial structure across desktop and mobile.
- Treat missing or unavailable imagery with quiet material placeholders rather than broken-image chrome.

## Style Decisions

- The split arch / eye symbol appears as a recurring archival mark in the rail, wordmark, manifesto, catalogue, dispatch, and footer.
- Archive controls are treated as cataloguing instruments through accession labels, specimen numbering, hairline rules, and oxblood active states.
- Each major section carries a restrained editorial artifact so the archive ritual continues beyond the hero.

## Reference Ground Truth

For this replication pass, https://veilhouse-n8rmgjsl.manus.space/ overrides the earlier exploratory direction. Preserve its exact section order, seven-specimen archive, typography scale, dark/bone/oxblood palette, navigation labels, copy, and interaction language. The separate reference specification is documented in `reference-spec.md`.
