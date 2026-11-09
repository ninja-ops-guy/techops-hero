/** Presentation only. Never imports campaign manifests, reads game saves, enables
 * gated controls, rewrites narrative text, or changes progress. The linked reader
 * remains the sole authority. Enhancements are rebuilt only when it renders. */
const root = document.documentElement;
const content = document.getElementById('content');
const help = document.getElementById('player-help');
const prefsKey = 'see-world:reader-ui:v1';
const create = (tag, text = '', cls = '') => { const node = document.createElement(tag); node.textContent = text; node.className = cls; return node; };
let prefs = { large: false, focus: false };
try { const stored = JSON.parse(localStorage.getItem(prefsKey) || 'null'); if (stored && typeof stored.large === 'boolean' && typeof stored.focus === 'boolean') prefs = { large: stored.large, focus: stored.focus }; } catch { /* Reading controls work without storage. */ }
function applyPreferences() {
  root.dataset.readingSize = prefs.large ? 'large' : 'standard';
  root.dataset.readingFocus = prefs.focus ? 'true' : 'false';
  document.getElementById('reading-size').setAttribute('aria-pressed', String(prefs.large));
  document.getElementById('reading-focus').setAttribute('aria-pressed', String(prefs.focus));
}
function togglePreference(key) {
  prefs[key] = !prefs[key]; applyPreferences();
  try { localStorage.setItem(prefsKey, JSON.stringify(prefs)); } catch { /* No effect on game or story persistence. */ }
}
document.getElementById('reading-size').onclick = () => togglePreference('large');
document.getElementById('reading-focus').onclick = () => togglePreference('focus');
document.getElementById('help-open').onclick = () => help.showModal();
document.getElementById('help-close').onclick = () => help.close();
applyPreferences();

function decorate() {
  // The reader replaces main's children, never this observer. Disconnect while
  // inserting presentation nodes to prevent mutation loops and scroll resets.
  observer.disconnect();
  try {
    const story = content.querySelector('.story');
    document.getElementById('reader-tools').hidden = !story;
    document.body.dataset.page = story ? 'story' : content.querySelector('.hero') ? 'hub' : 'collection';
    const hero = content.querySelector('.hero');
    if (hero && !hero.dataset.presented) {
      hero.dataset.presented = 'true';
      hero.querySelector('.eyebrow').textContent = 'THE EMRLD / INTERACTIVE STORIES';
      const title = hero.querySelector('h1'); title.replaceChildren(document.createTextNode('Every choice.'), document.createElement('br'), create('span', 'Another side.'));
      const copy = hero.querySelector('.hero-copy');
      copy.querySelector('p').textContent = 'Go beyond the main story. Discover different perspectives, make your choices, and carry their consequences back into Night Walker.';
      const emblem = create('div', '', 'world-emblem'); emblem.setAttribute('aria-hidden', 'true');
      emblem.append(create('span', 'SEE', 'emblem-first'), create('span', 'WORLD', 'emblem-second'), create('small', 'READ / CHOOSE / RETURN'));
      hero.append(emblem);
      const guide = create('button', 'How the stories connect', 'text-button'); guide.type = 'button'; guide.onclick = () => help.showModal(); copy.append(guide);
      const ribbon = create('section', '', 'journey-strip'); ribbon.setAttribute('aria-label', 'How progression works');
      for (const [number, heading, detail] of [['01', 'Play TechOps Hero', 'Your game progress opens each perspective.'], ['02', 'Choose in See World', 'Read a chapter. Make a decision.'], ['03', 'Return to Night Walker', 'Play the new sections you have earned.']]) {
        const step = create('div'); step.append(create('span', number, 'journey-number'), create('h2', heading), create('p', detail)); ribbon.append(step);
      }
      hero.after(ribbon);
      const connect = [...content.querySelectorAll(':scope > .result')].find(n => n.querySelector('h2')?.textContent === 'Begin with the main story');
      if (connect) {
        connect.classList.add('connection-card');
        connect.prepend(create('p', 'FIRST TIME HERE?', 'eyebrow'));
        // Keep the existing recovery text and controls intact, including errors.
        const tip = create('p', 'Already playing? Continue your saved game, open Linked Story, and connect it there. Your chapters appear here as you reach them.', 'connection-tip');
        connect.append(tip);
      }
      const cards = content.querySelector('.cards');
      if (cards) {
        const label = create('div', '', 'perspectives-heading'); label.append(create('h2', 'Choose a perspective'), create('span', 'Revealed by your playthrough')); cards.before(label);
        for (const card of cards.children) {
          const action = card.querySelector('button'); card.classList.toggle('perspective-locked', !!action?.disabled);
          const status = create('span', action?.disabled ? 'UNDISCOVERED' : action?.textContent.includes('completed') ? 'COMPLETED' : 'AVAILABLE', 'perspective-state');
          card.querySelector('.card-body')?.prepend(status);
        }
        const available = [...cards.querySelectorAll('button')].find(b => !b.disabled && b.textContent === 'Continue this perspective');
        if (available) {
          const resume = create('button', 'Continue a perspective →', 'primary resume-perspective'); resume.type = 'button'; resume.onclick = () => available.click(); copy.prepend(resume);
        }
      }
    }
    const timeline = content.querySelector('.rules');
    if (timeline) { timeline.classList.add('story-timeline'); for (const item of timeline.querySelectorAll('article')) item.classList.add('timeline-entry'); }
    const top = content.querySelector('.story-top');
    if (top) top.querySelector('small').textContent = top.querySelector('small').textContent.replace('LINKED PLAYTHROUGH', 'YOUR PLAYTHROUGH');
    const side = content.querySelector('.sidebar');
    if (side) {
      const notes = [...side.querySelectorAll(':scope > p')];
      const systemNote = notes.find(p => p.textContent.startsWith('Linked decisions are append-only.'));
      if (systemNote) systemNote.textContent = 'Your choices stay with this playthrough. You can revisit your decisions in the journal below.';
    }
    const scene = content.querySelector('#scene-title');
    document.title = scene ? `${scene.textContent} — See World` : 'See World — Stories you step into';
    for (const link of content.querySelectorAll('a[target="_blank"]')) link.title = 'Opens in a new tab. Use the same browser to keep your progress connected.';
    for (const result of content.querySelectorAll(':scope > .result')) if (result.querySelector('h2')?.textContent === 'EARNED IN NIGHT WALKER') result.classList.add('earned-sections');
    const heading = content.querySelector('h1'); if (heading) heading.setAttribute('tabindex', '-1');
  } finally { observer.observe(content, { childList: true }); }
}
const observer = new MutationObserver(decorate);
decorate();
// Suppress a missing optional cache as an alarm, never an actual storage error.
const status = document.getElementById('storage-status');
function markStatus() { status.classList.toggle('initial-connection', status.textContent === 'Missing or oversized record.'); }
new MutationObserver(markStatus).observe(status, { childList: true, subtree: true, characterData: true }); markStatus();
function measureHeader() { root.style.setProperty('--player-header-height', `${document.querySelector('.topbar').getBoundingClientRect().height}px`); }
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(measureHeader).observe(document.querySelector('.topbar'));
measureHeader();
