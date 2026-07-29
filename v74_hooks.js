// v7.4 "Aftermath": the story remembers what you chose.
//  - Story Gallery: every v7.3 beat (days 5/7/8/9/10 + endings) becomes a
//    gallery entry that replays the actual animated panel cutscene, and v7.3's
//    legacy 2-arg unlock calls are normalized into full gallery defs.
//  - Epilogues: on day 11+, a closing scene keyed to the ending you earned.
//  - Post-arc Felicia: her presence (or absence) in the world reflects the
//    choice you made on the roof.
(function () {
  function arc() { try { return window.v73 ? v73.arc() : null; } catch (e) { return null; } }
  function cine(slides, onDone) { try { if (window.v73) v73.cine(slides, onDone); else if (onDone) onDone(); } catch (e) { if (onDone) onDone(); } }

  // ================= story gallery =================
  // slide decks mirroring the v7.3 scenes (panel indices into TO_PANELS)
  const DECKS = {
    d5: {
      icon: "🎻", title: "Day 5 — The Woman on the Wing",
      body: "The viral livestream: 15.8 million people watched a violinist on the wing. You recognized the badge.",
      slides: () => [
        { img: 1, cap: "DAY 5 — MONDAY. Three printer outages, VPN down again... who keeps unplugging the label printer?!", zoom: "in" },
        { img: 0, cap: "LIVE — “Violinist Plays On Top of Flying Aircraft.” 15.8 million views.", zoom: "in" },
        { img: 1, cap: "Felicia Cruz. The Violinist. Everyone knows her... except me.", zoom: "out" },
      ]
    },
    d7: {
      icon: "🪪", title: "Day 7 — The Logs",
      body: "Badge 41782 — ENG-NET: GRANTED. CAM 07, 18:21. She knows exactly where she's going.",
      slides: () => [
        { img: 2, cap: "DAY 7. Badge 41782 — FELICIA — ENG-NET: GRANTED. HANGAR ACCESS: GRANTED. ...Deleted entries recovered.", zoom: "in" },
        { img: 2, cap: "CAM 07 — ENG HALL, 18:21. She knows exactly where she's going.", zoom: "in", pan: -1 },
      ]
    },
    d8: {
      icon: "🌇", title: "Day 8 — The Rooftop",
      body: "“You sound like you're saying goodbye.” — “hm.” Practice. Perfect. Protect.",
      slides: () => [
        { img: 3, cap: "DAY 8, 16:00. The roof door was propped open. She plays like the shift never happened.", zoom: "in" },
        { img: 3, cap: "“You sound like you're saying goodbye.” — “hm.”", zoom: "out", pan: 1 },
      ]
    },
    d9: {
      icon: "💠", title: "Day 9 — PROJECT ORPHEUS",
      body: "Clearance: CROWN JEWEL. ACCESS DENIED. — “Looking for something, Mike?”",
      slides: () => [
        { img: 4, cap: "PROJECT ORPHEUS. Clearance: CROWN JEWEL. ACCESS DENIED.", zoom: "in" },
        { img: 4, cap: "Why would this be locked away? — “Looking for something, Mike?”", zoom: "out", pan: 1 },
      ]
    },
    d10: {
      icon: "🌧️", title: "Day 10 — The Choice",
      body: "Rain on the roof. “I need the Crown Jewel archive to force the truth into the open before the storm does. Walk with me.”",
      slides: () => [
        { img: 5, cap: "DAY 10 — RAIN. “What are you doing, Felicia?” — “Getting what they buried.”", zoom: "out", pan: -1 },
        { img: 5, cap: "“I need the Crown Jewel archive to force the truth into the open before the storm does. Walk with me.”", zoom: "out", pan: 1 },
      ]
    },
    ending_A: {
      icon: "⚖️", title: "Ending A — Perfect Employee",
      body: "You called it in. She didn't run. Months later the storm came, and the truth stayed buried.",
      slides: () => [{ title: true, cap: "<b>ENDING A — PERFECT EMPLOYEE.</b><br><br>She chose the city. You chose the company. The system didn't change — it just got stronger." }]
    },
    ending_B: {
      icon: "💚", title: "Ending B — Let's Save the City",
      body: "At dawn the evacuation model was on every screen in New Haven, and the city moved before the storm did.",
      slides: () => [{ title: true, cap: "<b>ENDING B — LET'S SAVE THE CITY.</b><br><br>The real threat was never a hacker — it was a system allowed to decide who's worth saving." }]
    },
    ending_TRUE: {
      icon: "🤝", title: "True Ending — New Haven Counts On Us",
      body: "You walked in beside her. Orpheus doesn't get to decide anymore.",
      slides: () => [{ title: true, cap: "<b>TRUE ENDING — NEW HAVEN COUNTS ON US.</b><br><br>Someone who reads the logs and someone who opens the doors finally want the same thing." }]
    },
  };

  // normalize v7.3's (id, title) calls into full (id, icon, title, body) defs,
  // and register the extra story beats v7.3 didn't unlock.
  if (window.unlockGallery) {
    const __origUnlock74 = window.unlockGallery;
    window.unlockGallery = function (id, icon, title, body) {
      const d = DECKS[id];
      if (d && (body === undefined || body === null)) return __origUnlock74(id, d.icon, d.title, d.body);
      return __origUnlock74.apply(this, arguments);
    };
  }

  // replay actual panel cutscenes from the gallery instead of the generic card
  if (window.v67OpenGallery) {
    const __origGal74 = window.v67OpenGallery;
    window.v67OpenGallery = function () {
      const r = __origGal74.apply(this, arguments);
      try {
        const g = document.getElementById("v67-gallery");
        if (g) g.querySelectorAll(".v67-gal-item").forEach(btn => {
          const d = DECKS[btn.dataset.id];
          if (!d) return;
          btn.onclick = () => {
            g.classList.add("hidden");
            cine(d.slides(), () => toast(`🎬 ${d.title} — replay complete`));
          };
        });
      } catch (e) { }
      return r;
    };
  }

  // mark story beats as gallery-unlockable when the player passes them
  const __origHUD74 = updateHUD;
  updateHUD = function () {
    const r = __origHUD74.apply(this, arguments);
    try {
      const a = arc(); if (a && window.unlockGallery) {
        if (a.seen.d7 && !a.seen.g7) { a.seen.g7 = 1; unlockGallery("d7"); }
        if (a.seen.d8roof && !a.seen.g8) { a.seen.g8 = 1; unlockGallery("d8"); }
        if (a.seen.d9cine && !a.seen.g9) { a.seen.g9 = 1; unlockGallery("d9"); }
        if (a.seen.d10fin && !a.seen.g10) { a.seen.g10 = 1; unlockGallery("d10"); }
      }
    } catch (e) { }
    return r;
  };

  // ================= epilogues (day 11+) =================
  const EPI = {
    A: [
      { img: 5, cap: "DAY 11. The roof is chained shut now. New lock, new camera.", zoom: "out" },
      { img: 4, cap: "Company memo: “Contractor access review complete. AeroTech thanks you for your vigilance.”", zoom: "in" },
      { img: 2, cap: "Weeks later, the storm makes the news. The south districts flood. The logs stay perfect.", zoom: "out", pan: 1 },
      { title: true, cap: "<b>EPILOGUE — PERFECT EMPLOYEE.</b><br><br>You kept the company safe. Some nights you still hear the violin." },
    ],
    B: [
      { img: 3, cap: "DAY 11. The roof door is propped open again — by her, from the outside, with a brick and a grin.", zoom: "in" },
      { img: 0, cap: "Chopper footage: buses rolling through the south districts at dawn. The city moved first.", zoom: "out", pan: 1 },
      { img: 5, cap: "“They'll patch the hole we used. They can't patch what the city saw.”", zoom: "in" },
      { title: true, cap: "<b>EPILOGUE — LET'S SAVE THE CITY.</b><br><br>New Haven counts the cost of the truth. It comes out ahead." },
    ],
    TRUE: [
      { img: 3, cap: "DAY 11. Two coffee mugs on the roof ledge. One says ROOT.", zoom: "in" },
      { img: 4, cap: "The inquiry opens with the archive on the table. Orpheus's decisions have authors now.", zoom: "out" },
      { img: 3, cap: "She tunes. You read the logs. The city hums below like a held chord.", zoom: "out", pan: -1 },
      { title: true, cap: "<b>EPILOGUE — NEW HAVEN COUNTS ON US.</b><br><br>The duet continues." },
    ],
  };
  function epilogue(id) {
    const deck = EPI[id] || EPI.TRUE;
    cine(deck, () => toast("🎬 Epilogue added to the gallery"));
    try { unlockGallery("epi_" + id, "🌄", "Epilogue — " + (id === "A" ? "Perfect Employee" : id === "B" ? "Let's Save the City" : "New Haven Counts On Us"), "The days after the choice."); } catch (e) { }
  }

  // ================= post-arc Felicia =================
  function day11Felicia() {
    const a = arc(); if (!a) return;
    if (a.choice === "A") {
      dlg("Nick — IT", "Marketing's desk is cleaned out. Badge deactivated, plant access revoked. Whatever she was doing... it's done. Hey — you okay? You look like you lost a bet.", [
        { t: "“Just backlog.”", f: () => { closeDlg(); toast("📭 Felicia's station sits empty in Marketing."); } },
        { t: "“Yeah. I'm fine.”", f: closeDlg },
      ]);
    } else if (a.choice === "B" || a.choice === "TRUE") {
      cine([
        { img: 3, cap: "16:00. The roof again. She plays — not a goodbye this time. A beginning.", zoom: "in" },
      ], () => {
        dlg("Felicia — rooftop", "“The storm's still coming either way. But now the city gets to choose what it's worth.” She hands you a second mug. It says <b>BACKUP</b>.", [
          { t: "“Practice. Perfect. Protect.”", f: () => { closeDlg(); toast("🎻 A new duet tradition begins."); } },
          { t: "Back to the queue.", f: closeDlg },
        ]);
      });
    }
  }

  // scheduling: epilogue fires on day 11+ mornings; post-arc beat at day-11 16:00
  const __origSetupDay74 = setupDay;
  setupDay = function () {
    const r = __origSetupDay74.apply(this, arguments);
    try {
      const a = arc(), d = S.day;
      if (a && a.choice && d >= 11 && !a.seen.epilogue) {
        a.seen.epilogue = true;
        setTimeout(() => epilogue(a.choice), 2600);
      }
    } catch (e) { }
    return r;
  };
  const __origHUD74b = updateHUD;
  updateHUD = function () {
    const r = __origHUD74b.apply(this, arguments);
    try {
      const a = arc();
      if (!a || !a.choice) return r;
      if (S.inBattle || S.inDialog || S.room || document.getElementById("v73-cine")) return r;
      if (S.day >= 11 && S.clock >= 16 * 60 && !a.seen.fel11) { a.seen.fel11 = true; day11Felicia(); }
    } catch (e) { }
    return r;
  };

  window.v74 = { DECKS, EPI, epilogue, day11Felicia };
  console.log("[v7.4] Aftermath loaded");
})();
