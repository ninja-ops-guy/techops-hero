# Chorus siege encounter layer

Creator-approved November 22, 2026. This implements the approved encounter
structure on top of PR #150. It does not register a live district operation.
Concrete population, geography, force allocations, routes and schedules remain
content review work. Synthetic fixtures are confined to tests. No named death,
comic revision, merge, deployment or Malar unlock is introduced.

## Approved narrative contract

Additional infected ships use the Star Hopper to enter the Low Quarter's realm,
then approach physically. Prepared destinations and recovery intervals constrain
successive crossings. Hundreds of thousands of infected attack in combination.
The Chorus consumes bodies, usable infrastructure, energy and knowledge.
A command-vessel relay carries selected acquired defender memories to Sudo and
returns revised orders. The channel explicitly crosses realms; no universal
instantaneous deep-space communication follows from it.

Assimilation requires physical infected presence and an observed human-defender
loss. It acquires only facts the authored defender knew: selected routes, posts
or service knowledge. Facts retain their original version and source receipt.
No complete autobiographical upload, private thought access, forecast of player
input, automatic memory refresh or mandatory casualty exists. Preventing
assimilation prevents that acquisition.

Interruption stops fresh uploads and Sudo orders through the relay. Already
issued orders, local acquired facts and local autonomous decisions persist.
No signal interruption automatically cures hosts. A missing defender is not
thereby declared dead. Local victory does not eliminate the distributed Chorus.

Authority: current Story Bible v2.1 working copy, version 12, November 15 C29–36,
plus later creator outline version 5 and explicit approvals in this conversation.
The earlier Mike-to-K relay addendum is not the source for Chorus assimilation.
New Haven's Earth outbreak and this later parallel-realm operation are distinct.
Comic destruction remains separate from the game's reachable full rescue.

## Implementation

`campaign_chorus_siege.js` requires the existing rescue authority. Its trusted
`registerScenario` validates a combined definition, then registers the rescue
portion with `encounter: 'chorus_siege_v1'`. Production registers nothing by
default; loading the module does not grant rescue credit or start an operation.
The `approved` marker is an adapter declaration, not independent canon approval.

Definitions supply four distinct defense sectors (approaches, services, shelters,
departure), actual rescue people/posts/strengths/transport, successive waves and
warnings, Hopper recovery, forward relay delays/location, bounded knowledge
sources and independent observation contracts. All three authority arrangements
remain supported by PR #150; no branch's requirements are removed.

`begin` creates additive `lowQuarter.siege = {schema: 1, events: []}`.
`applyEvent` clones and replays before returning a new state. Events carry unique
ID, run, operation, logical tick and `rescueCount`, binding them to an exact prefix
of the rescue ledger. Missing future receipts, time reversal, conflicting duplicate
IDs and invalid phase transitions reject without changing the input. Identical
retries are idempotent. No wall-clock, random survival, timer or extra storage
owner is introduced.

Phases:

1. Warning: independent corroboration, complete sector survey and warnings.
2. Deployment: all branch command tests, essential services, continued staffing,
   adequate strength and coverage of every required post.
3. First assault: warned physical arrivals, actual observed resolution.
4. Adaptation: optional witnessed assimilation, delayed upload, Sudo/local orders,
   observed countermeasures and relay interruption.
5. Hold: all arrivals accounted for, issued adaptive attacks addressed.
6. Complete: every wave resolved, all posts defended and sectors habitable and
   contained. PR #150 still independently evaluates every resident, roster,
   receiving handoff, service and branch requirement.

`wave_warning` references a corroborated rescue check. `assimilate` references
an unavailable military-unit receipt at the witness's sector; it cannot target a
robot or silently return that unit to service. `respond` requires an actual
route closure, post reinforcement or service-containment receipt as appropriate.
Observation contracts require present independent actors and specified sources.
Mission adapters must emit these events only after real mission observations;
this single-player validator cannot prove that a host adapter told the truth.

`status` exposes phase, relay status, acquired fact provenance, issued orders,
responses and wave progress. The existing board displays a read-only summary.
It offers no buttons to manufacture waves, memories, witnesses or victories.

The rescue authority adds an immutable encounter registration and read-only
inspection API. Encounter assessments can only add missing requirements. Siege
completion cannot grant `district_saved`, bypass civilian verification, alter
ending eligibility or weaken existing defense checks. Early closeout may still
report one of PR #150's partial/evacuation/failure outcomes. Siege closeout must
bind both rescue and siege event counts, preventing a stale confirmation.

Legacy saves and non-siege definitions retain their prior behavior. Missing
content/modules and unknown future siege schemas preserve the save and block
only the unavailable operation. The existing campaign serializer, transaction and
immutable result remain the persistence owners. Iona's campaign and the wider
Chorus remain active; later space preparation remains independently gated.

## Content still required before live registration

- Source-reviewed district map, actual population and resident choices.
- Defined entry destination, landing geometry and command-vessel relay access.
- Balanced military/robot strengths, replacements and coverage schedules.
- Authored warning, cooperation and branch command encounters; Control's harmful
  order and alternative; Open Network fallback; independent Shutdown command.
- Travel, receiving care, containment, service tests and any transport recovery.
- Concrete encounter producers that observe physical actions and issue receipts.
- Reviewed wave timing and resource feasibility for all three endings.

Numbers in tests (including 200,000 infected) exercise the approved scale, not a
newly locked population or exact canon count. No synthetic district is shipped.

## Validation

- `node test_campaign_chorus_siege.js`: 21 tests, including reachable full saves
  without assimilation under every ending, knowledge provenance, relay limits,
  missing posts, atomic persistence, reload, future schema and stale closeout.
- `node test_campaign_low_quarter.js`: existing 58 cases.
- `npm test`: production contract gate, now including siege tests.
- `node scripts/chorus_siege_browser.mjs`: real game-page desktop/touch fixtures,
  three ending closeouts, adaptation board, missing content and reload. This is
  not a full authored campaign playthrough or physical iPhone acceptance.

Local Chromium cannot launch because its process-singleton socket is denied.
The PR's board workflow runs both browser harnesses on its exact head and retains
source hashes and logs. Pending hosted results must not be described as passes.
PR #150's earlier hosted board pass does not qualify these changed sources.
