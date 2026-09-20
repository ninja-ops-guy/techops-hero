#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const inventoryPath = path.join(root, "review_contracts.json");
const guidePath = path.join(root, "REVIEW_GUIDE.md");

function render(data) {
  const lines = [
    "# PR #" + data.pull_request + " review guide",
    "",
    "> Generated from `review_contracts.json`. Edit the inventory, then run `node scripts/generate_review_guide.js`.",
    "",
    "## Logical review map",
    "",
    "| Domain | Files | Primary tests |",
    "| --- | --- | --- |"
  ];
  for (const domain of data.domains) {
    lines.push("| " + domain.name + " | " + domain.files.map(file => "`" + file + "`").join("<br>") + " | " + domain.tests.map(file => "`" + file + "`").join("<br>") + " |");
  }
  lines.push("", "## Failure-mode contracts", "", "| ID | Failure mode | Invariant | Executable test | Spot check |", "| --- | --- | --- | --- | --- |");
  for (const contract of data.contracts) {
    lines.push("| `" + contract.id + "` | " + contract.failure_mode + " | " + contract.invariant + " | `" + contract.test_ref + "` | " + contract.spot_check + " |");
  }
  lines.push("", "## Deletion and retirement ledger", "", "| ID | Removed or retired | Why | Resurrection check |", "| --- | --- | --- | --- |");
  for (const item of data.deletion_ledger) {
    lines.push("| `" + item.id + "` | " + item.removed + " | " + item.reason + " | `" + item.resurrection_check + "` |");
  }
  lines.push("", "## Approval boundary", "", "Do not merge until the named remote checks in the PR description are successful and every contract above has an executable test reference. Physical-device and licensed-browser media certification remain separate release gates.", "");
  return lines.join("\n");
}

const data = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
const expected = render(data);
if (process.argv.includes("--check")) {
  const actual = fs.existsSync(guidePath) ? fs.readFileSync(guidePath, "utf8") : "";
  if (actual !== expected) {
    console.error("REVIEW_GUIDE.md is stale; run node scripts/generate_review_guide.js");
    process.exit(1);
  }
  console.log("Review guide generation contract: PASS");
} else {
  fs.writeFileSync(guidePath, expected);
  console.log("Wrote " + path.relative(root, guidePath));
}

module.exports = { render };
