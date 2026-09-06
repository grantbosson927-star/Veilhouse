/* Veilhouse reference replication: preserve the supplied archive’s dark editorial rhythm, seven specimens, and oxblood field-note language. */
import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Menu, Search, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { religiousHorrorRecords } from "./religiousHorror";
import { archiveImages } from "./archiveImages";
import { archiveMetadata } from "./archiveMetadata";

const images = {
  hero: "/manus-storage/hero_55e3aafa_b28eacd7.jpg",
  faith: "/manus-storage/faith_62552905_f758bc59.jpg",
  machine: "/manus-storage/machine_7126fb05_361805ef.jpg",
  liminal: "/manus-storage/liminal_2e0c1ac0_11783296.jpg",
  body: "/manus-storage/body_034f1343_8c04d7fc.jpg",
  weirdcore: "/manus-storage/weirdcore_2a609490_c751c3dc.jpg",
  gargoyle: "/manus-storage/gargoyle_734fe71c_26f9172d.jpg",
  ritual: "/manus-storage/ritual_77455d59_5f2cee8c.jpg",
  mark: "/manus-storage/veilhouse-mark_d304fc45_cf2dffe7.png",
};

type CuratedEntry = { slug: string; title: string; category: string; number: string; image: string; note: string };

const entries: CuratedEntry[] = [
  { slug: "sister-catherines-ribcage", title: "Sister Catherine's Ribcage", category: "Religious horror", number: "001", image: "/manus-storage/RH-001_6f5c3f36.jpg", note: "The cathedral roots in the marrow." },
  { slug: "broadcast-from-the-inside", title: "Broadcast From The Inside", category: "Technology nightmares", number: "002", image: "/manus-storage/01_f41840ae.jpg", note: "When the signal starts watching back." },
  { slug: "ward-07-never-ends", title: "Ward 07 Never Ends", category: "Liminal spaces", number: "003", image: "/manus-storage/01_34f8af8c.jpg", note: "A corridor with no outside." },
  { slug: "anatomy-of-a-ruin", title: "Anatomy Of A Ruin", category: "Body horror", number: "004", image: "/manus-storage/01_66075c21.jpg", note: "The body as a building site." },
  { slug: "the-moon-in-the-nursery", title: "The Moon In The Nursery", category: "Weirdcore", number: "005", image: "/manus-storage/01_2fbcebda.jpg", note: "A childhood memory with teeth." },
  { slug: "gargoyles-at-dusk", title: "Gargoyles At Dusk", category: "Grotesque architecture", number: "006", image: "/manus-storage/01_cf99f82e.jpg", note: "The city seen from above." },
  { slug: "the-room-that-gathered", title: "The Room That Gathered", category: "Cult horror", number: "007", image: "/manus-storage/01_e069807f.jpg", note: "No ceremony without a witness." },
];

const religiousHorrorImages = [
  "RH-001_6f5c3f36.jpg", "RH-002_4c283963.jpg", "RH-003_c57f954b.jpg", "RH-004_d75d4461.jpg",
  "RH-005_9c6f62f9.jpg", "RH-006_1df312be.jpg", "RH-007_eb6e7255.jpg", "RH-008_f6710024.jpg",
  "RH-009_6f53fa05.jpg", "RH-010_99522fb7.jpg", "RH-011_105ffea4.jpg", "RH-012_21f53dd6.jpg",
];
const religiousEntries: CuratedEntry[] = religiousHorrorRecords.map((record, index) => ({
  slug: record.title.toLowerCase().replaceAll(" ", "-"),
  title: record.title,
  category: "Religious horror",
  number: record.id,
  image: `/manus-storage/${religiousHorrorImages[index]}`,
  note: record.description.split(".")[0] + ".",
}));

const categoryTitles: Record<string, string[]> = {
  "technology-nightmares": ["A Signal With Teeth", "The Camera That Blinked", "Auto-Complete For Dying", "The House In The Firmware", "The Monitor With A Pulse", "The Number That Calls Back", "The Face Recognition Failure", "The Archive That Watches"],
  "liminal-spaces": ["Ward 07 Never Ends", "The Waiting Room At 4:12", "The Elevator With No Ground", "The Hotel Between Addresses", "The Hallway Behind The Wallpaper", "The Stair That Returns", "The Restroom With A Window", "The Platform After Midnight"],
  "body-horror": ["Anatomy Of A Ruin", "The Listening Body", "The Hand That Grew A Room", "The Scar With A Floor Plan", "The Mouth In The Shoulder", "The Second Skeleton", "The Organ That Remembers", "The Weather Under The Skin"],
  weirdcore: ["The Nursery Is Listening", "The Birthday Room", "The Carpet With A Horizon", "The Television Under The Bed", "The Plastic Orchard", "The Hallway In Pastel", "The Drawing That Moved Rooms", "The Softest Door"],
  "grotesque-architecture": ["Gargoyles At Dusk", "The Cathedral With A Pulse", "The Apartment That Added A Floor", "The Stairwell With Organs", "The Facade Beneath The Facade", "The Bridge That Leans Closer", "The House With A Weather Room", "The City In The Wall"],
  "cult-horror": ["The Room That Gathered", "The Red Thread Census", "The Mask For The Absent", "The Table With One More Seat", "The Hymn Without A Composer", "The Door Behind The Door", "The Witness Ledger", "The Ceremony At Low Tide"],
};
const categoryEntries: Record<string, CuratedEntry[]> = Object.fromEntries(Object.entries(categoryTitles).map(([slug, titles]) => [slug, titles.map((title, index) => ({
  slug: title.toLowerCase().replaceAll(" ", "-"),
  title,
  category: slug.replaceAll("-", " "),
  number: String(index + 1).padStart(3, "0"),
  image: archiveImages[slug][index],
  note: archiveMetadata[slug][index].description.split(".")[0] + ".",
}))]));
const allCategoryEntries: Record<string, CuratedEntry[]> = { "religious-horror": religiousEntries, ...categoryEntries };

const themes = ["All specimens", "Religious horror", "Body horror", "Technology nightmares", "Liminal spaces", "Weirdcore", "Grotesque architecture", "Cult horror"];

const futureDoors = [
  { slug: "static-between-the-channels", number: "08", category: "Analog horror", title: "Static Between The Channels", note: "VHS degradation, corrupted broadcasts, obsolete media." },
  { slug: "the-engine-grew-a-heart", number: "09", category: "Organic machinery", title: "The Engine Grew A Heart", note: "Machines with flesh, veins, organs, and industrial spaces that breathe." },
  { slug: "playroom-autopsy", number: "10", category: "Distorted childhood", title: "Playroom Autopsy", note: "Wrong-proportioned toys, sinister nursery rhymes, and playground decay." },
  { slug: "the-house-next-door-is-breathing", number: "11", category: "Suburban uncanny", title: "The House Next Door Is Breathing", note: "Perfect lawns, watching windows, and familiar domestic spaces made wrong." },
  { slug: "something-rose-from-the-bath", number: "12", category: "Aquatic dread", title: "Something Rose From The Bath", note: "Flooded rooms, drowning imagery, and bodies merging with water." },
];

const fieldNotes = [
  { label: "The Curator's Journal", text: "Weekly entries from an unnamed archivist who is slowly losing their grip on reality." },
  { label: "Resident Testimonies", text: "First-person accounts from people who have entered these spaces and returned changed." },
  { label: "Architect's Blueprints", text: "Technical drawings of impossible structures with disturbing annotations." },
  { label: "Medical Reports", text: "Clinical descriptions of transformations written like case studies." },
];

const calendar = [
  ["Monday", "New Specimen"], ["Tuesday", "Field Note Tuesday"], ["Wednesday", "Weirdcore Wednesday"], ["Thursday", "Threshold Thursday"], ["Friday", "Friday The Thirteenth Club"], ["Saturday", "Saturday Nightmares"], ["Sunday", "Sunday Confession"],
];

export default function Home() {
  // The useAuth hook provides authentication state.
  // To implement login/logout, call logout(), or start login from an event
  // handler: onClick={() => startLogin()} (imported from "@/const"). Never call
  // startLogin() during render (no href={startLogin()}) — it mints a one-time
  // nonce cookie and must run only at the moment of navigation.

  const [activeTheme, setActiveTheme] = useState("All specimens");
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const publishedPostsQuery = trpc.curator.published.useQuery();
  const subscribe = trpc.dispatch.subscribe.useMutation({ onSuccess: () => { setSubscribed(true); setEmail(""); } });

  const activeEntries: CuratedEntry[] = activeTheme === "All specimens" ? entries : allCategoryEntries[activeTheme.replaceAll(" ", "-")] || [];
  const filteredEntries = useMemo(() => activeEntries.filter((entry) => {
    const matchesTheme = activeTheme === "All specimens" || entry.category.toLowerCase() === activeTheme.toLowerCase();
    const matchesQuery = `${entry.title} ${entry.category}`.toLowerCase().includes(query.toLowerCase());
    return matchesTheme && matchesQuery;
  }), [activeEntries, activeTheme, query]);

  const jumpToSignal = () => document.getElementById("signal")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="site-shell">
      <div className="site-rail" aria-hidden="true"><img src={images.mark} alt="" /><span>ARCHIVE<br />OPEN</span></div>
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="VEILHOUSE home"><img className="wordmark-mark" src={images.mark} alt="" /><span>VEIL</span><i>HOUSE</i></a>
        <nav className={menuOpen ? "main-nav is-open" : "main-nav"} aria-label="Primary navigation">
          <a href="/archive" onClick={() => setMenuOpen(false)}>Archive</a>
          <a href="/manifesto" onClick={() => setMenuOpen(false)}>Manifesto</a>
          <a href="/dispatches" onClick={() => setMenuOpen(false)}>Dispatches</a>
          <a href="/curator" onClick={() => setMenuOpen(false)}>Curator</a>
          <a href="/field-notes" onClick={() => setMenuOpen(false)}>Field Notes</a>
          <a href="/dreams" onClick={() => setMenuOpen(false)}>Dreams</a>
        </nav>
        <div className="topbar-actions">
          <a className="issue-link" href="#dispatches">Issue 03 <ArrowUpRight size={15} /></a>
          <button className="menu-button" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </header>

      <main id="top">
        <section className="hero" style={{ backgroundImage: `url(${images.hero})` }}>
          <div className="hero-overlay" />
          <div className="hero-meta"><span>Est. 2024</span><span>Field notes from the other side</span></div>
          <div className="hero-copy">
            <p className="eyebrow">A living archive of dark surrealism</p>
            <h1>Something<br /><em>is waiting</em><br />in the walls.</h1>
            <p className="hero-description">VEILHOUSE documents the beautiful, the grotesque, and the impossible — where sacred forms buckle under the weight of the dream.</p>
            <a className="round-cta" href="#archive" aria-label="Enter the archive"><ArrowDownRight size={23} /></a>
          </div>
          <div className="hero-index">VH / 03 <span>scroll to descend</span></div>
        </section>


        <section className="archive" id="archive">
          <div className="archive-heading section-grid"><div className="section-kicker"><span>000</span><span>Curated specimens</span></div><div><p className="eyebrow oxblood">Recent disturbances</p><h2>Enter the<br /><em>archive.</em></h2></div><p className="archive-intro">Seven doors. No map. Each collection is a different way of losing the thread.</p><div className="archive-mark"><img src={images.mark} alt="" /><span>CATALOGUE<br />VH / 03</span></div></div>
          <div className="filters-wrap"><span className="accession-label">ACCESSION / 03</span><div className="filters" role="tablist" aria-label="Archive filters">{themes.map((theme) => <button key={theme} className={activeTheme === theme ? "filter active" : "filter"} onClick={() => setActiveTheme(theme)}>{theme}</button>)}</div><label className="search-box"><Search size={16} /><input aria-label="Search archive" placeholder="Search the archive" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
          <div className="archive-grid">{filteredEntries.map((entry) => <a className="archive-card" href={`/specimen/${entry.slug}`} key={entry.number}><div className="card-image"><img src={entry.image} alt={entry.title} /><span className="card-number">{entry.number}</span><span className="card-arrow"><ArrowUpRight size={18} /></span></div><div className="card-body"><p>{entry.category}</p><h3>{entry.title}</h3><span>{entry.note}</span></div></a>)}</div>
          {filteredEntries.length === 0 && <div className="empty-state">No specimen matches this disturbance.</div>}
        </section>

        <section className="field-notes" id="field-notes">
          <div className="field-notes-heading section-grid"><div className="section-kicker"><span>03</span><span>New doors / recovered matter</span></div><div><p className="eyebrow oxblood">Content expansion</p><h2>There are more<br /><em>doors than names.</em></h2></div><p className="archive-intro">Five new disturbances are waiting behind the archive wall. The house will open them one at a time.</p><div className="archive-mark"><img src={images.mark} alt="" /><span>ANNEX<br />VH / 04</span></div></div>
          <div className="future-door-grid">{futureDoors.map((door) => <a className="future-door" href={`/specimen/${door.slug}`} key={door.number}><span>{door.number}</span><p>{door.category}</p><h3>{door.title}</h3><small>{door.note}</small></a>)}</div>
          <div className="field-note-series"><div><p className="eyebrow oxblood">Field Notes expansion</p><h3>Recovered documents<br /><em>from the other side.</em></h3><p className="series-intro">Every specimen can carry a 50–100 word label: a micro-fiction fragment, a resident testimony, or a curator annotation that makes the image refuse to stay still.</p><blockquote>“Sister Mary Catherine reported hearing the cathedral breathe on Tuesday. By Friday, her ribs had begun to match its rhythm.”</blockquote></div><div className="field-note-list">{fieldNotes.map((note) => <button key={note.label} className="field-note-item" type="button"><span>{note.label}</span><ArrowUpRight size={15} /></button>)}</div></div>
        </section>

        <section className="dispatch" id="dispatches"><div className="dispatch-visual" style={{ backgroundImage: `url(${images.liminal})` }}><span>Dispatch 03</span></div><div className="dispatch-copy"><div className="dispatch-mark"><img src={images.mark} alt="" /><span>FIELD NOTE<br />03 / 2026</span></div><p className="eyebrow oxblood">The latest dispatch</p><h2>Do not trust<br /><em>the hallway.</em></h2><p>A visual field guide to liminal spaces, impossible architecture, and the quiet terror of being almost somewhere.</p><button className="button-outline" onClick={jumpToSignal}>Receive the dispatch <ArrowUpRight size={16} /></button></div></section>

        <section className="curator section-grid" id="curator">
          <div className="section-kicker"><span>02</span><span>Curator's desk</span></div>
          <div className="curator-copy"><p className="eyebrow oxblood">Leave something behind</p><h2>Open a new<br /><em>door.</em></h2><p>The public house is for looking. The curator's desk is where new specimens are written, illustrated, and filed for release.</p><a className="button-outline" href="/curator-entry">Enter the curator desk <ArrowUpRight size={16} /></a></div>
          <div className="curator-note"><span>FIELD NOTE 017</span><blockquote>“The collection grows every time someone names the thing in the dark.”</blockquote><small>— anonymous, recovered margin</small></div>
        </section>

        {publishedPostsQuery.isLoading || publishedPostsQuery.error ? <section className="public-ledger-status"><p className="eyebrow oxblood">Curator ledger</p><p>{publishedPostsQuery.error ? "The public ledger is closed for inspection." : "Reading the latest filed matter…"}</p></section> : null}
        {publishedPostsQuery.data && publishedPostsQuery.data.length === 0 ? <section className="public-ledger-status"><p className="eyebrow oxblood">Curator ledger</p><p>No new matter has been opened to the public yet. The house is keeping its doors shut.</p></section> : null}
        {publishedPostsQuery.data?.length ? <section className="public-ledger" id="public-ledger"><div className="section-grid"><div className="section-kicker"><span>04</span><span>Newly filed matter</span></div><div><p className="eyebrow oxblood">From the curator's desk</p><h2>Recent entries<br /><em>from inside.</em></h2></div><p className="archive-intro">Newly published records from the private ledger, opened to the public only when the curator decides the house can bear witness.</p></div><div className="public-ledger-grid">{publishedPostsQuery.data.map((post) => <a className="public-ledger-card" href={`/specimen/${post.slug}`} key={post.id}>{post.imageUrl && <img src={post.imageUrl} alt="" />}<div><span>{post.category}</span><h3>{post.title}</h3><p>{post.excerpt}</p><small>Read the full record <ArrowUpRight size={14} /></small></div></a>)}</div></section> : null}

        <section className="signal" id="signal"><div className="signal-copy"><p className="eyebrow oxblood">A note from the other side</p><h2>Stay close<br /><em>to the signal.</em></h2><p>Receive one dispatch every other Thursday.</p><form className="signup-form" onSubmit={(event) => { event.preventDefault(); if (email.trim()) subscribe.mutate({ email }); }}><label htmlFor="email">Receive one dispatch every other Thursday.</label><div><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="your@email.com" required /><button type="submit" aria-label="Subscribe" disabled={subscribe.isPending}><ArrowUpRight size={16} /></button></div></form>{subscribed && <p className="form-confirmation">The signal has your address.</p>}{subscribe.error && <p className="form-confirmation">The signal could not record that address.</p>}<div className="house-dream"><p className="eyebrow">The house dreams</p><p className="dream-line">A room that changes when you name it.</p><a className="button-outline" href="/dreams">Enter Dream 00012 <ArrowUpRight size={16} /></a></div></div><div className="calendar-panel"><p className="eyebrow oxblood">The house, in rhythm</p><h3>One disturbance<br /><em>every day.</em></h3><div>{calendar.map(([day, title]) => <span key={day}><b>{day}</b>{title}</span>)}</div></div></section>

        <section className="manifesto section-grid" id="manifesto">
          <div className="section-kicker"><span>00</span><span>About the house</span></div><img className="section-mark" src={images.mark} alt="" />
          <div className="manifesto-copy"><p className="eyebrow oxblood">The archive is open</p><h2>For images that<br /><em>refuse to stay still.</em></h2><p>We collect dark surrealism in all its unstable forms: corrupted saints, flesh-made architecture, obsolete machines, and the familiar places that become wrong when you look twice.</p><a className="text-link" href="#archive">Read the manifesto <ArrowUpRight size={16} /></a></div>
          <div className="manifesto-stamp"><span>NO SAFE<br />PASSAGE</span><small>VOL. III · 2026</small></div>
        </section>

      </main>

      <footer className="footer"><div><a className="wordmark" href="#top"><img className="wordmark-mark" src={images.mark} alt="" /><span>VEIL</span><i>HOUSE</i></a><p>Dark surrealism / collected carefully.</p></div><div className="footer-links"><a href="#archive">Archive</a><a href="#manifesto">About</a><a href="mailto:hello@veilhouse.archive">Contact</a></div><span className="copyright">© 2026 VEILHOUSE</span></footer>
    </div>
  );
}

export { images };
