import { CAMPAIGNS, CAMPAIGN_IDS, SCENES, campaignById, nodeById } from './campaigns.mjs';
import { SAVE_KEY, newRun, choose, availability, encode, decode, consequence } from './engine.mjs';
const $ = id => document.getElementById(id);
const content = $('content');
const make = (tag, text = '', className = '') => { const element = document.createElement(tag); element.textContent = text; if (className) element.className = className; return element; };
const button = (label, action, className = '') => { const element = make('button', label, className); element.type = 'button'; element.addEventListener('click', action); return element; };
let runs = {}, selected = '', view = 'hub', lastConsequence = '', pending = null, worldFrame = null, worldScene = 'city', exploring = false, blockedSave = false, recoveryRaw = '';
function announce(text) { $('announcement').textContent = text; }
function message(text) { $('storage-status').replaceChildren(make('span', text)); }
function download(text, filename) { const url = URL.createObjectURL(new Blob([text], { type: 'application/json' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
try {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) { try { runs = decode(raw); } catch { blockedSave = true; recoveryRaw = raw; message('The existing save could not be validated. It has NOT been overwritten. Play temporarily, import a valid save, or reset it below.'); } }
} catch { message('Browser storage is unavailable. Play continues in memory; export progress before leaving.'); }
function persist() {
  if (blockedSave) return false;
  try { localStorage.setItem(SAVE_KEY, encode(runs)); $('storage-status').replaceChildren(); return true; }
  catch { message('Progress is in memory only: this browser refused the save. Export progress before leaving.'); return false; }
}
function confirmAction(title, text, action) {
  if ($('confirm-dialog').open) return;
  pending = action; $('confirm-title').textContent = title; $('confirm-body').textContent = text; $('confirm-dialog').showModal();
}
$('cancel').onclick = () => { pending = null; $('confirm-dialog').close(); };
$('confirm-dialog').addEventListener('cancel', () => { pending = null; });
$('confirm').onclick = () => { const action = pending; pending = null; $('confirm-dialog').close(); action?.(); };
function leaveWorld() { exploring = false; document.body.classList.remove('exploring'); $('world-stage').hidden = true; $('world-nav').textContent = 'Explore 3D'; }
function setScene(scene, force = false) {
  if (!SCENES.includes(scene) || (!force && scene === worldScene)) return;
  worldScene = scene;
  if (worldFrame) worldFrame.contentWindow?.postMessage({ type: 'k-world:navigate', scene }, location.origin);
}
function explore() {
  if (exploring) { leaveWorld(); render(); return; }
  exploring = true; document.body.classList.add('exploring'); $('world-stage').hidden = false; $('world-nav').textContent = 'Return to story';
  if (!worldFrame) {
    worldFrame = document.createElement('iframe'); worldFrame.title = 'See World — existing walkable environment'; worldFrame.allow = 'autoplay; fullscreen'; worldFrame.referrerPolicy = 'strict-origin-when-cross-origin';
    worldFrame.src = `../k-world/index.html?entry=${encodeURIComponent(worldScene)}`;
    worldFrame.addEventListener('load', () => { setScene(worldScene, true); $('world-note').textContent = 'Existing-world staging, not new mission geometry. Use Return to story to continue. Movement does not advance choices. The world owns music playback.'; });
    $('world-stage').append(worldFrame);
  }
}
function navigate(to) {
  if (!['comic', 'links', 'terminal', 'portfolio'].includes(to)) return;
  if (window.parent !== window) window.parent.postMessage({ type: 'see-world:navigate', to }, location.origin);
  else window.location.href = '../#/' + (to === 'portfolio' ? '' : to);
}
window.addEventListener('message', event => {
  if (event.origin !== location.origin || !worldFrame || event.source !== worldFrame.contentWindow) return;
  if (event.data?.type === 'k-world:comic') navigate('comic');
  if (event.data?.type === 'k-world:portfolio') navigate('portfolio');
});
function openCampaign(id) {
  if (!campaignById(id)) return;
  leaveWorld(); selected = id; view = 'story'; lastConsequence = '';
  if (!runs[id]) runs[id] = newRun(id);
  try { history.replaceState(null, '', '#' + id); } catch { /* Embedded or restricted history. */ }
  persist(); render();
}
function showHub() { leaveWorld(); selected = ''; view = 'hub'; try { history.replaceState(null, '', location.pathname + location.search); } catch { /* History is optional. */ } render(); }
function showCollection() { leaveWorld(); view = 'collection'; render(); }
function statusFor(id) { const run = runs[id]; return run?.ended ? 'EPISODE COMPLETE / DOSSIER FOUND' : run?.history.length ? `RESUME / ${run.history.length} DECISIONS SAVED` : 'BEGIN YOUR ROUTE'; }
function launchButton(campaign, className = '') { return button(runs[campaign.id]?.ended ? 'Review your ending ↗' : runs[campaign.id]?.history.length ? 'Continue campaign →' : 'Begin campaign →', () => openCampaign(campaign.id), className); }
function renderHub() {
  const hero = make('section', '', 'hero'); const heading = make('div'); heading.append(make('p', 'THE EMRLD / INTERACTIVE STORIES', 'eyebrow'));
  const h1 = make('h1'); h1.append(document.createTextNode('FOUR LIVES.'), document.createElement('br'), make('span', 'ONE WORLD.')); heading.append(h1);
  const copy = make('div', '', 'hero-copy'); copy.append(make('p', 'Step into the story. Make the call. Live with what changes. Four character-led campaigns, with choices that leave a record.'));
  const counts = make('div', '', 'counter-row');
  for (const [number, label] of [['04', 'CAMPAIGNS'], [String(CAMPAIGNS.reduce((n,c) => n + c.nodes.filter(x => x.ending).length, 0)).padStart(2,'0'), 'ENDINGS'], [String(CAMPAIGN_IDS.filter(id => runs[id]?.ended).length).padStart(2,'0'), 'DOSSIERS FOUND']]) { const item = make('div'); item.append(make('strong', number), make('small', label)); counts.append(item); }
  copy.append(counts); hero.append(heading, copy); content.append(hero);
  const first = CAMPAIGNS[0], featured = make('section', '', 'featured'); featured.style.setProperty('--accent', first.color);
  const intro = make('div'); intro.append(make('p', 'FEATURED / IONA’S REVENGE', 'eyebrow'), make('h2', first.title), make('p', first.premise), launchButton(first, 'primary'), make('div', statusFor(first.id), 'status-tag'));
  const sigil = make('div', '', 'sigil'); sigil.style.color = first.color; sigil.setAttribute('aria-hidden', 'true'); sigil.append(make('strong', '04'), make('span', 'ONE. TWO. THREE. FOUR.')); featured.append(intro, sigil); content.append(featured);
  const sh = make('div', '', 'section-heading'); sh.append(make('h2', 'Other lives. Other decisions.'), make('small', 'STANDALONE CAMPAIGN PREVIEWS')); content.append(sh);
  const cards = make('div', '', 'cards');
  for (const campaign of CAMPAIGNS.slice(1)) {
    const card = make('article', '', 'card'); card.style.setProperty('--tone', campaign.color);
    const art = make('div', '', 'card-art'); art.setAttribute('aria-hidden','true'); art.append(make('span', campaign.motif.split(' / ')[0]), make('strong', campaign.name));
    const body = make('div', '', 'card-body'); body.append(make('h3', campaign.title), make('p', campaign.subtitle), make('p', campaign.mechanics, 'mechanics'), launchButton(campaign), make('div', statusFor(campaign.id), 'status-tag')); card.append(art,body); cards.append(card);
  }
  content.append(cards);
  const rules = make('section', '', 'rules');
  for (const [title, text] of [['Your pace. Real decisions.', 'No timed button prompts. Choice-based action, visible consequences, independent saves for each campaign.'], ['Explore, then return.', 'The existing 3D world remains available between decisions. Dedicated campaign scenes, combat and cinematics are not yet built.'], ['A game route is not the comic.', 'New dialogue and alternate outcomes are drafts. Source chronology stays visible; the main comic is never locked behind a puzzle.']]) { const item = make('div'); item.append(make('h3',title),make('p',text)); rules.append(item); }
  content.append(rules);
}
function commitChoice(option, expectedNode) {
  const run = runs[selected];
  try {
    const next = choose(run, option.id, expectedNode); lastConsequence = consequence(campaignById(selected),run,next); runs[selected] = next; persist(); render();
    announce(`${lastConsequence} ${nodeById(campaignById(selected),next.node).title}`);
  } catch (error) { announce(error.message); }
}
function renderStory() {
  const campaign = campaignById(selected), run = runs[selected], current = nodeById(campaign,run.node);
  content.style.setProperty('--tone',campaign.color); setScene(current.scene);
  const top = make('div', '', 'story-top'); top.append(button('← All campaigns',showHub),make('small', campaign.name + ' / ' + campaign.motif)); content.append(top);
  const layout = make('div', '', 'story-grid'), story = make('section', '', 'story'); story.setAttribute('aria-labelledby','scene-title');
  story.append(make('p', `${current.ending ? 'EPISODE COMPLETE' : 'ACT '+String(current.chapter).padStart(2,'0')+' / 05'} · ${campaign.title}`, 'chapter-label'));
  const title = make('h1',current.title); title.id = 'scene-title'; title.tabIndex = -1; story.append(title, make('p',current.place,'location'));
  if (lastConsequence) story.append(make('p',lastConsequence,'after-choice'));
  const text = make('div','','story-text'); for (const paragraph of current.text) text.append(make('p',paragraph)); story.append(text);
  const dialogue = make('blockquote','','dialogue'); dialogue.append(make('small',current.speaker || campaign.name),make('p','“'+current.quote+'”')); story.append(dialogue);
  if (!current.ending) {
    const choices = make('div','','choices'); choices.setAttribute('aria-label','Story choices');
    current.choices.forEach((option,index) => {
      const allowed = availability(run,option);
      const action = () => option.confirm ? confirmAction('Commit this depot fate?', option.hint+' This cannot be undone within this run. Restarting this campaign requires a separate confirmation.', () => commitChoice(option,current.id)) : commitChoice(option,current.id);
      const item = button('',action,'choice'); item.dataset.choice=option.id; item.disabled=!allowed.allowed;
      item.append(make('span',String(index+1).padStart(2,'0'),'choice-index'));
      const label = make('span'); label.append(make('strong',option.label),make('small',option.hint + (!allowed.allowed ? ' Locked: '+allowed.reason : '')));
      if (option.confirm) label.append(make('small','IRREVERSIBLE / CONFIRMATION REQUIRED','irreversible'));
      item.append(label,make('span',allowed.allowed ? '↗' : '—')); choices.append(item);
    }); story.append(choices);
  } else {
    const result = make('section','','result'); result.append(make('small','PERSISTENT OUTCOME'),make('h2',current.worldState),make('small','DOSSIER DISCOVERED'),make('p',campaign.reward.title+' — '+campaign.reward.text)); story.append(result);
    const actions=make('div','','result-actions'); actions.append(button('Open collection',showCollection,'primary'),button('Choose another life',showHub,'secondary')); story.append(actions);
  }
  const side = make('aside','','sidebar'); side.setAttribute('aria-label','Campaign state'); side.append(make('h2','YOUR CONSEQUENCES'));
  for (const [key,value] of Object.entries(run.stats)) {
    const stat=make('div','','stat'), label=make('div','','stat-label'); label.append(make('span',campaign.labels[key]),make('strong',String(value)));
    const meter=document.createElement('meter'); meter.min=0;meter.max=16;meter.value=Math.min(16,value);meter.setAttribute('aria-label',campaign.labels[key]+' '+value);stat.append(label,meter);side.append(stat);
  }
  side.append(make('p','These values are independent. They do not combine into a morality score.'));
  const chronology=make('div','','chronology');chronology.append(make('h2','CHRONOLOGY BOUNDARY'),make('p',campaign.chronology));side.append(chronology);
  const journal=make('details','','journal');journal.append(make('summary',`DECISION JOURNAL / ${run.history.length}`));const list=make('ol');
  for (const step of run.history) { const n=nodeById(campaign,step.node), c=n.choices.find(x=>x.id===step.choice),li=make('li');li.append(make('strong',n.title),make('span',c.label));list.append(li); }
  journal.append(list);side.append(journal,button('Explore this world',explore,'secondary'),button('Restart this campaign',()=>confirmAction('Restart '+campaign.name+'?', 'Only this campaign’s decisions and dossier will reset. The other three campaigns stay unchanged. Export progress first to keep this route.',()=>{runs[selected]=newRun(selected);lastConsequence='';persist();render();}),'secondary'));
  layout.append(story,side);content.append(layout);
}
function renderCollection() {
  content.append(make('p','THE ARCHIVE / EARNED THROUGH PLAY','eyebrow'),make('h1','What you carry.'),make('p','These are in-game text dossiers, not new comic pages or unreleased recordings. Replay a campaign to explore another route; export first to keep the current one.'));
  const grid=make('div','','collection');
  for(const campaign of CAMPAIGNS) { const unlocked=runs[campaign.id]?.ended,card=make('article','','card');card.style.setProperty('--tone',campaign.color);card.append(make('p',campaign.name+' / '+(unlocked?'DISCOVERED':'UNDISCOVERED'),'eyebrow'),make('h2',unlocked?campaign.reward.title:'An unopened record'),make('p',unlocked?campaign.reward.text:'Complete this character’s episode to reveal the dossier.'),launchButton(campaign));grid.append(card); }
  content.append(grid);
  if(CAMPAIGN_IDS.every(id=>runs[id]?.ended)){const reward=make('section','','all-witnesses');reward.append(make('p','ALL FOUR PERSPECTIVES / BONUS DOSSIER','eyebrow'),make('h2','Four witnesses'),make('p','Voice is not consent. Trust is not evidence. Origin is not ownership. Care is not command. These four routes can illuminate one another without becoming one compulsory version of events.'));content.append(reward);}
}
function render() {
  content.replaceChildren();content.style.removeProperty('--tone');
  if(view==='story' && selected) renderStory(); else if(view==='collection') renderCollection(); else renderHub();
  if(blockedSave){const recovery=make('section','','result');recovery.append(make('h2','Your previous save is protected'),button('Download recovery copy',()=>download(recoveryRaw,'see-world-recovery.json'),'secondary'),button('Replace unreadable save',()=>confirmAction('Replace the unreadable save?', 'Download its recovery copy first. The current in-memory progress will replace only See World’s save slot.',()=>{blockedSave=false;persist();render();}),'secondary'));content.append(recovery);}
  document.title = view==='story' ? `${campaignById(selected).name} — SEE WORLD` : 'SEE WORLD — Four lives. Your choices.';
  window.scrollTo(0,0); (document.getElementById('scene-title') || content).focus({preventScroll:true});
}
$('home').onclick=showHub;$('campaigns-nav').onclick=showHub;$('collection-nav').onclick=showCollection;$('world-nav').onclick=explore;$('comic-nav').onclick=()=>navigate('comic');$('portfolio-nav').onclick=()=>navigate('portfolio');
$('links-nav').onclick = () => navigate('links');
$('export').onclick=()=>{download(encode(runs),'see-world-progress.json');announce('Progress exported.');};
$('import').addEventListener('change', async event=>{
  const file=event.target.files?.[0];event.target.value='';if(!file)return;
  if(file.size>200000){message('Import refused: file exceeds 200 KB. Existing progress is unchanged.');return;}
  try{const imported=decode(await file.text());confirmAction('Replace your current progress?', 'This validated save replaces all four local campaign runs. Export the current progress first to keep it.',()=>{runs=imported;blockedSave=false;selected='';view='hub';persist();render();announce('Validated save imported.');});}
  catch{message('Import refused: invalid or incompatible decision history. Existing progress is unchanged.');}
});
const initial=location.hash.slice(1);if(CAMPAIGN_IDS.includes(initial)){selected=initial;view='story';runs[initial]??=newRun(initial);}render();
