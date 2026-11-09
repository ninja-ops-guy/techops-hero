import {chooseSaveOrigin, portfolioUrl, gameUrl} from './origin-routes.mjs';
await chooseSaveOrigin();
for (const a of document.querySelectorAll('a[href="/techops-hero/"]')) a.href = gameUrl(location.hostname);
for (const a of document.querySelectorAll('a[href="../#/links"]')) a.href = portfolioUrl('links');
// Help remains usable even when the optional enhancement or reader cannot load.
const help = document.getElementById('player-help');
document.getElementById('help-open').onclick = () => help.showModal();
document.getElementById('help-close').onclick = () => help.close();
// Native dialog provides modal semantics; explicitly wrap keyboard focus so Tab
// does not leave the guide for browser chrome on engines with different behavior.
help.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const controls = [...help.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),[tabindex]:not([tabindex="-1"])')].filter(e => e.getClientRects().length);
  const first = controls[0], last = controls.at(-1);
  if (!first) return;
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
// Keep loading recovery separate from the authority-owning linked application.
try {
  await import('./linked-app.mjs');
  try {
    await import('./presentation.mjs');
    // A missing first-use cache is onboarding, not a damaged-save warning.
    const clarifyFirstVisit = () => {
      for (const p of document.querySelectorAll('.connection-card > p')) {
        if (p.textContent === 'Missing or oversized record.') p.textContent = 'Your game has not been connected in this browser yet.';
      }
    };
    new MutationObserver(clarifyFirstVisit).observe(document.getElementById('content'), {childList:true});
    clarifyFirstVisit();
  } catch (error) { console.warn('Presentation enhancement unavailable; the story reader remains active.', error); }
} catch (error) {
  const main = document.getElementById('content');
  main.replaceChildren();
  const title = document.createElement('h1'); title.textContent = 'The story reader could not open.';
  const text = document.createElement('p'); text.textContent = 'Your saved progress has not been changed. Check your connection and try again, or return to the media hub.';
  const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'primary'; retry.textContent = 'Try again'; retry.onclick = () => location.reload();
  const link = document.createElement('a'); link.href = portfolioUrl('links'); link.target = '_top'; link.textContent = 'Back to the media hub'; link.className = 'secondary';
  main.append(title, text, retry, link); main.classList.add('boot-message');
  document.getElementById('storage-status').textContent = 'The reader is unavailable. No progress was imported, reset, or awarded.';
  console.warn('Story reader load failed.', error);
}
