# The Cylinder — Siege safehouse

Creator direction, November 24, 2026: add a new safehouse named **The Cylinder**,
with shopkeeper **Dr Mortise**, and a shop exit door fitted with an exit device
and a door closer. The creator confirmed that the room did not already exist.

This implementation extends the latest First Warning visual branch,
`codex/low-quarter-approved-sprite-direction` at
`556d00984c76cf86b3edf7116744c9435440d328` (PR #163).

## Play

In `low-quarter-review.html`, walk to the Service Exchange. The Cylinder is at
street x=640, between the dispatch-records and service-rota stations. Approach
the brass sign and press **E**, use **Interact**, or select the nearby entrance.
Inside, speak to Dr Mortise, browse the displayed hardware, or ask about the door.
Click the door's **Push bar · Exit** control or press **Escape** to leave.

The interior depicts a counter, hardware shelves, and a steel exit door. The door
has hinge plates, a horizontal push-pad exit device with end cases and latch,
and a surface-mounted overhead closer with a jointed arm attached to the frame.
The entire door is an accessible button; its label also describes the hardware.

## Ownership and scope

The review runtime commits the current street checkpoint before opening a modal
shop visit. Simulation remains paused, including travel, combat, arrivals,
convoys and timers. Closing returns to the same position and clears held input.
Reloading while inside resumes from the committed street checkpoint. A failed
save prevents entry. Hidden/unfocused pages remain paused on exit.

Entry requires proximity, a grounded living player and no active work/travel or
terminal operation state. The room does not create a rescue location, move
residents or units, issue receipts, grant healing, or change the save schema.
Stock browsing is conversation only; this request adds no prices or economy.
The ordinary campaign localStorage slot is untouched by the opening review.

This is a branch-local addition to the First Warning opening. The separate
Hold the Way Home mission (#154/#160) is not reconciled by this change.

## Art and canon

The creator supplied the room and character names and the required door hardware.
The room composition, hardware stock, dialogue, glasses and workshop-apron sprite
are new provisional game staging. Dr Mortise has no supplied likeness reference,
biography, medical role or connection to another named actor. No existing actor
is reskinned as Dr Mortise. The scene stays in the game's pixel-art register.

The implementation is deterministic Canvas drawing, with no new raster assets
or generative-image invocation. Review screenshots and the scene manifest retain
the candidate; no separate revision chat or creator likeness approval is claimed.

## Validation

`node test_low_quarter_safehouse.js` checks proximity, busy/dead/end-state guards,
all three ending contexts, and unchanged mission ledgers. `npm test` includes it.

`node scripts/low_quarter_safehouse_browser.cjs` uses the existing ending setup,
real keyboard/pointer controls and accelerated browser time. It checks natural
entry, frozen simulation, dialogue, keyboard focus, Escape/door exit, retained
position, resumed clock, no held-key leakage, reload, failed checkpoint writes,
ordinary-save isolation, touch target size and horizontal overflow. Profiles:
all three endings at 1280×900, plus Shutdown at 390×844, 320×740 and 844×390.

Set `LOW_QUARTER_BASE_URL` to the running media server. Optional environment
overrides `PLAYWRIGHT_MODULE` and `PLAYWRIGHT_EXECUTABLE` select an installed
Playwright package/browser without modifying runtime dependencies. Evidence goes
to `artifacts/cylinder/` (or `CYLINDER_ARTIFACT_DIR`). This is Chromium emulation,
not physical-phone or complete-campaign qualification.
