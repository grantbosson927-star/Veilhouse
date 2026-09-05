# Curator system expansion checklist

- [x] Inspect current curator storage, schema, router, and scheduling capabilities.
- [x] Extend the data model for managed media, scheduled publication, and revisions.
- [x] Add direct managed media uploads to the curator desk.
- [x] Render published curator posts in the public archive.
- [x] Add scheduled publishing controls and revision history.
- [x] Verify end-to-end curator workflows and responsive public presentation.
- [x] Save a publish-ready checkpoint.

- [x] Create and publish a real curator post through the protected desk, then verify its public ledger card and detail page.
- [x] Add explicit loading, error, and empty states for public curator content.
- [x] Harden scheduling lifecycle: update existing jobs, clear schedule fields after publish, delete jobs with posts, and record scheduled revisions.
- [x] Exercise a real media upload, edit, publish, revision-history, and schedule flow in the browser.
- [x] Save a new checkpoint after the verified expansion.

- [x] Add an explicit successful-empty-state UI when no curator posts are published.
- [x] Complete and verify a real curator edit-save cycle and confirm its revision history update.
- [x] Save the final publish-ready checkpoint after all curator-system fixes.

- [x] Restrict the curator house and curator procedures to the project-owner account only.
- [x] Add regression coverage for owner access and non-owner denial.
- [x] Verify the public house and curator access flows, then save a publish-ready checkpoint.

- [x] Verify the owner-only curator access response in the browser and confirm the unauthenticated gate; retain automated non-owner denial coverage.
- [x] Save a new checkpoint after the owner-only access lock and record its version ID.

- [x] Diagnose why the signed-in project-owner account is being rejected.
- [x] Fix owner-only authorization without allowing other accounts into the curator desk.
- [x] Verify the owner can use curator controls and save a corrected checkpoint.
