// The existing game origin owns saves. No copying, clearing or cross-origin iframe sync.
export const GAME_ORIGIN = 'https://ninja-ops-guy.github.io';
export const GAME_URL = GAME_ORIGIN + '/techops-hero/';
export const STORY_URL = GAME_URL + 'see-world/index.html';
export const PORTFOLIO_URL = 'https://kterminal.site/';
export function isCustomHost(host) { return host === 'kterminal.site' || host === 'www.kterminal.site'; }
export function isNativeReader(path) { return path.startsWith('/techops-hero/see-world/'); }
export function portfolioUrl(route) { return PORTFOLIO_URL + '#/' + (route === 'portfolio' ? '' : route); }
export function gameUrl(host) { return isCustomHost(host) ? GAME_URL : '/techops-hero/'; }
export async function chooseSaveOrigin() {
  if (!isCustomHost(location.hostname)) return;
  const main = document.getElementById('content');
  main.classList.add('boot-message'); main.replaceChildren();
  const title = document.createElement('h1'); title.textContent = 'Keep your stories with your game.';
  const note = document.createElement('p'); note.textContent = 'TechOps Hero and connected stories open together at ninja-ops-guy.github.io, where existing game saves stay. Use the same browser and device. No progress is copied, cleared or merged.';
  const link = document.createElement('a'); link.href = STORY_URL + location.hash; link.target = '_top'; link.className = 'primary'; link.textContent = 'Open connected See World';
  const separate = document.createElement('p'); separate.textContent = 'Previously used this custom-domain reader? Its separate local data remains here. It does not sync with the game, and its export tools require a matching linked run.';
  const recover = document.createElement('button'); recover.type = 'button'; recover.textContent = 'Open this domain’s existing reader';
  main.append(title, note, link, separate, recover);
  await new Promise(resolve => { recover.onclick = resolve; });
  main.classList.remove('boot-message');
}
