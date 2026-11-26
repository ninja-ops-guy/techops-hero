# The Cylinder review — November 24, 2026

Status: **PROVISIONAL** new shopkeeper appearance; requested functionality implemented.

The user authorized a new safehouse, the names The Cylinder and Dr Mortise, and
the exit device/closer. The new appearance and room staging are review candidates.
No existing actor likeness, protected lore, rescue outcome or ending is changed.

## Evidence

- All six safehouse browser profiles passed: Shutdown, Control and Open Network
  at 1280×900; Shutdown at 390×844, 320×740 and 844×390. Real controls reach the
  shop from the opening; the existing ending setup and virtual clock are declared.
- Frozen simulation, keyboard and pointer entry/exit, focus wrapping, return
  position, held-key release, reload, failed saves, touch targets, horizontal
  overflow and ordinary-save isolation passed.
- Independent screenshot review found the required names and hardware visible,
  coherent arm/hand connections and counter occlusion, and readable primary UI.
  It identified a short-landscape crop. The corrected two-column layout passed a
  fresh 844×390 browser run and independent image review: keeper, nameplate, door,
  push bar, closer and exit control are now simultaneously visible.
- Existing 14 operation tests and 40 frozen-state graphics cases passed. The new
  safehouse entry contract passed across all three ending contexts.
- The production run executed 125 suites. The safehouse and gameplay groups
  passed; the existing `test_runtime_autofix.mjs` and `test_runtime_triage.mjs`
  failed on this Windows host. Their fixtures depend on executable POSIX shell
  stubs; triage additionally encountered a symlink permission error and tried
  the real `gh` executable when its shell stub was not selected. These suites
  and their runtime sources were not modified. The full gate is not claimed PASS.
- The first complete production run passed its 634-file JavaScript syntax check.
  Changed JavaScript and the browser harness also passed direct syntax checks
  following the layout correction; `git diff --check` passed.

Local evidence is retained in `artifacts/cylinder/` and
`artifacts/cylinder-landscape/`. Screenshot review is distinct from functional
browser testing. Physical iPhone/Safari, new likeness acceptance, merge and live
deployment are not claimed. No dedicated revision chat was created; this report,
the scene manifest and the retained screenshots form the local revision packet.
