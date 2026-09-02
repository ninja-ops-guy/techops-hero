/* TechOps Hero — workstation cinematic clarity v1.
 * Adds narrative labels to the two Day 1 workstation feeds so the authored
 * Felicia -> ORPHEUS interruption reads as a sequence instead of two loose cards.
 */
(function(root){
  "use strict";
  if(!root||!root.document||root.TechOpsWorkstationClarityPatch)return;
  function decorate(){
    var el=root.document.getElementById("act1-reference");
    if(!el||!el.classList.contains("a1-first_person")||el.dataset.workstationClarity==="1")return false;
    el.dataset.workstationClarity="1";
    var props=el.querySelector(".a1-props");if(!props)return false;
    var imgs=props.querySelectorAll(".a1-prop");
    if(imgs[0])imgs[0].setAttribute("aria-label","Company profile video — Felicia");
    if(imgs[1])imgs[1].setAttribute("aria-label","ORPHEUS signal anomaly interrupt");
    var key=root.document.createElement("div");key.className="a1-workstation-key";
    key.innerHTML='<span>01 · COMPANY FEED // FELICIA</span><b>→ SIGNAL INTERRUPTED →</b><span>02 · ORPHEUS // ANOMALY</span>';
    el.appendChild(key);
    var status=el.querySelector(".a1-status");if(status&&/TICKET CLOCK PAUSED/i.test(status.textContent||""))status.textContent="OPENING BRIEFING · SHIFT CLOCK PAUSED UNTIL CLOCK IN";
    return true;
  }
  var style=root.document.createElement("style");style.id="workstation-cinematic-clarity-style";style.textContent='.a1-workstation-key{position:absolute;left:7%;right:7%;bottom:18%;display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center;color:#a9c8d2;font:700 7px/1.5 "Press Start 2P",monospace;text-align:center;text-shadow:0 2px #000}.a1-workstation-key b{color:#ff9b55;font-size:6px}@media(max-width:600px){.a1-workstation-key{bottom:21%;grid-template-columns:1fr;gap:4px;font-size:6px}.a1-workstation-key b{font-size:5px}.act1-reference.a1-first_person .a1-props{bottom:31%!important;height:32%!important}}';(root.document.head||root.document.documentElement).appendChild(style);
  var observer=new MutationObserver(decorate);observer.observe(root.document.documentElement,{subtree:true,childList:true});decorate();
  root.TechOpsWorkstationClarityPatch={VERSION:1,decorate:decorate,observer:observer};
})(typeof globalThis!=="undefined"?globalThis:this);
