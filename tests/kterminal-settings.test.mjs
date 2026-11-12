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

const bookmarkLimits = {
  "techops-hero:r11:page": 161,
  "techops-hero:revision-f:page": 315,
  "techops-hero:revision-f:waldo-continuity:page": 316,
  "techops-hero:volume-xiii:revised:page": 40,
  "techops-hero:g:corrected-c18407af88e9:page": 316,
  "techops-hero:xiii-r:corrected-85c2fbd8c80b:page": 49,
  "techops-hero:xiv:corrected-97f16edf9df0:page": 133
};
test('historical and current bookmark bounds remain edition-specific', () => {
  for (const [k, max] of Object.entries(bookmarkLimits)) {
    const pages = new Set([1, max - 1, max]);
    if (k.includes('xiii')) for (let page = 41; page <= 49; page++) pages.add(page);
    for (const page of pages) {
      const entries = { [k]: String(page) }, source = store(entries);
      const exported = exportSettings(source, backup({}).origin).backup.entries;
      if (page <= max) {
        assert.deepEqual(exported, entries);
        const b = backup(entries), target = store();
        importSettings(b, [k], previewSettings(b, target), target, origin);
        assert.equal(target.getItem(k), String(page));
      } else {
        assert.deepEqual(exported, {});
        assert.throws(() => validateBackup(backup(entries)));
      }
      assert.equal(source.getItem(k), String(page));
    }
    for (const value of ['0', '-1', '01', '1.5', '1e1', ' 1', '1 ', 'NaN', 'Infinity', '', String(max + 1), 1, null]) {
      const b = backup({ [k]: value }), target = store({ [k]: '1' });
      assert.throws(() => importSettings(b, [k], [{ key: k, before: '1' }], target, origin));
      assert.equal(target.getItem(k), '1');
      assert.equal(target.getItem(BACKUP_KEY), null);
    }
  }
});
test('current bookmarks preserve conflicts, require selection and support undo', () => {
  for (const k of ["techops-hero:g:corrected-c18407af88e9:page","techops-hero:xiii-r:corrected-85c2fbd8c80b:page","techops-hero:xiv:corrected-97f16edf9df0:page"]) {
    const other = 'k-world:background:v1', target = store({ [k]: '7', native: 'run' });
    const b = backup({ [k]: String(bookmarkLimits[k]), [other]: 'true' });
    const rows = previewSettings(b, target);
    assert.equal(rows.find(r => r.key === k).status, 'conflict');
    importSettings(b, rows.filter(r => r.status === 'missing').map(r => r.key), rows, target, origin);
    assert.equal(target.getItem(k), '7');
    importSettings(b, [k], previewSettings(b, target), target, origin);
    assert.equal(target.getItem(k), String(bookmarkLimits[k]));
    restoreSettings(target, origin);
    assert.equal(target.getItem(k), '7');
    assert.equal(target.getItem('native'), 'run');
  }
});
test('unknown edition keys and authoritative progress remain excluded', () => {
  for (const k of ['techops-hero:xiii-r:unknown:page', 'techops-hero:g:unknown:page',
    'techops:active-profile', 'see-world:progress', 'native', '__proto__', 'constructor']) {
    const entries = Object.fromEntries([[k, '1']]), source = store(entries);
    assert.deepEqual(exportSettings(source, origin).backup.entries, {});
    const target = store({ native: 'existing' });
    assert.throws(() => importSettings(backup(entries), [k], [{ key: k, before: null }], target, origin));
    assert.equal(target.getItem('native'), 'existing');
    assert.equal(target.getItem(BACKUP_KEY), null);
    assert.equal(source.getItem(k), '1');
  }
});
