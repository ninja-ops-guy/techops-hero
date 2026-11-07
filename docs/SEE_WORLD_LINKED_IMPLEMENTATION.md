# Linked See World / Night Walker candidate

Implementation candidate, not a published release or approval of new illustrated canon.

TechOps Hero publishes a versioned, playthrough-bound snapshot after successful native saves. The snapshot combines the dedicated story record with the matching native profile's intermediate Good Dogs checkpoints. It never unions different runs or standalone sessions. See World replays its own decisions under chapter gates. A native Night Walker section rechecks that replayed grant and its native context at launch and every action; availability is never mission completion.

## Native sections delivered

Seven playable casebook investigations are accessible from **Night Walker → CAMPAIGN → Linked Story Timeline / See World sections**. They contain evidence inspection, supported/unsupported conclusions, multiple required actions, pause/resume and durable native completion. They are not new real-time combat levels or new 3D districts.

- Felicia: The missing interval; A stop outside your hands.
- K: What the mark can prove.
- Waldo/Oz: Count the people, not the light.
- Iona: exactly one of After the fire, No one owns the voices, Write down what I did, too.

The first Felicia section returns access to her next See World chapter. K/Waldo final reflections and Iona branch endings similarly wait for the corresponding native follow-up. None awards a main act, rescue, Duet completion, flight clearance, origin revelation or ending.

## Chronology and disclosure

Felicia's solo perspective opens after the Violinist reveal, before Duet. Existing broad shared free play remains Duet-gated. K/Oz read access follows distinct discovery/release/Warden/return milestones. Ghost Fork remains after return.

Iona's source story occurs after Red's arrest and before voice-window contact. A NEW explicit **player-only earlier-interlude cutaway**, available after Ghost Fork, introduces that placement. It uses the existing Iona/Mara dialogue and does not give Mike their private knowledge or invent a recording in his possession. Reading it commits `universe.disclosures.iona_arrest = player-cutaway-v1`; it is not an inferred or preexisting native flag. The authorizer remains unknown. The scene and new game-only follow-ups are review drafts, not a numbered-comic retcon.

## Save boundaries

One local profile ID, a fresh playthrough ID for New Game, native revision/stamp checks, source sequence, and append-only See World decision histories. Existing unbound native saves require explicit migration from the native timeline; originals are retained. Preview/QA/standalone saves cannot grant linked progress. Active linked branches cannot be reset or replaced by conflicting imports; alternate replay is an isolated sandbox. A browser without Web Locks cannot write linked progress. Corrupt/incompatible data is preserved for recovery.

Storage is same-origin and local to this browser. This is not cloud sync, cross-device synchronization, a security entitlement or anti-cheat system. Stamps detect changed bytes; they are not cryptographic proof of play. Native main-game persistence remains owned by its established save functions.

## Deployment coupling

The native UI loads the portfolio's same-origin `/theemrld-portfolio/see-world/linked-store.mjs` to replay grants, and checks the rules revision. Both candidates must be deployed together under the existing GitHub Pages origin. If the other deployment is absent/incompatible, linked sections fail closed; the existing main game remains available. A custom-domain split requires an explicit bridge, not an assumption of shared localStorage.

`campaign_act1.js` includes a generated browser-only bundle of the three maintained linked modules, preserving the reviewed 269-script startup ceiling. Run `node scripts/assemble-linked-runtime.js` after source changes, and `--check` in CI. The original Node campaign API is not replaced by bundle exports.

## Verification scope

See the candidate-specific QA receipt for actual results. The cross-repository browser test uses the real production native page and actual choice UI; long main-story prerequisites are fixture-assisted through native campaign APIs, not a claimed natural full-game playthrough. Local source-only testing lacks binary artwork; full production qualification must use a hosted checkout containing those assets. No physical-device, screen-reader, new art likeness, music licensing or cinematic production pass is claimed.
