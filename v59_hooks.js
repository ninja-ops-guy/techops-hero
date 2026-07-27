/* ============================================================
   TECHOPS HERO v5.9 — "The Board" (v59_hooks.js)
   Loads AFTER v58_hooks.js. Adds:
   • Detective evidence board at Mike's desk — read the clue
     cards, spot the smoking gun, clear the innocent suspect,
     name the root cause. Six rotating cases.
   ============================================================ */
"use strict";

// ---------- case files ----------
// each: culprit, gun (smoking-gun clue), clues (supporting), excl (fact that CLEARS it as a decoy), exclWhy
const CASES = [
  { culprit: "Rogue DHCP server in Accounting",
    gun: "An unknown device is answering DHCP DORA requests on VLAN 12",
    clues: ["Half of Accounting pulled 192.168.77.x leases at 9:14 AM", "The legit DC shows no leases for the affected MACs"],
    excl: "Every affected client holds a valid 10.x lease from the real DC", exclWhy: "no rogue leases exist in the wild" },
  { culprit: "DNS cache poisoning on the forwarder",
    gun: "dig shows the intranet resolving to a suspicious VPS — but only via the forwarder",
    clues: ["The authoritative zone file is untouched", "Clients pointed at the other resolver are fine"],
    excl: "All clients resolve every name correctly from both resolvers", exclWhy: "resolution is consistent everywhere" },
  { culprit: "Degraded RAID on the file server",
    gun: "iDRAC reports predictive failure on the disk in slot 3",
    clues: ["File opens randomly spike to 8 seconds", "Event 153 disk retries have climbed since Tuesday"],
    excl: "Latency is flat and SMART is clean on every member disk", exclWhy: "no disk errors anywhere" },
  { culprit: "Expired TLS certificate",
    gun: "openssl shows the wildcard cert expired 3 days ago",
    clues: ["Only HTTPS services are failing — SSH and RDP are fine", "Browsers show NET::ERR_CERT_DATE_INVALID"],
    excl: "Every endpoint's cert chain validates with weeks to spare", exclWhy: "certificates are all valid" },
  { culprit: "Spanning-tree loop on floor 2",
    gun: "The MAC table is flapping between two uplink ports",
    clues: ["Broadcast storms every ~40 seconds", "Both distribution switches sit at 90% CPU"],
    excl: "MAC tables are stable and switch CPU is idle", exclWhy: "no flapping, no storms" },
  { culprit: "NTP drift breaking Kerberos",
    gun: "The DC's clock is 7 minutes ahead of every client",
    clues: ["Kerberos tickets are failing with clock-skew errors", "Time-sensitive apps started throwing auth errors after the UPS swap"],
    excl: "All clocks are within 1 second of the PDC emulator", exclWhy: "time is in sync plant-wide" },
];

function evidenceBoard() {
  const s = S;
  // build the case: 1 culprit + 2 decoys
  const pool = [...CASES].sort(() => Math.random() - .5);
  const A = pool[0], B = pool[1], C = pool[2];
  const suspects = [A.culprit, B.culprit, C.culprit].sort(() => Math.random() - .5);
  const board = `📌 <b>PINNED TO THE BOARD:</b><br><small>• ${A.gun}<br>• ${A.clues[0]}<br>• ${A.clues[1]}<br>• ${B.excl} <i>(clears someone)</i></small>`;
  const qs = [
    { q: `Four clue cards are pinned up. Which one is the <b>smoking gun</b> — the fact that can't be argued with?`,
      correct: A.gun,
      opts: [A.gun, A.clues[0], A.clues[1], B.excl].sort(() => Math.random() - .5),
      why: `"${A.gun}" is direct physical evidence. The others are symptoms or absence-of-evidence — useful, but a good detective anchors the board on the one fact that's hard to fake.` },
    { q: `One card reads: <i>"${B.excl}"</i>. Which suspect does this <b>rule out</b>?`,
      correct: B.culprit,
      opts: [...suspects].sort(() => Math.random() - .5),
      why: `"${B.excl}" — meaning ${B.exclWhy}. That clears "${B.culprit}" completely. Eliminating suspects is as valuable as accusing them.` },
    { q: `Connections drawn. Red string everywhere. <b>Name the root cause.</b>`,
      correct: A.culprit,
      opts: [...suspects].sort(() => Math.random() - .5),
      why: `${A.gun} — plus "${A.clues[0].toLowerCase()}" and "${A.clues[1].toLowerCase()}". All three arrows point to <b>${A.culprit}</b>, and the only other theory was ruled out by evidence.` },
  ];
  runQuiz("🕵️ EVIDENCE BOARD", `${board}<br><br>Three suspects:<br><small>① ${suspects[0]}<br>② ${suspects[1]}<br>③ ${suspects[2]}</small><br>Work the board: find the smoking gun, clear the innocent, name the culprit.`, qs);
}

// inject into Mike's desk (both dialog variants — DOM-level, proven pattern)
const __origMikeDeskV59 = (typeof mikeDesk === "function") ? mikeDesk : null;
if (__origMikeDeskV59) {
  mikeDesk = function () {
    __origMikeDeskV59.apply(this, arguments);
    const nameEl = document.getElementById("dlg-name");
    const optsEl = document.getElementById("dlg-options");
    if (!nameEl || !optsEl || !nameEl.textContent.includes("MIKE'S DESK")) return;
    if ([...optsEl.children].some(b => b.textContent.includes("Evidence board"))) return;
    const sib = optsEl.querySelector("button");
    const btn = document.createElement("button");
    if (sib) btn.className = sib.className;
    btn.textContent = "🕵️ Evidence board";
    btn.onclick = () => evidenceBoard();
    optsEl.insertBefore(btn, optsEl.children[Math.max(0, optsEl.children.length - 1)] || null);
  };
}

console.log("%c[TechOps Hero] v5.9 The Board loaded — detective evidence board at Mike's desk.", "color:#f472b6");
