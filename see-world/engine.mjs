import { CAMPAIGN_IDS, campaignById, nodeById } from './campaigns.mjs';
export const SAVE_KEY = 'see-world:campaigns:v1';
export const SCHEMA = 1;
export const REVISION = '2026-11-07-a';
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
export function newRun(id) {
  const campaign = campaignById(id);
  if (!campaign) throw new Error('Unknown campaign.');
  return { id, node: campaign.start, stats: { ...campaign.stats }, flags: {}, history: [], ended: false };
}
export function availability(run, option) {
  for (const [key, value] of Object.entries(option.requires || {})) {
    if (!own(run.flags, key) || run.flags[key] !== value) return { allowed: false, reason: 'A required story condition has not been established.' };
  }
  const labels = campaignById(run.id).labels;
  for (const [key, value] of Object.entries(option.minimum || {})) {
    if ((run.stats[key] ?? 0) < value) return { allowed: false, reason: `Requires ${labels[key] || key} ${value}.` };
  }
  return { allowed: true, reason: '' };
}
export function choose(run, choiceId, expectedNode = run.node) {
  const campaign = campaignById(run.id), current = campaign && nodeById(campaign, run.node);
  if (!current || expectedNode !== run.node || run.ended || run.history.length >= 128) throw new Error('This decision is no longer available.');
  const option = current.choices.find(c => c.id === choiceId);
  if (!option || !availability(run, option).allowed) throw new Error('That choice is not available on this path.');
  const destination = nodeById(campaign, option.to);
  if (!destination) throw new Error('Missing story destination.');
  const stats = { ...run.stats };
  for (const [key, delta] of Object.entries(option.effects || {})) {
    if (!own(stats, key) || !Number.isFinite(delta)) throw new Error('Invalid campaign stat effect.');
    stats[key] = Math.max(0, Math.min(99, stats[key] + delta));
  }
  return { id: run.id, node: destination.id, stats, flags: { ...run.flags, ...option.set },
    history: [...run.history, { node: current.id, choice: option.id }], ended: !!destination.ending };
}
export function replay(id, history) {
  if (!Array.isArray(history) || history.length > 128) throw new Error('Invalid or oversized decision history.');
  let run = newRun(id);
  for (const step of history) {
    if (!isRecord(step) || typeof step.node !== 'string' || typeof step.choice !== 'string' || step.node.length > 80 || step.choice.length > 80) throw new Error('Malformed decision record.');
    run = choose(run, step.choice, step.node);
  }
  return run;
}
export function encode(runs) {
  const histories = {};
  for (const id of CAMPAIGN_IDS) if (own(runs, id)) histories[id] = replay(id, runs[id].history).history;
  return JSON.stringify({ schema: SCHEMA, revision: REVISION, runs: histories });
}
export function decode(raw) {
  if (typeof raw !== 'string' || raw.length > 200000) throw new Error('Save file is too large or is not text.');
  const data = JSON.parse(raw);
  if (!isRecord(data) || data.schema !== SCHEMA || data.revision !== REVISION || !isRecord(data.runs)) throw new Error('Unsupported save version. Keep the original file for migration.');
  const runs = {};
  for (const [id, history] of Object.entries(data.runs)) {
    if (!CAMPAIGN_IDS.includes(id)) throw new Error('Unknown campaign in save.');
    runs[id] = replay(id, history);
  }
  return runs;
}
export function consequence(campaign, before, after) {
  const parts = Object.keys(before.stats).filter(k => before.stats[k] !== after.stats[k]).map(k => `${campaign.labels[k]} ${after.stats[k] > before.stats[k] ? '+' : ''}${after.stats[k] - before.stats[k]}`);
  return parts.length ? parts.join(' · ') : 'Story state recorded.';
}
