# Living Archive: useful traces left in the world

## Implemented scope

The creator requested full implementation of the stigmergy proposal on November
25, 2026: actions leave useful evidence in the shared environment, and other
people can act on it after the person who left it is absent. This candidate
implements that behavior inside **Hold the Way Home**, using its existing
physical mission, consent records, route tests, defenders and receiving care.

The base is PR #160, `codex/siege-art-motion`, exact current revision
`1e34c5687ce9229ac3438829f32a83dcf3b10930`. It retains the complete four-sector,
48-resident operation from #154. The twelve-person opening on #153/#163 is a
separate producer layer and has not been combined with this candidate. Prior
verification reported in #160's body refers to an older source; this change
requires its own results.

This is a development candidate. It does not publish the Chorus comic arc or
change the approved public boundary at Volumes I–XIV.

## What the player can do

After physically testing a sector's outbound lanes, K can **leave tested
directions** at its gate. The marks remain visible in the street and in the
existing mission save. They bind to the actual local engineer's route receipt.

A resident who chose transport and can walk independently follows a current
mark toward the loading gate even when K is in another sector. The movement uses
the existing walking speed and world positions. This frees K to help elsewhere.
The resident still waits for boarding, transport and independent receiving care.
Reaching the gate does not make a person safe.

The mark cannot supply consent. Someone who declined, chose shelter or has not
chosen does not follow it. Someone who requested an attendant still needs an
escort. A live threat in the remaining corridor, damaged services, missing care
staff or insufficient local defenses suspends independent following. These
conditions use the current simulation and accepted authority records.

Closing or retesting a lane makes a mark tied to its earlier receipt stale. K
must return and correct it. A separately tested open alternative may replace the
primary route. The earlier mark remains in history; neither reopening a lane nor
writing a new direction erases the old record. Local service restoration may
make an unchanged, still-current route usable again.

Physical **records stations** expose repair tags, route corrections, accepted
shelter care, refusals, tested local authority and relevant Chorus observations.
The receiving station exposes only independently accepted carrier handoffs.
Each reading retains its source references. The **Read records** control opens
the last copies K actually read. These copies do not acquire new remote facts.
Revisiting the physical station updates the copy. Reading pauses simulation;
Escape and the return button close the records view.

## Ownership and persistence

| Concern | Owner | Boundary |
| --- | --- | --- |
| Route tests, consent, defense, shelter and receiving safety | `campaign_low_quarter.js` | Existing accepted events remain authoritative. |
| Assimilation, bounded acquired facts, relay delay and orders | `campaign_chorus_siege.js` | No archive input or new knowledge acquisition path. |
| Physical interactions, movement and transport | `campaign_low_quarter_mission.js` | Actual proximity and held inputs produce marks and local readings. |
| Optional marks and copied observations | `campaign_living_archive.js` | Cannot create rescue or siege events, ending facts or memory flags. |
| Presentation and input | `campaign_low_quarter_play.js` | Existing canvas and dialogue/input owner; no new clock or render loop. |
| Durable bytes | `campaign_act1.js` | Existing campaign key, validation and transactional save owner. |

The optional `lowQuarterMission.archive` extension has schema 1:

```js
{
  schema: 1,
  runId: "the existing mission run ID",
  marks: [{
    id: "mark_1", sector: "services", route: "services_primary",
    source: "the accepted route event ID", witness: "services_engineer",
    by: "k_red_el", at: 123
  }],
  readings: { services: [/* last-read cards, source references and reading time */] }
}
```

There is no second save key. Missing archives are ordinary legacy saves, and no
old save is automatically awarded marks or discoveries. Unknown archive schemas
or an unavailable archive module preserve the original save and block mission
continuation. Broken source references and mismatched run identities reject the
candidate state. Transaction failures do not commit a new mark. Marks are
bounded to 64 and never silently evicted. Reading snapshots are bounded to the
five actual locations and eight cards per location; references are deduplicated
and checked using a source index.

These checks enforce the single-player state contract. They are not a
cryptographic authentication system for externally supplied saves.

## Canon and emotional intent

K/Red/El remain one person; Mike remains separate. This mechanic records K's
present physical choices and other people's independent observations. It does
not assign him an invented ancient influence, manufacture an earlier friendship
or turn recognition into historical proof. K's autobiographical amnesia does
not remove learned skills.

K's private archive/notebook is never an input. No code restores memories,
relationship intimacy, a dead character or forgiven harm. The mark is useful
because someone can read, correct or refuse it. It carries directions, not
ownership over the person who uses them.

The Chorus contrast is limited to facts the existing siege actually acquired.
Only an observed assimilation produces the corresponding local trace. Relay
interruption leaves already acquired tactical fragments and issued attacks
intact. No complete biography, new defense plan, universal cure or hidden
source of knowledge is inferred. The no-assimilation rescue path remains valid.

The visual addition is code-native route marking and a readable records panel
within the established pixel-art surface. Existing character assets are
unchanged. No new likeness or artwork approval is claimed.

## Verification

`node test_campaign_living_archive.js` covers 17 groups:

- Actual local marking and movement without nearby K; an explicit off-sector
  position fixture also isolates the continuation behavior.
- Unknown consent, refusal, changed choice and authored attendant requirements;
  a stale mission mirror cannot replace the accepted consent record.
- Closed/reopened receipts, preserved earlier marks and tested alternatives.
- Service loss, defense loss and live corridor threats.
- Pause, failed saves, reload and unchanged rescue/ending outcomes.
- Corrupt references, mismatched runs, actor identity and future schema blocking.
- Physical-only reading, stable last-read copies and empty remote views.
- Partial lane evidence and bounded Chorus acquisition after relay loss.

The existing nine mission groups still cover all three full-save endings,
optional assimilation, eight origin-bound trips, care receipt ownership,
failed persistence and future mission schemas.

`scripts/living_archive_browser.mjs` is the reproducible real-input acceptance
runner. It starts through the real game entrypoint using only the existing
completed-epilogue setup fixture. It walks, holds interactions, makes consent
choices, posts a service-sector mark and launches the siege from approaches.
It checks that the consenting independent resident reaches the gate while K
stays in approaches; the attendant request, refusal and unknown-consent
residents remain at home; the safe count remains zero. It also checks records
dialogue bounds and pause, stale copies, local refresh, save/reload and page
errors in desktop and 390-pixel touch-emulation profiles. It retains source
hashes and screenshots in `artifacts/living-archive/`.

Run a local server using `scripts/media_http_server.py --port 4208 --bind
127.0.0.1`, then `node scripts/living_archive_browser.mjs` in the same process
environment. Set `LOW_QUARTER_BASE_URL` for another local port and
`PLAYWRIGHT_CHROMIUM_EXECUTABLE` only for a specific installed browser.

The runner uses virtual browser time. Touch uses pointer input on the actual
controls; it is not physical iPhone, native multitouch, Safari, measured device
performance or a complete unassisted campaign certification. No merge or
deployment is implied by these checks.

The retained source-bound result is in `docs/qa/living-archive/verification.json`.
That directory also contains desktop/touch records and street screenshots,
the actual browser reports, production/focused logs and the independent focused
review receipt. The source hash map identifies the tested files without making
the evidence document a circular hash dependency.
