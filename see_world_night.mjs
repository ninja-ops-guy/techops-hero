/* Night Walker owns native eligibility. See World supplies replayable decisions. */
const RULES = "see-world/linked-1";
const CONTENT = "2026-11-07-a";
const sections = {
  "felicia-signal": { title: "Felicia signal investigation", facts: ["act_3", "violinist_revealed"], missing: "rooftop relay investigation" },
  "felicia-preparation": { title: "Felicia preparation", facts: ["act_3", "violinist_revealed"], missing: "Hangar Three preparation encounter" },
  "k-memory": { title: "K memory anchor", facts: ["orbital_signal_found", "k_seen"], missing: "memory-anchor investigation" },
  "k-boundary": { title: "K chosen boundary", facts: ["k_freed", "crew_returned_to_earth"], missing: "post-return boundary scene" },
  "waldo-companion": { title: "Waldo companion coordination", facts: ["waldo_introduced", "k_freed"], missing: "companion coordination encounter" },
  "waldo-recovery": { title: "Waldo recovery", facts: ["waldo_freed", "crew_returned_to_earth"], missing: "recovery encounter" },
  "iona-coordination": { title: "Low Quarter crew coordination", facts: ["red_arrest_disclosed"], missing: "Mara’s crew coordination encounter" },
  "iona-ledger": { title: "Low Quarter ledger follow-up", facts: ["red_arrest_disclosed"], missing: "ledger verification encounter" },
  "iona-burn": { title: "Low Quarter underground route", facts: ["red_arrest_disclosed"], missing: "underground route after the depot burns" },
  "iona-workshop": { title: "Low Quarter workshop", facts: ["red_arrest_disclosed"], missing: "workshop defense and access rules" },
  "iona-witness": { title: "Low Quarter witness route", facts: ["red_arrest_disclosed"], missing: "witness escort and archive access rules" }
};

export async function inspect(state, storage, loadBridge = () => import("/theemrld-portfolio/see-world/linked.mjs")) {
  const native = globalThis.TechOpsLinkedProgression;
  if (!native || !state?._linked || native.excluded(state) || native.debug()) return null;
  const bridge = await loadBridge();
  if (bridge.RULES !== RULES || bridge.SOURCE !== native.SOURCE) return null;
  if (!native.requireCurrent(storage, state, "techops_save")) return null;
  const snapshot = native.current(storage);
  if (!native.sameRun(state._linked, snapshot)) return null;
  const linked = bridge.readLinked(storage, snapshot);
  const grants = bridge.earnedSections(linked).filter(grant =>
    native.sameRun(snapshot, { version: 1, ...grant }) &&
    grant.rules === RULES && grant.source === native.SOURCE && grant.content === CONTENT &&
    grant.sequence <= snapshot.sequence && grant.sourceRevision.profile <= snapshot.sourceRevision.profile &&
    grant.sourceRevision.campaign <= snapshot.sourceRevision.campaign &&
    grant.decisionRevision === linked.revision && Object.hasOwn(sections, grant.id));
  return { timeline: bridge.timeline(linked), sections: grants.map(grant => {
    const section = sections[grant.id];
    const nativeReady = section.facts.every(fact => snapshot.milestones.includes(fact));
    // No authored entry point exists for these section IDs yet.
    return { id: grant.id, title: section.title, missing: section.missing, nativeReady, available: false };
  }) };
}
