# Original-origin K Terminal settings export

Serve this directory on the existing native GitHub Pages origin. Visitors explicitly export known reading/music settings and import them at https://kterminal.site/recover/. No network transfer, storage writes, game startup, identity copying, or story awards occur here.

The four public assets are copied from the portfolio domain-repair candidate: public/recover/legacy-export.html becomes index.html; settings.mjs, export-only.mjs and site-info.css retain their names. Keep the settings allowlist in sync. `node --test tests/kterminal-settings.test.mjs` validates allowlisting, conflicts, rollback and undo using synthetic storage. The UI on this origin exposes export only.

This addition is independent of native #102 and does not fix the linked-reader routing itself. Deploy this exporter before the portfolio recovery link goes live. It cannot recover cleared browser data or storage in another browser/device.
