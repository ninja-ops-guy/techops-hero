/* Security's local Event Log presentation. This is a read-only view of the
 * existing badge/camera discrepancy. The Day owner records evidence only when
 * the player uses the existing Review access event action. */
(function (root) {
  'use strict';

  function equipment() {
    return '<figure class="doors-security__equipment">' +
      '<svg viewBox="0 0 680 250" role="img" aria-label="Hardware reference illustration: Sector 04 East door with a wall-mounted badge reader. This is not a camera image or evidence that someone entered.">' +
      '<rect width="680" height="250" fill="#122631"/>' +
      '<path d="M0 47H680M0 101H680M0 157H680M0 213H680M63 0V47M63 101V157M63 213V250M190 47V101M190 157V213M588 0V47M588 101V157M588 213V250" stroke="#1d3540" stroke-width="2"/>' +
      '<path d="M297 238V17H529V238" fill="#0b1923" stroke="#6a818b" stroke-width="6"/>' +
      '<path d="M310 237V29H516V237" fill="#2b424d" stroke="#405c67" stroke-width="2"/>' +
      '<rect x="325" y="42" width="176" height="42" rx="2" fill="#192d38"/>' +
      '<text x="413" y="60" fill="#bbced5" font-family="monospace" font-size="13" text-anchor="middle">SECTOR 04</text>' +
      '<text x="413" y="76" fill="#90aebc" font-family="monospace" font-size="10" letter-spacing="2" text-anchor="middle">EAST</text>' +
      '<path d="M326 101H499V217H326Z" fill="#263b46" stroke="#425964" stroke-width="2"/>' +
      '<path d="M332 107H493M332 210H493" stroke="#344e59" stroke-width="2"/>' +
      '<rect x="470" y="125" width="18" height="48" rx="3" fill="#132630"/>' +
      '<path d="M477 138V160" stroke="#94a8b0" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M298 237H531" stroke="#9caeb2" stroke-width="3"/>' +
      '<rect x="174" y="97" width="79" height="111" rx="8" fill="#081a25" stroke="#7b929c" stroke-width="3"/>' +
      '<path d="M187 107H240" stroke="#9dc6cd" stroke-width="4"/>' +
      '<rect x="186" y="120" width="55" height="49" rx="4" fill="#203b48"/>' +
      '<path d="M200 132H227V156H200Z M204 138H222 M204 143H217" fill="none" stroke="#7eacba" stroke-width="2"/>' +
      '<path d="M195 182Q213 169 231 182M201 188Q213 179 225 188M207 194Q213 190 219 194" fill="none" stroke="#6c98a8" stroke-width="2"/>' +
      '<path d="M254 148H279V69H296" fill="none" stroke="#45636f" stroke-width="3"/>' +
      '<path d="M156 149H115" stroke="#6f939e" stroke-width="1.5"/>' +
      '<text x="40" y="145" fill="#b5d1d8" font-family="monospace" font-size="12">BADGE</text>' +
      '<text x="40" y="161" fill="#b5d1d8" font-family="monospace" font-size="12">READER</text>' +
      '<path d="M533 72H573" stroke="#6f939e" stroke-width="1.5"/>' +
      '<text x="580" y="76" fill="#b5d1d8" font-family="monospace" font-size="11">EAST DOOR</text>' +
      '</svg><figcaption>Hardware reference illustration · not a camera frame</figcaption></figure>';
  }

  function view() {
    return '<section class="doors-security" aria-label="Sector 04 Event Log">' +
      '<header class="doors-security__heading"><div><span class="doors-security__eyebrow">ACCESS CONTROL / LOCAL REVIEW</span>' +
      '<h3>Event Log</h3></div><span class="doors-security__scope">Sector 04 / East door</span></header>' +
      equipment() +
      '<section class="doors-security__timeline" aria-label="Recorded access event"><h4>Recorded event</h4>' +
      '<ol><li><time>02:13</time><div><span class="doors-security__result">ACCESS GRANTED</span>' +
      '<p>SECTOR04-EAST</p><small>Source: Badge reader</small></div></li></ol></section>' +
      '<section class="doors-security__comparison" aria-label="Evidence boundaries">' +
      '<article data-proof="recorded"><span class="doors-security__label">WHAT THE LOG PROVES</span>' +
      '<h4>Credential accepted</h4><p>The badge system recorded an access grant at this door.</p></article>' +
      '<article data-proof="unverified"><span class="doors-security__label">WHAT IT DOES NOT PROVE</span>' +
      '<h4>Physical presence unverified</h4><p>The camera gives no corroborating physical match. A valid credential does not establish who was present.</p></article></section>' +
      '<p class="doors-security__boundary">Keep the access result and the camera result separate. The inconsistency remains unresolved.</p>' +
      '<button type="button" data-day-action="doors-badge" class="doors-primary">Review access event</button>' +
      '</section>';
  }

  root.TechOpsDaySecurity = Object.freeze({ view: view });
})(typeof globalThis !== 'undefined' ? globalThis : this);
