# TechOps Hero — Release Certification R1
Status: Ship gate

## Gate order
1. **Contract** — production bible, quality bar and vertical slice accepted.
2. **Static/automated** — existing test suites and release workflows green at exact candidate head.
3. **Functional** — canonical Day and Night flows plus negative paths pass.
4. **Visual** — fixed-checkpoint review passes against reference slice.
5. **Input/device** — supported matrix passes, including safe areas and lifecycle/focus behavior.
6. **Persistence** — save/reload and transition boundaries pass.
7. **Performance** — measured budgets accepted on supported matrix.
8. **Accessibility** — declared accessibility checks pass.
9. **Human playtest** — fresh-context player completes the slice without developer intervention; confusion points are recorded.
10. **Candidate freeze** — exact commit identified; only release blockers may change it.

## Required evidence bundle
- exact commit SHA;
- workflow/check results;
- automated test summary;
- vertical-slice checkpoint captures;
- device/input matrix;
- performance evidence;
- save/reload evidence;
- known-issues list with severity/disposition;
- human playtest notes;
- final P0/P1 count = 0.

## Regression policy
Any post-freeze change invalidates the evidence it can affect. Re-run targeted qualification plus the full vertical-slice smoke path before restoring candidate status.

## No false equivalence
"All tests pass" does not mean "release certified." Automated correctness, visual quality, playability, performance and human comprehension are separate gates.

## Stop-ship conditions
Any P0; any P1; canonical-path softlock; save corruption; Day/Night state leakage; wrong interaction semantics on the reference path; unsupported-but-advertised input/device; material visual regression; missing required release evidence.

## Release decision record
The final release record must state the candidate SHA, evidence bundle location, known accepted P2/P3 defects, supported platforms/inputs, and explicit certification result. No release is certified by implication.
