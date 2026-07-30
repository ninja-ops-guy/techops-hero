/* ============================================================
   TechOps Hero v7.12 — CAST TRUTH
   The v6.5 cast atlas is gendered per department (Engineering /
   Marketing / HR read female; IT / Manufacturing / Executives /
   Finance / Sales read male), but names were drawn from one mixed
   pool — so an HR cardigan sprite could walk around as "Earl".

   Fix: a reconciler that keeps every NPC's name aligned with the
   sprite their department wears. It runs on day setup and scans
   on a slow timer, so EVERY spawn path (walk-ins, repeats,
   incidents, Friday emergencies, phone tickets, v5x spawns) is
   covered without touching game.js.

   Canon name pools (same 16 names, gender-split; Yuki is unisex):
     male:   Marcus, Tom, Carlos, Earl, Greg, Vikram, Hank, Otis, Yuki
     female: Dana, Priya, Wanda, Nadia, Sue, Betty, Lena, Yuki
   Protected: the IT crew (Mike/Nick/Amit/Brandon/Daniel — IT
   sprite is male, names already correct) and Felicia (own atlas).
   ============================================================ */
(function () {
  "use strict";

  const MALE = ["Marcus", "Tom", "Carlos", "Earl", "Greg", "Vikram", "Hank", "Otis", "Yuki"];
  const FEMALE = ["Dana", "Priya", "Wanda", "Nadia", "Sue", "Betty", "Lena", "Yuki"];
  const DEPT_GENDER = {
    IT: "m", Manufacturing: "m", Executives: "m", Finance: "m", Sales: "m",
    Engineering: "f", Marketing: "f", HR: "f",
  };
  const NAME_GENDER = {};
  MALE.forEach(n => NAME_GENDER[n] = "m");
  FEMALE.forEach(n => { if (!NAME_GENDER[n]) NAME_GENDER[n] = "f"; }); // Yuki stays male-first but valid for both
  const UNISEX = new Set(["Yuki"]);
  const CREW = new Set(["Mike", "Nick", "Amit", "Brandon", "Daniel", "Felicia", "Felicia Cruz"]);

  function genderOf(name) {
    if (UNISEX.has(name)) return null; // valid anywhere
    return NAME_GENDER[name] || null;
  }

  function pickFree(pool, inUse) {
    const free = pool.filter(n => !inUse.has(n));
    const src = free.length ? free : pool;
    return src[Math.floor(Math.random() * src.length)];
  }

  function isFel712(n) {
    try { return typeof isFel === "function" && isFel(n); } catch (e) { return false; }
  }

  function reconcile() {
    if (typeof S === "undefined" || !S || !S.npcs) return 0;
    let fixed = 0;
    const inUse = new Set(S.npcs.map(n => n && n.name).filter(Boolean));
    S.npcs.forEach(n => {
      if (!n || !n.name || !n.dept) return;
      if (CREW.has(n.name) || isFel712(n)) return;
      const want = DEPT_GENDER[n.dept];
      if (!want) return;
      const has = genderOf(n.name);
      if (has === want) return;                    // correct (or unknown name from a mod — leave it)
      if (has === null && NAME_GENDER[n.name]) return; // unisex, fine
      if (has === null) return;                    // custom/unknown name — don't stomp it
      const nn = pickFree(want === "m" ? MALE : FEMALE, inUse);
      inUse.delete(n.name); inUse.add(nn);
      n.name = nn;
      fixed++;
    });
    return fixed;
  }

  // run after every day setup (covers all setupDay spawn paths)
  try {
    if (typeof setupDay === "function") {
      const __origSetup = setupDay;
      setupDay = function () {
        const r = __origSetup.apply(this, arguments);
        try { reconcile(); } catch (e) { }
        return r;
      };
    }
  } catch (e) { console.warn("v712 setupDay wrap", e); }

  // slow scan for mid-day spawns (walk-ins, incidents, emergencies)
  try {
    if (typeof step === "function") {
      const __origStep = step;
      let tick = 0;
      step = function (dt) {
        const r = __origStep.apply(this, arguments);
        if (++tick >= 40) { tick = 0; try { reconcile(); } catch (e) { } }
        return r;
      };
    }
  } catch (e) { console.warn("v712 step wrap", e); }

  window.v712 = { reconcile, DEPT_GENDER, MALE, FEMALE, genderOf };
})();
