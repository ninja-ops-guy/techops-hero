#!/usr/bin/env python3
"""One-shot, hash-pinned publisher for the reviewed gameplay integration.

Runs only on the named PR branch. Publishes source only after the exact main
baseline, payload hashes, installed bytes, and complete production gate pass.
Any race is rejected by an ordinary non-force git push.
"""
from __future__ import annotations

import base64
import hashlib
import json
import lzma
import os
from pathlib import Path, PurePosixPath
import subprocess
import tempfile

BASE = "8004cef72a33b466285076f25af64a5f0570e6b5"
BRANCH = "feat/gameplay-feedback-workday-pass"
MANIFEST_SHA256 = "b55e0127ea3352a07e2ade01b66a25689dc6e50bf32982b4bef16112dc7fd8bc"


def run(*args: str, capture: bool = False) -> str:
    result = subprocess.run(args, check=True, text=True,
                            stdout=subprocess.PIPE if capture else None)
    return result.stdout.strip() if capture else ""


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def main() -> None:
    require(os.environ.get("GITHUB_REF") == "refs/heads/" + BRANCH,
            "Wrong publication branch")
    require(os.environ.get("GITHUB_REPOSITORY") == "ninja-ops-guy/techops-hero",
            "Wrong repository")
    root = Path(run("git", "rev-parse", "--show-toplevel", capture=True)).resolve()
    os.chdir(root)
    delivery = root / ".quality-delivery"
    raw = (delivery / "manifest.json").read_bytes()
    require(digest(raw) == MANIFEST_SHA256, "Manifest checksum mismatch")
    manifest = json.loads(raw)
    require(manifest["version"] == 1 and manifest["base"] == BASE,
            "Wrong manifest/base")
    require(len(manifest["files"]) == 39, "Unexpected source file count")
    paths: list[str] = []
    for item in manifest["files"]:
        path = item["path"]
        relative = PurePosixPath(path)
        require(not relative.is_absolute() and str(relative) == path and
                all(part not in ("", ".", "..") and not part.startswith(".")
                    for part in relative.parts), "Unsafe payload path: " + path)
        require(path not in paths, "Duplicate payload path")
        target = root / path
        require(all(not p.is_symlink() for p in [target, *target.parents]),
                "Symlink in payload path")
        paths.append(path)
    require(run("git", "status", "--porcelain", capture=True) == "",
            "Checkout is not clean")
    run("git", "fetch", "--no-tags", "--depth=1", "origin", BASE)
    differing = run("git", "diff", "--name-only", BASE, "HEAD", capture=True).splitlines()
    require(all(p.startswith(".quality-delivery/") or
                p == ".github/workflows/quality-integration-publish.yml"
                for p in differing), "Source differs from pinned main baseline")
    for item in manifest["files"]:
        target = root / item["path"]
        actual = digest(target.read_bytes()) if target.exists() else None
        require(actual == item["before"], "Base bytes changed: " + item["path"])
    expected_parts = [f"part{i:02d}.txt" for i in range(11)]
    require(manifest["parts"] == expected_parts, "Unexpected payload parts")
    encoded = b"".join((delivery / p).read_bytes() for p in expected_parts)
    require(len(encoded) == 85360, "Encoded payload length mismatch")
    archive = base64.b64decode(encoded, validate=True)
    require(digest(archive) == manifest["archive_sha256"], "Archive checksum mismatch")
    decoder = lzma.LZMADecompressor(memlimit=256 * 1024 * 1024)
    patch = decoder.decompress(archive, max_length=4 * 1024 * 1024)
    require(decoder.eof and not decoder.unused_data,
            "Incomplete, oversized, or concatenated archive")
    require(len(patch) == 266460 and digest(patch) == manifest["patch_sha256"],
            "Patch checksum mismatch")
    with tempfile.NamedTemporaryFile(suffix=".patch") as temp:
        temp.write(patch)
        temp.flush()
        stats = run("git", "apply", "--numstat", temp.name, capture=True).splitlines()
        patch_paths = [line.split("\t", 2)[2] for line in stats]
        require(sorted(patch_paths) == sorted(paths), "Patch paths not allowlisted")
        run("git", "apply", "--check", "--whitespace=error-all", temp.name)
        run("git", "apply", "--whitespace=error-all", temp.name)

    def verify_installed() -> None:
        for item in manifest["files"]:
            target = root / item["path"]
            require(target.is_file() and not target.is_symlink(), "Missing regular source file")
            data = target.read_bytes()
            require(digest(data) == item["after"], "Installed checksum mismatch: " + item["path"])
            blob = hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()
            require(blob == item["blob"], "Installed blob mismatch: " + item["path"])

    verify_installed()
    run("node", "scripts/production_release_gate.js")
    verify_installed()
    run("git", "add", "--", *paths)
    staged = run("git", "diff", "--cached", "--name-only", capture=True).splitlines()
    require(sorted(staged) == sorted(paths), "Staged file set differs from reviewed payload")
    run("git", "-c", "user.name=github-actions[bot]", "-c",
        "user.email=41898282+github-actions[bot]@users.noreply.github.com", "commit", "-m",
        "Integrate tested gameplay quality, street audio and next-shift consequences")
    run("git", "push", "origin", "HEAD:refs/heads/" + BRANCH)
    sha = run("git", "rev-parse", "HEAD", capture=True)
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as stream:
            stream.write("## Verified gameplay integration published\n\n")
            stream.write(f"Commit: `{sha}`\n\n39 exact-hash source files; aggregate production gate passed. "
                         "Normal non-force push. Full browser/device acceptance remains separate.\n")
    print("PUBLISHED_VERIFIED_SOURCE=" + sha)


if __name__ == "__main__":
    main()
