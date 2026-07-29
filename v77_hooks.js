// v7.7 "Cast & Portraits" — certification polish pass, phase 2. Upgrades
// dialogue to visual-novel grade: large illustrated portraits cropped from the
// v7.3 story-panel art (reference style, zero new assets), expression/mood
// variants via graded filters, talk animation synced to the typewriter, and a
// hard no-leak guarantee (the v6.7 Felicia-portrait bug can never regress).
(function () {
  const PANELS = (typeof TO_PANELS !== "undefined") ? TO_PANELS : [];
  const imgs = PANELS.map(src => { const i = new Image(); i.src = src; return i; });
  // crops as [panelIndex, x, y, w, h] in fractions of the 512×327 panel
  const ART = {
    felicia: { p: 5, c: [0.02, 0.02, 0.46, 0.96] }, // standoff panel, left half
    mike: { p: 5, c: [0.52, 0.02, 0.46, 0.96] },    // standoff panel, right half
  };
  // expression/mood variants — graded filters over the base crop
  const MOODS = {
    neutral: "",
    soft: "brightness(1.12) saturate(1.1)",
    guarded: "contrast(1.15) brightness(.92)",
    resolute: "contrast(1.1) saturate(1.05)",
    storm: "brightness(.85) contrast(1.1) hue-rotate(-10deg)",
    warm: "brightness(1.08) sepia(.25)",
  };
  const cache = {};
  function cropFor(who) {
    if (cache[who] !== undefined) return cache[who];
    const a = ART[who]; if (!a) return (cache[who] = null);
    const im = imgs[a.p];
    if (!im || !im.complete || !im.naturalWidth) return (cache[who] = null);
    const [fx, fy, fw, fh] = a.c;
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const x = c.getContext("2d");
    // cover-fit the crop region into the square portrait
    const sx = fx * im.naturalWidth, sy = fy * im.naturalHeight, sw = fw * im.naturalWidth, sh = fh * im.naturalHeight;
    const s = Math.max(256 / sw, 256 / sh), dw = sw * s, dh = sh * s;
    x.drawImage(im, sx, sy, sw, sh, (256 - dw) / 2, (256 - dh) / 2 - (dh - 256) * .35, dw, dh); // bias upward: faces
    return (cache[who] = c.toDataURL("image/png"));
  }
  function speakerOf(name) {
    const n = (name || "").toLowerCase();
    if (n.includes("felicia")) return "felicia";
    if (n.startsWith("mike")) return "mike";
    return null;
  }
  function moodFor(who) {
    const s = S, day = s ? s.day : 1;
    if (day >= 10) return "storm";
    if (day === 8) return who === "felicia" ? "soft" : "warm";
    if (day === 9) return "resolute";
    return "neutral";
  }

  function injectPortrait(name) {
    strip();
    const who = speakerOf(name); if (!who) return;
    const url = cropFor(who); if (!url) return;
    const box = document.getElementById("dialogue");
    if (!box) return;
    box.classList.add("v77-hasbig");
    const im = document.createElement("img");
    im.className = "v77-portrait";
    im.src = url; im.alt = "";
    im.style.filter = MOODS[moodFor(who)] || "";
    box.insertBefore(im, box.firstChild);
    window.v77.lastSpeaker = who;
    window.v77.count++;
  }
  function strip() {
    document.querySelectorAll("#dialogue .v77-portrait").forEach(e => e.remove());
    const box = document.getElementById("dialogue");
    if (box) box.classList.remove("v77-hasbig");
  }

  const __origDlg77 = dlg;
  dlg = function (name, text, options) {
    const r = __origDlg77.apply(this, arguments);
    try { injectPortrait(name); } catch (e) { }
    return r;
  };
  const __origClose77 = closeDlg;
  closeDlg = function () { strip(); return __origClose77.apply(this, arguments); };

  // talk animation: subtle life while the typewriter runs
  const dt = document.getElementById("dlg-text");
  if (dt) {
    let talkT = 0;
    new MutationObserver(() => {
      const im = document.querySelector("#dialogue .v77-portrait");
      if (!im) return;
      im.classList.add("v77-talk");
      clearTimeout(talkT);
      talkT = setTimeout(() => { const i2 = document.querySelector("#dialogue .v77-portrait"); if (i2) i2.classList.remove("v77-talk"); }, 260);
    }).observe(dt, { childList: true, characterData: true, subtree: true });
  }

  const st = document.createElement("style");
  st.textContent = `
#dialogue.v77-hasbig{padding-left:150px;min-height:132px}
#dialogue .v77-portrait{position:absolute;left:8px;top:50%;transform:translateY(-50%);width:128px;height:128px;
 object-fit:cover;border:2px solid #46536e;border-radius:10px;box-shadow:0 6px 24px #000a, 0 0 0 3px #0a0d18;
 image-rendering:auto;transition:transform .18s ease}
#dialogue .v77-portrait.v77-talk{transform:translateY(-50%) scale(1.02)}
#dialogue.v77-hasbig .v64-portrait,#dialogue.v77-hasbig .v67-portrait{display:none}`;
  document.head.appendChild(st);

  window.v77 = { cropFor, speakerOf, moodFor, strip, count: 0, lastSpeaker: null };
  console.log("[v7.7] Cast & Portraits loaded");
})();
