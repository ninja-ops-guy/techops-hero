import { exportSettings } from './settings.mjs';
const status = document.getElementById('recovery-status');
document.getElementById('export-settings').onclick = () => {
  try {
    if (location.origin !== 'https://ninja-ops-guy.github.io') throw Error('Open this recovery page on the original game origin.');
    const {backup, skipped} = exportSettings(localStorage, location.origin);
    const count = Object.keys(backup.entries).length;
    if (!count) { status.textContent = `No supported settings found in this browser.${skipped.length ? ' Invalid settings left untouched: ' + skipped.join(', ') : ''}`; return; }
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)], {type:'application/json'}));
    const a = document.createElement('a'); a.href=url; a.download='k-terminal-settings.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
    status.textContent=`Exported ${count} settings. Import this file at kterminal.site/recover/. Keep it private; it may contain an unsent feedback draft. Original data is unchanged.${skipped.length ? ' Invalid settings left untouched: ' + skipped.join(', ') : ''}`;
  } catch(e) {status.textContent=e.message;}
};
