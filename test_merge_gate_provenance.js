const assert = require("assert");
const fs = require("fs");

const workflow = fs.readFileSync(".github/workflows/merge-gate.yml", "utf8");
const browser = workflow.split("  browser:\n")[1]?.split("\n  required:")[0];
assert.ok(browser, "Merge Gate browser job must remain identifiable");

const testedHead = "github.event.pull_request.head.sha || github.sha";
const record = "git rev-parse HEAD > runtime-bot-artifacts/tested-commit.txt";
const artifact = `name: merge-gate-browser-\${{ ${testedHead} }}`;
const upload = browser.indexOf("- uses: actions/upload-artifact@v4");

assert.ok(browser.includes(`ref: \${{ ${testedHead} }}`), "browser acceptance must check out the exact PR head");
assert.ok(browser.includes(record), "browser evidence must record the actual checked-out commit");
assert.ok(browser.indexOf(record) < upload && upload >= 0, "tested-commit.txt must exist before artifact upload");
assert.ok(browser.includes(artifact), "browser artifact identity must use the same exact head as checkout");
assert.ok(!browser.includes("name: merge-gate-browser-${{ github.sha }}"), "browser artifact must not be named for a different synthetic merge revision");

console.log("Merge Gate tested-head provenance: PASS");
