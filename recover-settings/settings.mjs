// Exact allowlist: never accept game identities, snapshots, milestones or story grants.
export const KEYS = Object.freeze({
  'techops-hero:volume-xiii:revised:page': 'Volume XIII bookmark',
  'techops-hero:revision-f:waldo-continuity:page': 'Revision F bookmark',
  'techops-hero:revision-f:page': 'Earlier Revision F bookmark',
  'techops-hero:r11:page': 'Legacy comic bookmark',
  'k-terminal:tracks:v3': 'Terminal playlist',
  'k-terminal:audio-settings:v1': 'Terminal preferences',
  'k-world:library:v6': 'K World playlist',
  'k-world:recent:v6': 'Recently played tracks',
  'k-world:prefs:v6': 'K World preferences',
  'k-world:background:v1': 'Background listening preference',
  'k-world:guided-preview:v1': 'Local soundtrack preview',
  'k-world:guided-score:draft:v1': 'Soundtrack editor draft',
  'k-terminal:project-comment:v1': 'Unsent feedback draft',
});
export const BACKUP_KEY = 'k-terminal:recovery-backup:v1';
export const MAX_SIZE = 1_000_000;
const origins = ['https://ninja-ops-guy.github.io', 'https://kterminal.site', 'https://www.kterminal.site'];
const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
function trackURL(value) {
  try { const u = new URL(value); return u.protocol === 'https:' && ['soundcloud.com', 'www.soundcloud.com', 'api.soundcloud.com'].includes(u.hostname) && !u.username && !u.password && !u.port; } catch { return false; }
}
function valueOK(key, value) {
  if (typeof value !== 'string' || value.length > 300_000) return false;
  const pages = { 'techops-hero:volume-xiii:revised:page': 40, 'techops-hero:revision-f:waldo-continuity:page': 316, 'techops-hero:revision-f:page': 315, 'techops-hero:r11:page': 161 };
  if (key.endsWith(':page')) return /^[1-9]\d{0,3}$/.test(value) && Number(value) <= pages[key];
  // The editor retains unfinished JSON as plain text; restore it to its textarea only.
  if (key === 'k-world:guided-score:draft:v1') return value.length <= 150_000;
  let data; try { data = JSON.parse(value, (k, v) => { if (['__proto__', 'constructor', 'prototype'].includes(k)) throw Error('Unsafe property'); return v; }); } catch { return false; }
  if (key === 'k-world:background:v1') return typeof data === 'boolean';
  if (key === 'k-terminal:tracks:v3' || key === 'k-world:library:v6') {
    return Array.isArray(data) && data.length <= 1000 && data.every(t => isObject(t) && typeof t.title === 'string' && t.title.length <= 1000 && trackURL(t.url));
  }
  if (key === 'k-world:recent:v6') return Array.isArray(data) && data.length <= 100 && data.every(trackURL);
  if (key === 'k-world:guided-preview:v1') return isObject(data) && data.schemaVersion === 1 && isObject(data.editions) && Array.isArray(data.cues) && data.cues.length <= 500;
  if (key === 'k-terminal:project-comment:v1') return isObject(data) && typeof data.title === 'string' && data.title.length <= 80 && typeof data.message === 'string' && data.message.length <= 1000;
  return isObject(data) && Object.values(data).every(v => ['string', 'number', 'boolean'].includes(typeof v) && (typeof v !== 'number' || Number.isFinite(v)));
}
export function validateBackup(input) {
  if (!isObject(input) || input.format !== 'k-terminal-settings' || input.version !== 1 || !origins.includes(input.origin) || !isObject(input.entries)) throw Error('Use a K Terminal settings export from a supported origin.');
  if (JSON.stringify(input).length > MAX_SIZE || Object.keys(input.entries).length > Object.keys(KEYS).length) throw Error('Settings file is too large.');
  for (const [key, value] of Object.entries(input.entries)) {
    if (!Object.hasOwn(KEYS, key) || !valueOK(key, value)) throw Error(`Unsupported or invalid setting: ${key}. No settings were imported.`);
  }
  return { format: input.format, version: 1, origin: input.origin, entries: { ...input.entries } };
}
export function exportSettings(storage, origin) {
  if (!origins.includes(origin)) throw Error('Recovery is available only on the original game origin and kterminal.site.');
  const entries = {}, skipped = [];
  for (const key of Object.keys(KEYS)) { const value = storage.getItem(key); if (value !== null) { if (valueOK(key, value)) entries[key] = value; else skipped.push(KEYS[key]); } }
  return { backup: validateBackup({ format: 'k-terminal-settings', version: 1, origin, entries }), skipped };
}
export function previewSettings(input, storage) {
  const backup = validateBackup(input);
  return Object.entries(backup.entries).map(([key, value]) => {
    const before = storage.getItem(key);
    return { key, label: KEYS[key], value, before, status: before === null ? 'missing' : before === value ? 'same' : 'conflict' };
  });
}
export function importSettings(input, selected, rows, storage, origin) {
  const backup = validateBackup(input);
  if (!origins.includes(origin)) throw Error('Import is not enabled on this origin.');
  const keys = [...new Set(selected)];
  if (!keys.length) throw Error('Select at least one setting.');
  const previous = {};
  for (const key of keys) {
    const row = rows.find(r => r.key === key);
    if (!Object.hasOwn(backup.entries, key) || !row || storage.getItem(key) !== row.before) throw Error('Settings changed since preview. Choose the file again before importing.');
    previous[key] = row.before;
  }
  const journal = { format: 'k-terminal-recovery-journal', version: 1, origin, createdAt: new Date().toISOString(), previous, applied: Object.fromEntries(keys.map(key => [key, backup.entries[key]])) };
  // Fail closed if the undo journal cannot be written. Source data is never removed.
  storage.setItem(BACKUP_KEY, JSON.stringify(journal));
  const applied = [];
  try {
    for (const key of keys) { storage.setItem(key, backup.entries[key]); applied.push(key); }
  } catch {
    const failed = [];
    for (const key of applied.reverse()) {
      try { if (previous[key] === null) storage.removeItem(key); else storage.setItem(key, previous[key]); } catch { failed.push(key); }
    }
    throw Error(failed.length ? `Import interrupted; ${failed.length} settings could not be restored. Download the pre-import backup. Keep this browser data.` : 'Storage could not finish the import. The selected settings were restored.');
  }
  return { count: keys.length, journal };
}

export function restoreSettings(storage, origin) {
  const journal = JSON.parse(storage.getItem(BACKUP_KEY) || 'null');
  if (!isObject(journal) || journal.format !== 'k-terminal-recovery-journal' || journal.version !== 1 || journal.origin !== origin || !isObject(journal.previous) || !isObject(journal.applied)) throw Error('No valid pre-import backup for this origin.');
  validateBackup({ format: 'k-terminal-settings', version: 1, origin, entries: journal.applied });
  const entries = Object.entries(journal.previous);
  if (!entries.length || entries.length !== Object.keys(journal.applied).length) throw Error('Invalid backup.');
  for (const [key, value] of entries) {
    if (!Object.hasOwn(journal.applied, key) || (value !== null && typeof value !== 'string')) throw Error('Invalid backup.');
    if (storage.getItem(key) !== journal.applied[key]) throw Error('A setting changed after import. Download the backup instead; newer settings were kept.');
  }
  const restored = [];
  try {
    for (const [key, value] of entries) { if (value === null) storage.removeItem(key); else storage.setItem(key, value); restored.push(key); }
  } catch {
    let failed = false;
    for (const key of restored) { try { storage.setItem(key, journal.applied[key]); } catch { failed = true; } }
    throw Error(failed ? 'Restore interrupted. Download the backup and keep this browser data.' : 'Restore could not finish. Imported values were retained.');
  }
  return entries.length;
}
