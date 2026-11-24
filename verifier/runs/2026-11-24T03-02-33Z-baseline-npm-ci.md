# baseline-npm-ci

- UTC: 2026-11-24T03:02:33Z
- Command: `npm ci`
- Exit code: 1 (`ENOTSUP`; the subsequent shell wrapper exited 2 while attempting to capture `PIPESTATUS` under `sh`)
- Values produced: no dependency installation or test result; Playwright `.bin` symlink creation was unsupported on the worktree filesystem.
- Log: `verifier/runs/2026-11-24T03-02-33Z-baseline-npm-ci.log`
- Disposition: environment failure only; dependencies were subsequently installed in `/tmp` and copied without symlink creation.
