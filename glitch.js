// v7.2 glitch-monster enemy atlas (6x 112px cells) — assembled
// The atlas is optional presentation. A transient/missing split chunk must leave
// a valid empty binding so downstream hooks keep their existing fallback art.
const TO_GLITCH = (() => {
  try {
    const parts = [TO_GLITCH_1, TO_GLITCH_2, TO_GLITCH_3, TO_GLITCH_4];
    if (!parts.every(part => typeof part === "string" && part.length > 0)) return "";
    return "data:image/png;base64," + parts.join("");
  } catch (_) {
    return "";
  }
})();
