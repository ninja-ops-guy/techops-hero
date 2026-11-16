# Living World — Rescue, Care, Return, and Relationship Scenes

**Status:** Production script and staging proposal for creator review  
**PR base:** #130, candidate head `0c7b983dd618aab06faff753b0b009de202cd330`  
**Script state:** Drafted below; not yet wired into runtime dialogue  
**Art state:** Existing companion and care markers are provisional staging. No final likeness, pose, animation, or environment approval is implied.

This document fills the narrative gap identified after the companion-staging pass. It adds dialogue and player-facing scene direction to already implemented campaign moments. It does not change chapter identifiers, prerequisites, survivor outcomes, the six/24-hour appointment, the consumed spare, Chapter 39, or the unresolved housing decision.

## Source review and existing implementation

The candidate implementation already establishes:

- `factory_return`: Mike maintains rescue support while K searches for Tarin. Two team members have already left on another shuttle; Tarin remains trapped; Adel is already in staffed care. K is visible beside the rescue route.
- Billy's care: one supported stretcher and one attendant appear at the return area. The player can inspect the care watch without gaining a quest, evidence, or knowledge flag.
- `low_return`: only K and Iona travel bodily. Iona visibly follows K through room changes and resumes; K remains the controlled character.
- `queue_afterward`: Mike's shipboard work, carried-log review, crew handoff, and off-duty rest. Optional song content shares only the recording Iona chose to share.

The prose below adds moments to these scenes. It does not turn Billy's care inspection into a mission, make Iona an escort objective, or make Mike a witness to private dialogue.

## Continuity and performance rules

- Keep the Chapter 39 exchange, embrace, and memory flood unchanged. In particular, this material takes place after that scene and must not replace its consent boundary with a new declaration or shortcut.
- The Lower Quarter is an inhabited realm; the Low Quarter is its neighborhood. K and Iona return through the maintained endpoint together. Do not turn the visit into unexplained Earth travel.
- Billy has one living body under continuous care. A projection ending does not establish death, unconsciousness, cure, or consent. Do not add a second Billy or ask him to answer while the scene establishes that he cannot.
- Keep Tarin and Adel distinct. The two already evacuated team members remain a separate outcome.
- A present-day observation and testimony can be checked; K's memory is not documentary proof and does not erase Iona's lived account.
- Mike is not K. Mike's coda remains his ordinary shipboard viewpoint and does not settle K and Iona's housing.
- Seed relationship complexity through small, consequential honesty. This is before the later Chorus catastrophe: no major argument, evacuation, separation, or K's search for Iona belongs in these scenes.

## Scene LW-FR-01 — The person still inside

**Campaign location:** `factory_return`, specification floor, after rescue support is restored and when K reaches Tarin.  
**Player viewpoint:** Mike, maintaining the route while K handles the contact.  
**Purpose:** Make K's rescue effort visible in dialogue and action while preserving the existing Tarin escort and confirmed receiving handoff.

### Script

*K reaches Tarin at the edge of the supported route. He stops at Tarin's level and leaves the path clear.*

**K:** Tarin. The way out is open as far as the return.  
**Tarin:** And after that?  
**K:** Mike is holding the route. We take it one section at a time.  
**Tarin:** I can walk if I keep my hand free.  
**K:** Then I'll keep the rail clear.

**Player interaction:** At the first crossing, choose **Keep the rail clear** or **Offer an arm**. Both are valid ways to help; Tarin sets the pace either way. Neither choice changes his route, survival, or recorded care needs.

*Tarin takes one step, then pauses. K stops with him instead of pulling him forward.*

**Tarin:** Give me a second.  
**K:** Take it.  
**Tarin:** All right. Now.

At the receiving point, K stays beside Tarin while the receiving crew reads back the handoff. The record is not complete until the receiver confirms Tarin's arrival and care needs.

### Visual and animation staging

1. Begin with Mike at the support station in the foreground and K visible on the specification floor beyond it. Keep the supported route readable between them.
2. Cut closer as K finds Tarin. K lowers his posture to meet Tarin's eyeline; he does not grab or carry him.
3. Hold on Tarin choosing his pace. The rail and K's position make the player's selected assistance legible without changing the canonical route.
4. On the return, keep Mike and K in separate planes of the same composition when practical: Mike maintains the route; K accompanies Tarin.
5. At handoff, frame Tarin, K, and the receiving crew together. Adel and the earlier evacuees do not enter this frame as interchangeable patients.

**Script work:** Dialogue, interaction labels, and handoff readback.  
**Animation/art work:** K's crouch and stop, Tarin's supported walk and pause, the two assistance variants, and a clear supported-route state. Reuse existing candidate sprites for review; final likeness and animation remain open.

## Scene LW-FR-02 — The watch continues

**Campaign location:** Existing Billy care inspection at the `factory_return` return area.  
**Player viewpoint:** Mike.  
**Purpose:** Give the already implemented read-only care marker a human exchange without turning it into a quest or implying Billy can report in.

### Script

*The attendant remains beside Billy's single supported stretcher. The camera does not present the projection's absence as a second body or a death image.*

**Mike:** Has anything changed?  
**Attendant:** Billy's projection ended. His living body is still here. I'm keeping the watch.  
**Mike:** Do we know whether he can hear us?  
**Attendant:** No.  
**Mike:** Then keep his care steady. He doesn't need to report in.

**Player interaction:** **Return to the room** closes the read-only inspection. It grants no quest, knowledge, evidence, or rescue completion. Tarin's receiving handoff remains a separate interaction.

### Visual and animation staging

1. Preserve the existing single stretcher, attendant, and care marker.
2. Use a calm, continuous breathing or hand movement only if it matches the established body reference; do not invent a medical status display.
3. Keep Mike outside the attendant's working space. The camera holds on the attendant returning to the watch after Mike leaves.
4. Keep this exchange short. The care scene should register as ongoing responsibility rather than a suspense reveal.

**Script work:** Replace or extend the current inspection copy with the exchange above.  
**Animation/art work:** Responsive stretcher framing, the attendant's care pose, and final body likeness. Portrait cropping and landscape prompt overlap remain production polish items already recorded in the PR evidence.

## Scene LW-LQ-01 — Two accounts of the street

**Campaign location:** `low_return`, during the existing workshop recognition and testimony comparison.  
**Player viewpoint:** K, with Iona visibly accompanying him.  
**Purpose:** Make Iona's physical presence emotionally active, and let the player choose how K handles a difference between memory and lived experience.

### Script

*At the rehearsal street, Iona pauses at a broken passage. K stops beside her.*

**Iona:** I used to take the narrow way here.  
**K:** I remember the turn.  
**Iona:** I remember slowing down for the people coming the other way.  
**K:** I don't have that part.  
**Iona:** Then we check what's here now.

*She points out the present route. K checks the obstruction instead of treating his fragment as a map.*

**Player interaction:** Keep the existing comparison choice:
- **Keep both accounts distinct:** Iona's testimony and K's recognition stay separate; the player inspects the present route.
- **Replace her account with the fragment:** the interaction explains why the memory cannot erase her account, then returns to the same valid choice.

Iona remains beside K while the player checks the physical route and proceeds to the maintained endpoint.

### Visual and animation staging

1. Keep Iona within the camera frame during K's landmark inspection. She must not disappear into a subtitle or offscreen companion marker.
2. Give Iona a specific look toward the blocked way before she speaks; K notices and stops without touching her.
3. Show the current broken route clearly enough for the player to inspect it. Do not add a supernatural overlay or depict the neighborhood restoring itself.
4. When the player accepts both accounts, Iona turns toward the usable route and waits for K to move with her.

**Script work:** Dialogue and the two choice responses.  
**Animation/art work:** Iona's pause, facing, point, and follow-through; K's stop and route inspection; environment staging that distinguishes memory from present observation.

## Scene LW-SHIP-01 — What memory cannot answer

**Campaign location:** After `low_return` completes and before Mike's first `queue_afterward` objective.  
**Viewpoint:** Brief K/Iona cutaway, then return to Mike's existing coda.  
**Purpose:** Let the return leave an emotional consequence without resolving the relationship or exposing their private conversation to Mike.

### Script

*Shipboard. Outside the established care area, K and Iona pause after confirming Billy remains under the watch. No new care status is announced.*

**Iona:** At the workshop, you knew the turn before I did.  
**K:** I remembered it. I didn't remember being the person you remembered.  
**Iona:** I kept hoping the next thing would click.  
**K:** Did it?  
**Iona:** No.  
**K:** I'm sorry.  
**Iona:** I don't want an apology for not remembering. I want to know when you go quiet whether you've left me alone in it.  
**K:** Sometimes I won't know until after.  
**Iona:** That's an answer. It won't always be easy to live with.  
**K:** I know.  
**Iona:** Can we try with the answer we have?  
**K:** Yeah. One thing at a time.

**Player interaction:** Choose **Sit beside Iona** or **Give her space**. Both are valid. If K sits, Iona does not treat that as a promise; if he gives her space, she does not follow him. The choice changes the staging and line pause only. It creates no romance meter, housing decision, reward, or future-event flag.

*After the pause, they leave the care area together at their own pace. Cut away before Mike's workday begins.*

### Visual and animation staging

1. Use a quiet transition area in the existing code-art ship treatment. Do not imply a certified deck plan or introduce a new ship location as established canon.
2. Keep a visible, ordinary passage between them and the care area. The exchange is private; Mike is not in frame and does not hear it.
3. Begin with the two at a conversational distance. On **Sit beside Iona**, K closes only part of the distance; she decides whether to remain. On **Give her space**, both stay in the same composition until Iona turns to go.
4. Avoid a hug, tearful reconciliation, or triumphant music cue. Their decision to continue together is present-tense companionship, not a restored past.
5. Cut back to Mike's unchanged sequence: ordinary repair with an existing crewmate, carried-log review, accepted handoff, and rest aboard.

**Script work:** Dialogue, interaction prompt, and a safe one-shot return from this cutaway to Mike's coda.  
**Animation/art work:** Seated/standing transition poses, subtle eyelines and spacing, care-area privacy framing, final ship environment art, and responsive layouts. No new music stem is implied.

## Integration checklist

1. Wire LW-FR-01 into the existing K/Tarin rescue moment without adding a new chapter, changing the route, or recording a new rescue outcome.
2. Wire LW-FR-02 into the existing read-only Billy care inspection; keep it separate from the Tarin handoff.
3. Place LW-LQ-01 in the existing testimony interaction while Iona's current companion staging is active.
4. Add LW-SHIP-01 as a short post-return cutaway immediately before Mike's coda. Preserve existing chapter IDs, prerequisites, completion records, rewards, and Mike's viewpoint once his coda begins.
5. Keep all newly authored character animation and environment art marked as provisional until separately reviewed against approved references.
6. Do not draw on the future Chorus catastrophe for tension here. The later relationship rupture and evacuation remain separate future scenes.

## Review state

- Dialogue: **DRAFTED — awaiting creator review**
- Runtime integration: **NOT IMPLEMENTED**
- New animation/art: **NOT PRODUCED**
- Existing companion/care staging: **IMPLEMENTED AS PROVISIONAL CANDIDATE ART**
- Chapter 39, housing decision, rescue outcome, Low Quarter travel rules: **PRESERVED**
