# Runtime #788: desktop Chromium favicon 404

## Evidence (2026-09-12)

Source run: https://github.com/ninja-ops-guy/techops-hero/actions/runs/34709161151

The full `runtime-bot-b54b5c1c37bf5ff69233910a077114c7addecefb`
artifact (ID `10303440073`, 372,473,693 bytes) was downloaded and its
SHA-256 verified as
`fb83f281927199af3d9cfbad0091c6bd9cfa9996ddd94cc3237e051e371ca02a`.

The console events inside the two dedicated traces identify the exact URL:

| Trace | Events | `location.url` |
| --- | --- | --- |
| `desktop-chromium-nightcrawler-trace.zip` | 2 HTTP 404 console errors | `http://127.0.0.1:4173/favicon.ico` |
| `desktop-chromium-goodboys-trace.zip` | 2 HTTP 404 console errors | `http://127.0.0.1:4173/favicon.ico` |

These are browser tab-icon requests, not evidence of a combat/progression asset
failure. The trace console locations, not an inferred asset name, establish
this diagnosis. The original gameplay gates passed in the source run.

## Fix

`index.html` declares `./favicon.svg` explicitly in its head. The SVG is a small,
self-contained TechOps Hero tab icon. The relative URL stays inside both a
root-hosted checkout and the `/techops-hero/` GitHub Pages project directory;
it does not rely on an icon hosted at the origin root.

The rest of `index.html`, all game scripts, warning collection, failure gates,
and the media server are unchanged. No console filtering, empty icon, 204 stub,
or catch-all HTTP success response is used.

## Regression coverage

`python3 scripts/test_site_metadata.py` checks the explicit head declaration,
self-contained SVG, exact GET/HEAD bytes and MIME type at root and project
subpaths, and real 404 responses for genuinely missing resources. The read-only
`Site metadata contracts` workflow runs these checks and the existing media
range tests for entrypoint, favicon, test, server, or workflow changes.

Local validation: all 5 metadata tests passed, as did the unchanged media test
with its 7 GET/range/HEAD cases. Negative controls removing either the icon
link or the icon file correctly failed. YAML and Python syntax checks passed.
The original index blob was verified before editing; the only index change
is the single icon-link line.

A local metadata-only Chromium navigation was attempted but blocked by the
execution environment with `net::ERR_BLOCKED_BY_ADMINISTRATOR`. It is not a
passing browser test. Fresh Runtime bot browser checks on the PR must confirm
that the favicon warnings disappear; local HTTP tests are not full gameplay
acceptance. This patch does not waive any merge gate.
