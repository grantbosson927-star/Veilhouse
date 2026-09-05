# Detail-page verification

The dedicated route `/specimen/the-cathedral-has-a-pulse` renders a full-page specimen record with hero image, category, field-note source, micro-fiction label, expanded detail, archive return link, and House Dreams link. The future-door route `/specimen/static-between-the-channels` renders the same reusable detail layout with specimen 08 content.

The dedicated `/dreams` route renders a full-screen House Dreams chamber with dream counter, rotating dream title and text, previous/next controls, naming form, material/sound metadata, fragment control, protocol section, and return navigation. The browser preview shows the controls and content at desktop size.

The Next Dream control was verified: selecting it changed Dream 00012 to Dream 00013, updated the title, counter, description, material, and sound metadata without leaving `/dreams`. The dedicated naming form is rendered and keyboard-targetable in the browser preview; the automated input result did not appear in the extracted DOM after submission, so the form remains a client-side session interaction to retest manually after publishing.

The expanded specimen detail route and curator desk were captured at 390px mobile width. The story section, two still plates, CSS motion-study panel, form, and ledger stack cleanly. Opening `/curator-admin` without an active session shows the dedicated “Sign in to continue” gate. Non-admin access is covered by `server/curator.access.test.ts`, which expects the curator list procedure to reject role `user` with FORBIDDEN.
