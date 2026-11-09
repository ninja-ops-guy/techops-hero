# See World origin repair candidate

Portfolio base: a3e5499eb3205484fcc5e379c44dababe2f825fe. Native base: 053ee3948170ac972bc1af44eacfa4857fc32a0f.

The custom-domain portfolio does not serve the native game. Browser local storage belongs to an origin, not a path. This paired fix keeps the existing github.io save origin: native imports its companion contract locally and serves a pinned copy of the matching reader under `/techops-hero/see-world/`. The manifest hashes every vendored file. No save keys, schemas, identities, milestones, import rules or merge rules change.

The media hub links to the original native game. The custom-domain game shortcut redirects top-level there. The custom-domain reader offers a top-level connected-reader link before its storage-owning application loads. Its separate existing reader remains an explicit option. Nothing is copied, cleared, automatically adopted or merged. Existing custom-domain data does not synchronize with github.io; orphaned data may lack the matching native snapshot required by current export tools. Do not advise users to clear data or start new games to recover progress.

The native reader uses top-level canonical gallery navigation rather than a cross-origin iframe. Portfolio/comic/media links return to the canonical portfolio. Existing root-domain default-to-terminal behavior is preserved.

## Paired publication and deployment

Both PRs remain drafts for hosted verification. Publish the native candidate first and pin its exact SHA in the portfolio origin workflow. Deployment requires separate authorization and ordering: native reader must be available before portfolio sends players there. Do not merge unrelated comic/terminal or older linked-story candidates.

The origin workflow runs provenance/contracts, the native production gate, the full portfolio build, isolated production-hostname candidate responses (including orphaned custom-data preservation), and the existing native linked-save loop using the new reader path. The live smoke compares canonical and native reader bytes, follows actual game readiness without starting a save, verifies top-level reader, four locked perspectives and help, and checks legacy/shortcut routes.

## Verification boundary

69 Node tests and the native production gate passed on the original reviewed candidate; they are rerun on reconstruction against current main. Local browser launch was blocked before execution by a restricted process-singleton socket. Hosted browser checks remain required; no local browser pass, live deployment, completed cross-origin migration or cloud sync is claimed. Baseline lint lacks the ESLint v9 configuration; the full TypeScript/Vite build is checked separately.
