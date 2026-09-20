#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const root = path.resolve(__dirname, "..");
const ignored = new Set([".git", "artifacts", "node_modules"]);
const files = [];

function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(absolute);
    else if (entry.isFile() && /\.(?:m?js)$/.test(entry.name)) files.push(absolute);
  }
}

function check(file) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, ["--check", file], {
      cwd: root,
      stdio: ["ignore", "ignore", "pipe"]
    });
    let error = "";
    child.stderr.on("data", chunk => { error += chunk; });
    child.on("error", failure => resolve({ file, error: String(failure) }));
    child.on("close", code => resolve(code === 0 ? null : { file, error }));
  });
}

async function main() {
  collect(root);
  files.sort();
  const failures = [];
  let next = 0;
  const workerCount = Math.min(8, files.length || 1);
  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (next < files.length) {
      const file = files[next++];
      const failure = await check(file);
      if (failure) failures.push(failure);
    }
  }));
  if (failures.length) {
    for (const failure of failures) {
      console.error(`\n${path.relative(root, failure.file)}\n${failure.error.trim()}`);
    }
    console.error(`\nJavaScript syntax check: FAIL (${failures.length}/${files.length})`);
    process.exitCode = 1;
    return;
  }
  console.log(`JavaScript syntax check: PASS (${files.length} files)`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
