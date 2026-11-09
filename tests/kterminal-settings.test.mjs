import test from 'node:test';
import assert from 'node:assert/strict';
import { BACKUP_KEY, exportSettings, previewSettings, importSettings, validateBackup, restoreSettings } from '../recover-settings/settings.mjs';
const origin = 'https://kterminal.site', key = 'techops-hero:revision-f:waldo-continuity:page';
const store = (values = {}) => { const m = new Map(Object.entries(values)); return { getItem: k => m.get(k) ?? null, setItem: (k,v) => m.set(k,v), removeItem: k => m.delete(k), m }; };
const backup = entries => ({ format:'k-terminal-settings', version:1, origin:'https://ninja-ops-guy.github.io', entries });
test('export includes known settings but never native identity, story grants or other site data', () => {
  const s = store({[key]:'92', 'techops:active-profile':'private', 'see-world:progress':'earned', token:'private'});
  assert.deepEqual(exportSettings(s, origin).backup.entries, {[key]:'92'}); assert.equal(s.m.size, 4);
});
test('preview preserves conflicts; selected import backs up old bytes, leaves unrelated state intact', () => {
  const s = store({[key]:'10', native:'run-123'}), b = backup({[key]:'92'}), rows = previewSettings(b,s);
  assert.equal(rows[0].status,'conflict'); assert.equal(s.getItem(key),'10');
  importSettings(b,[key],rows,s,origin); assert.equal(s.getItem(key),'92'); assert.equal(JSON.parse(s.getItem(BACKUP_KEY)).previous[key],'10'); assert.equal(s.getItem('native'),'run-123');
});
test('changed values between preview and import stop the whole import', () => {
  const s = store(), b = backup({[key]:'92'}), rows = previewSettings(b,s); s.setItem(key,'3');
  assert.throws(()=>importSettings(b,[key],rows,s,origin), /changed since preview/); assert.equal(s.getItem(key),'3'); assert.equal(s.getItem(BACKUP_KEY),null);
});
test('unsupported keys, malformed bookmarks, oversized input and executable URLs reject before writes', () => {
  for (const b of [backup({native:'run'}),backup({[key]:'-1'}),backup({'k-terminal:tracks:v3':JSON.stringify([{title:'x',url:'javascript:alert(1)'}])}),backup({[key]:'1'.repeat(1_000_001)})]) assert.throws(()=>validateBackup(b));
});
test('failed backup write preserves all current settings', () => {
  const s = store({[key]:'10'}), b = backup({[key]:'92'}), rows = previewSettings(b,s); s.setItem=()=>{throw Error('quota');};
  assert.throws(()=>importSettings(b,[key],rows,s,origin),/quota/); assert.equal(s.getItem(key),'10');
});
test('mid-import failure rolls back applied entries and retains undo journal', () => {
  const second='k-world:background:v1', s = store({[key]:'10'}), b=backup({[key]:'92',[second]:'true'}), rows=previewSettings(b,s), write=s.setItem;
  s.setItem=(k,v)=>{if(k===second) throw Error('quota');return write(k,v);};
  assert.throws(()=>importSettings(b,[key,second],rows,s,origin),/restored/); assert.equal(s.getItem(key),'10');assert.equal(s.getItem(second),null);assert.ok(s.getItem(BACKUP_KEY));
});

test('undo restores original bytes and refuses to replace settings changed after import', () => {
  const s = store({[key]:'10'}), b = backup({[key]:'92'});
  importSettings(b,[key],previewSettings(b,s),s,origin); assert.equal(restoreSettings(s,origin),1); assert.equal(s.getItem(key),'10');
  importSettings(b,[key],previewSettings(b,s),s,origin); s.setItem(key,'100'); assert.throws(()=>restoreSettings(s,origin),/changed after import/); assert.equal(s.getItem(key),'100');
});
test('soundtrack drafts use the actual raw JSON storage format', () => {
  const draft=JSON.stringify({schemaVersion:1,editions:{},cues:[]});
  const s=store({'k-world:guided-score:draft:v1':draft});
  assert.equal(exportSettings(s,origin).backup.entries['k-world:guided-score:draft:v1'],draft);
});
