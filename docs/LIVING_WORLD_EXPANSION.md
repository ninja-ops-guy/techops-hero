# Living World expansion

This candidate turns the comic review into a playable sequence of 27 authored chapters, with home and Archive interludes and 11 optional quest chains. It uses the existing Night movement, fighting, store, save system, and in-repository character artwork.

Start **Night Walker → Run Menu [C] → Living World — story expeditions**. The standalone companion introduces exploration, then arcade combat, signal work, paired operators, transport, and objective-led horror. Its later chapters contain comic spoilers. The native campaign uses the same chapters with additional story and day gates.

This is a source candidate, not a deployment or final visual-art signoff. New environments use code-drawn scenery and existing background art. Transport chapters control a service car, supported cradle, or carrier from the named viewpoint; they do not substitute another character's sprite for Iona or Kali. Named companions currently use simple readable accompaniment markers. The inherited K action atlas depicts dark lenses and needs a later likeness pass against the current clear-glasses reference. Bespoke illustrated scenery, additional character animation, voice performances, and music stems remain a separate art-production pass.

## Waldo and Iona progression

The player hears **Waldo’s later invitation on Mike’s covered back porch**, then physically visits Waldo’s garage. Both conversations persist their current line. The invitation flag is written only after its final line; the visit flag only after its final line. Opening, pausing, reloading or failing to save a conversation cannot silently complete it. Existing saves with old Iona chapters complete still require this gate before replaying them.

The new dialogue is an original game continuation, not a claimed quotation from the comic. The next-day garage visit follows the later porch conversation; it does not rewrite the protected Chapter 39 reunion or decide whether K and Iona move in together.

> Waldo: “Come by the garage tomorrow. No broken computer required.”
>
> Mike: “Just to hang out?”
>
> Waldo: “That was the idea.”

The visit unlocks Iona viewpoints for the player. Mike does not thereby learn Iona’s private events. The earlier Low Quarter and cargo-dock missions remain explicitly historical interludes.

| New chapter | Position / mechanic |
| --- | --- |
| Three Calls, One Night | After the service ring: choose call order; all three need verification. First call grants later power assistance, an access shortcut, or callback assistance. |
| No Broken Computer Required | After the later porch conversation: invitation, next-day walk, garage conversation, time as friends. |
| Her Own Bearings | Iona explores on foot, checks a real entrance, and accompanies a rehearsal delivery. |
| Countermeasure | Iona creates working space against constructs, repairs the shutter, and escorts the workshop crew. |
| The World He Left Running | Historical Iona interlude: intercept the transfer, free the crew, recover the custody ledger, and burn the cleared depot. |
| The Name in the Freight Book | Follow the ledger to North Intake, confirm the address, and lead into the comic's closing soundcheck. |
| The Last Shift | Mike uses familiar service routes to stop a process and receive the late-shift coworkers. |
| A Moving Safehouse | Vehicle segment with a cooling repair, passenger check and receiving callback before arrival. |
| Keep Time in the Dark | Iona observes work cycles, protects support and escorts a waiting crew through horror spaces. |
| The Borrowed Skill | Preserve support while interrupting an occupied frame’s task dependency; no presumed cure or restored identity. |
| Morrow Array: First Contact | Bellwether crew operates a service probe, verifies return, records a bounded trace and recovers the probe. Separate viewpoint and location. |
| No Common Channel | Mike sends a bounded report; Iona must receive it and independently test her endpoint. Explicit viewpoint cuts, no shared private-memory journal. |
| Hold the Receiving End | Prepare staffed capacity and power, meet arrivals, then escort them to the receiving lead. |
| Her Side of the Door | Iona receives the last arrivals and keeps a personal next step beyond the emergency. |
| The Queue Afterward | Ordinary work returns; a consequence record acknowledges completed optional chains. |

Iona’s historical depot mission follows the approved interlude sequence rather than the later playable “Countermeasure” scene. The early transport recall breaks its escort onto the freight gantry; Iona sends medics, losing the spotter at the west line, then cuts the shared freight corridor when the vans are about to unload. The blackout puts a resident in danger, and Iona rescues her. The two crew members Iona frees first cross the public line, then choose to return by the exterior stair. The closed security grille and narrow gate keep the first officer, second officer and their colleague distinct. The freed pair drop a sandbag onto the second officer on the security side; it knocks him into his colleague while the first officer is already across. Iona turns the first officer into the gate frame, crosses and fully closes the separate records shutter, and faces a distinct far-end officer. Later, a newly arriving patrol officer is released toward his colleagues; Iona then doubles back to free an older, conscious officer pinned by a railing and helps him through the spring-closing fire door. Mara and the lift resident independently verify the count, including officers, before the local depot burn. The injured officer’s visible crossing and witness are required; no off-panel count is assumed.

Iona’s foot missions use the imported band-reference sprite candidate and directional combat, including aerial down-light and the three-contact bicycle kick. Source commits: `367978e` and `789e51b` from the existing Iona worktree. Artwork and provenance are retained under `art-review/iona-nightwalker`; integration does not imply final creator art approval. Vehicle missions continue to render their actual transport.

Five new optional chains span separate chapters: **The Spare Key**, **The Repair That Held**, **An Unfinished Song**, **Who Takes Over?**, and **A Place Kept Ready**. Each step must be visited at its own location. Their final acknowledgments appear in the aftermath; the song grants no combat power. Missed steps remain available through revisits.

## Chapters and maps

Every chapter has three named spaces with an explicit adjacency graph. Revisited factories and neighborhoods retain their topology and landmarks while changing occupancy, access, purpose, and scenery.

| Chapter | Map family / viewpoint | Playable emphasis | Native story gate |
| --- | --- | --- | --- |
| The Route We Keep | AeroTech service ring / Mike | Requester → local repair → receiver test → route record | Day work unlocked |
| Open According to the Map | West Annex / Mike | Fight for working space, bypass a dependency, escort Security Ops | Tuesday morning |
| Dead Air: The Receiving End | Pier 7 / Mike | Filter observations, inspect a cargo seal, protect or share a bounded source | Ghost identity established |
| Blind Bearings | Rooftops / Felicia | Vertical traversal, two independent bearings, component qualification | Violinist revealed; game day 5 or later |
| Two Hands on the Stop | Hangar Three / Felicia and Mike | Switch operator; independent power and stop checks | Felicia alliance |
| Through the Walls | Orbital Sector 4 / the dogs | Dog-width passages; Katrin locates, Manchez holds; K before Oz | Duet Protocol complete |
| The House That Didn't Ask | Home and garage / Mike | A guest's place, current habits, a bounded work handoff, rest | Mike has met K |
| A Neighborhood With Names | Earlier Low Quarter / Iona's service car | Wide roads, capacity checks, scoped crew responsibilities | Main campaign complete |
| Not Until They Answer | Orbital cargo dock / Iona's supported cradle | Keep life support connected, qualify the ramp, wait for receiving reports | Main campaign complete |
| What Remains With Us | Working room and physical Archive / K | Keep evidence, recollection, and chosen audience distinct | Main campaign complete; Mike has met K |
| The Dark Factory | Automated factory, first visit / Kali's carrier | Observe work cycles, prepare the return, take a partial haul | Main campaign complete |
| The Work Continues | Earth fracture neighborhood / Mike | Isolate harmful remote control while preserving support; escort neighbors | Main campaign complete |
| A Different Occupancy | Same factory, later visit / Mike | Verify the roster, support the rescue route, receive Tarin | Main campaign complete |
| The Streets We Remember | Changed Low Quarter / K and Iona | Compare accounts, check both endpoints, make the bounded return | Main campaign complete; Mike has met K |

The full dependency order is in the chapter data; phase-two chapters sit between these original chapters. Iona's two new historical missions unlock after **Countermeasure**, the later Iona visit, and completion of the Night Walker main campaign. Their story bridge places the depot operation after Red's arrest and before Iona contacts K, matching the comic. The follow-up remains gated behind the depot mission; the later Archive chapter now follows it in the playable trail. Previously completed chapters retain their completion records. Chronological bridge briefings explicitly identify intervening comic events. These playable episodes do not replace or silently grant the main game's established acts, the Warden encounter, the six-month crossing, Chapter 39, Chapters 40–51, or the intervening Chorus travel and rescue events.

## Navigation and variation

Routes are physical connections between rooms except the explicitly labeled viewpoint cuts in No Common Channel. A reported-open route can still be blocked. Traversal records verification, but a power dependency or width limit still decides whether the route works now. Route selection is available only at a marked exit; opening the journal elsewhere provides information without teleporting the actor.

Medical and vehicle transfers require wide routes. Escorts follow at their own speed, stop when abandoned, and cannot cross a room boundary until nearby. A receiving objective checks the companion's actual position. The field card tells the player when someone is waiting behind.

Platforms differ by environment: receiver roofs, pier gantries, prison service passages, factory walkways, rubble routes, and clear domestic floors. The factory's second visit preserves its geography. Low Quarter's return changes the familiar street dressing and the route that can be established.

Each chapter has two bounded encounter arrangements. Revisits alternate construct placement and the phase of a clearly signaled machine work cycle. Warning, active, and quiet periods use the simulation clock; menus and a hidden tab stop progress. The system never randomizes canon survivors, identities, revelations, or evacuation outcomes.

Combat uses the existing directional attacks, kicks, launches, and recovery. Disabling a construct does not complete an objective. A repair or transfer can pause when the player moves or takes damage, retaining partial work. Chorus occupants are not farmable humanoid targets: the new horror rooms use work-cycle hazards and rescue conditions. Local success does not cure the distributed Chorus.

## Optional quests

| Quest | Activity | Persisted consequence |
| --- | --- | --- |
| The Route We Actually Use | Walk the worker's route, check the latch, record the shortcut | Opens the Pier 7 service alley |
| Two Cups | Offer a present-day choice, sit, leave room for tomorrow | Two cups appear at home; no score or mandatory gate |
| A Name on the Door | Agree a separate record and limited access; test the key | K's nameplate appears on the agreed door |
| Soundcheck | Hand off the work, check the actual signal, share the count-in | A four-beat visual count-in remains in the garage |
| Someone Is Expecting This | Ask what the device enables, test with its owner, return instructions | The receiving bay shows the unit in use |
| The Receiving End | Meet a contact, check the entrance, test a callback | The later shelter acknowledges the familiar callback procedure, while still requiring a present receiving person |

All 11 are optional and idempotent. Each step is tied to a physical point. They add routes, relationships, and remembered details rather than repeat cash payouts. Source sharing, the household work handoff, and Archive privacy also retain the player's choices.

## Canon and knowledge boundaries

The source review used the November 15 reconciled TechOps Hero Bible v2.1, Revision G comic, the approved Volume XIII Iona expansion, the current Chorus manuscript, and the Administrative Necrosis treatment. The chapter data records the resulting bounded scene premises.

- Mike and K remain separate people. Mike is absent from the prison rescue and meets K only after the established escape and crossing.
- Katrin and Manchez are both male. Katrin communicates through attention, body language, and barking; Manchez has the speaking role. Cell 118 precedes Cell 1984. Orbital Sector 4 is distinct from Earth's Sector 04 hangar.
- Felicia's private branch follows her reveal. Actor-specific records remain in their own viewpoint. Only Mike's own reports and explicitly shared commissioning outcomes enter the general game journal.
- Iona's shown evacuation readbacks precede the strike. Tomas stays on working support; Luz remains with him.
- Chorus events follow the Living Archive material. Morrow Array, the factory, and Sudo's installation remain different places. The first factory visit is uncrewed; the later visit identifies Tarin separately from Adel and the already evacuated recovery crew.
- The Gallery, K Terminal, dreams, and the inhabited Lower Quarter are not interchangeable travel menus. The later bodily Low Quarter visit is K and Iona's; Billy remains aboard under care. Both prepared endpoints are required.
- Quiet chapters do not turn care into an efficiency score. Recovering a record does not automatically restore trust, authenticate it, or replace someone's lived account.

## Implementation and saves

`campaign_living_world_data.js` owns authored chapters, route graphs, questions, and optional quests. `campaign_living_world.js` is the pure validated state machine. `campaign_living_world_runtime.js` connects it to the production compositor, input adapter, dialogues, supplies, and checkpoint owner.

The three modules load on demand from the existing Night menu. They add no startup script tags, animation loop, interval, or competing simulation owner. The immutable production wrapper dispatches their drawing and before/after-step hooks.

State lives in `S.meta.livingWorld`, with versioned chapter runs, consequences, choices, actor records, encounters, escort positions, partial work, and optional progress. A failed objective write restores the previous objective state and journal. Failed purchases and item use use the existing atomic supply behavior.

Standalone saves contain a validated street return together with expedition state, current health, and supplies. Reload first restores that street; the expedition board then resumes the chapter. The Day profile and native story facts are not written by standalone expeditions. Native play persists the expedition metadata with its normal profile. No new native story milestone is granted.

## Verification

Run `node scripts/production_release_gate.js` for the complete registered production checks. The added domain suite covers the complete chapter graph, gates, actor authority, escort distance, transport width, work interruption, bounded variations, optional persistence, and corrupt-save rejection.

`node scripts/living_world_browser.mjs` follows the real title, movement, combat, double jump, mission dialogues, routes, and chapter completion. It also revisits the relevant chapters to complete all 11 optional quest chains. `LIVING_RESUME` accepts the script's own saved browser state for a continued playthrough; it does not inject story progress. `LIVING_PROFILE` selects desktop, portrait, or landscape.

`node scripts/living_world_recovery_browser.mjs` checks objective and purchase rollback, item retention at full health, healing and reload, chapter resume, paused journals, HUD bounds, and actual touch movement across three viewport sizes. Its explicitly disclosed fixtures are a storage quota exception and setting health to 40 to isolate healing from combat randomness.

Validation receipts distinguish uninterrupted checks from resumed playthroughs and fixture-assisted checks. Browser emulation is not a claim of physical iOS device qualification. Main-campaign gate behavior is covered by the domain tests; the complete original campaign has not been replayed end to end for this expansion.

This branch is stacked on PR #128 (`codex/night-walker-store-items`, base commit `0fea6e76010697a7003e60894bd84b22054476d9`) so field supplies are usable within every applicable expedition. Retarget or rebase after that dependency merges, then rerun the production gate before release.
