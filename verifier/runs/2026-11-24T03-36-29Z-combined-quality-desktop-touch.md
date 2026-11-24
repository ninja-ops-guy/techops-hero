# combined-quality-desktop-touch

- UTC: 2026-11-24T03-36-29Z
- Command: 
> techops-hero-runtime-bot@1.0.0 test:browser:quality
> node scripts/quality_acceptance_browser.mjs

{"status":"failed","checks":0,"profiles":[],"report":"/tmp/techops-quality-acceptance/quality-report.json","failure":"browserType.launch: Executable doesn't exist at /opt/ms-playwright/chromium_headless_shell-1193/chrome-linux/headless_shell
╔═════════════════════════════════════════════════════════════════════════╗
║ Looks like Playwright Test or Playwright was just installed or updated. ║
║ Please run the following command to download new browsers:              ║
║                                                                         ║
║     npx playwright install                                              ║
║                                                                         ║
║ <3 Playwright Team                                                      ║
╚═════════════════════════════════════════════════════════════════════════╝
    at /tmp/techops-combined/scripts/quality_acceptance_browser.mjs:271:26"}
- Exit code: 1
- Values: desktop 1280×800, portrait touch 390×844, landscape touch 844×390; Day/Night/Good Boys and save/Continue.
- Log: 
# 2026-11-24T03-36-29Z

- UTC: combined-quality-desktop-touch
- Command: 
> techops-hero-runtime-bot@1.0.0 test:browser:quality
> node scripts/quality_acceptance_browser.mjs

{"status":"failed","checks":0,"profiles":[],"report":"/tmp/techops-quality-acceptance/quality-report.json","failure":"browserType.launch: Executable doesn't exist at /opt/ms-playwright/chromium_headless_shell-1193/chrome-linux/headless_shell
╔═════════════════════════════════════════════════════════════════════════╗
║ Looks like Playwright Test or Playwright was just installed or updated. ║
║ Please run the following command to download new browsers:              ║
║                                                                         ║
║     npx playwright install                                              ║
║                                                                         ║
║ <3 Playwright Team                                                      ║
╚═════════════════════════════════════════════════════════════════════════╝
    at /tmp/techops-combined/scripts/quality_acceptance_browser.mjs:271:26"}
- Exit code: 
- Values: desktop 1280×800, portrait touch 390×844, landscape touch 844×390; Day/Night/Good Boys and save/Continue.
- Log: 

## Append-only correction

- Actual command: `BOT_CHROMIUM_EXECUTABLE` was unset; `npm run test:browser:quality`
- Exit code: 1
- Values produced: zero profiles and zero checks; Chromium launch failed because the pinned headless-shell executable was absent. No gameplay result was produced.
- Log: `verifier/runs/2026-11-24T03-36-29Z-combined-quality-desktop-touch.log`
- Note: the initial record formatter interpreted Markdown backticks as shell substitution; this correction supplies the intended fields without altering the failed result.
