/* Plating equipment and Doors tools. Presentation only: callers supply the
 * canonical record and the existing operator-hold flag; this module never
 * records evidence, authorizes a change, runs a test or closes a work order. */
(function (root) {
  'use strict';
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function model(record) {
    record = record || {};
    const evidence = Array.isArray(record.evidence) ? record.evidence : [];
    return {
      local: evidence.includes('local_login'), controller: evidence.includes('controller_reachability'),
      inspected: evidence.includes('integration_service'), repaired: Boolean(record.fixApplied),
      verified: Boolean(record.technicalCheckPassed)
    };
  }
  function attributes(m, holdConfirmed) {
    return ' data-plating-dependency="' + (m.repaired ? 'running' : m.inspected ? 'stopped' : 'query') + '" data-plating-reachability="' + (m.controller ? 'reachable' : 'unknown') + '" data-plating-session="' + (m.verified ? 'verified' : m.repaired ? 'ready' : 'disconnected') + '" data-plating-hold="' + (holdConfirmed ? 'confirmed' : 'pending') + '"';
  }
  function button(label, action, value, extra) {
    return '<button type="button" data-day-action="' + action + '"' +
      (value ? ' data-value="' + esc(value) + '"' : '') + (extra || '') + '>' + label + '</button>';
  }
  function hold(confirmed) {
    return '<aside class="plating-hold" data-hold="' + (confirmed ? 'confirmed' : 'pending') + '">' +
      '<span class="plating-hold__symbol" aria-hidden="true">' + (confirmed ? '&#10003;' : '<svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="M6 4v12M14 4v12" stroke="currentColor" stroke-width="3"/></svg>') + '</span><div><strong>Operator hold · ' +
      (confirmed ? 'confirmed for change' : 'not coordinated') + '</strong><p>' +
      (confirmed ? 'Amit and the operator confirmed the service-change hold. This does not verify production.' : 'Coordinate with Amit and the operator before changing the integration service.') +
      '</p></div></aside>';
  }
  function badge(state, label) {
    return '<span class="plating-status" data-state="' + state + '">' + label + '</span>';
  }
  function physical(data, holdConfirmed) {
    const m = model(data && data.record), service = m.repaired ? 'Running' : m.inspected ? 'Stopped' : 'Not queried';
    const session = m.verified ? 'SESSION VERIFIED' : m.repaired ? 'READY TO TEST' : 'RECONNECT REQUIRED';
    const screen = m.verified ? '#9de1c5' : m.repaired ? '#bbdae7' : '#edc27d';
    return '<div class="plating-cabinet"' + attributes(m, holdConfirmed) + ' data-session="' + (m.verified ? 'verified' : m.repaired ? 'untested' : 'disconnected') + '">' +
      '<svg viewBox="0 0 640 320" role="img" aria-label="Plating HMI cabinet close-up. ' + session.toLowerCase() + '. Integration service: ' + service.toLowerCase() + '.">' +
      '<defs><linearGradient id="plating-cabinet-metal" x2="1" y2="1"><stop stop-color="#7b919d"/><stop offset=".5" stop-color="#4b6473"/><stop offset="1" stop-color="#263e4d"/></linearGradient></defs>' +
      '<path d="M44 24H596V291H44Z" fill="url(#plating-cabinet-metal)" stroke="#99aeb7" stroke-width="2"/>' +
      '<path d="M53 32H586V282H53Z" fill="none" stroke="#172e3c" stroke-width="3"/>' +
      '<rect x="67" y="43" width="343" height="203" rx="6" fill="#182c37" stroke="#a5b8bf" stroke-width="2"/>' +
      '<rect x="78" y="54" width="321" height="181" fill="#091d28"/>' +
      '<path d="M78 85H399" stroke="#315361"/>' +
      '<text x="93" y="75" fill="#bcd5de" font-size="15" font-family="monospace">PLATING / LOCAL HMI</text>' +
      '<rect x="91" y="100" width="295" height="47" fill="#132f3b" stroke="#3e5965"/>' +
      '<text x="103" y="120" fill="#9cb9c5" font-size="12" font-family="monospace">CONTROLLER SESSION</text>' +
      '<text x="103" y="139" fill="' + screen + '" font-size="16" font-family="monospace">' + session + '</text>' +
      '<path d="M93 160H385M93 190H385M188 154V214M290 154V214" stroke="#294956"/>' +
      '<rect x="103" y="173" width="70" height="7" fill="#547a88"/><rect x="202" y="173" width="72" height="7" fill="#547a88"/>' +
      '<text x="103" y="207" fill="#a9c7d1" font-size="11" font-family="monospace">LOCAL HOST</text><text x="202" y="207" fill="#a9c7d1" font-size="11" font-family="monospace">PLATING-WS07</text>' +
      '<rect x="434" y="45" width="135" height="90" rx="3" fill="#263e4b" stroke="#8da4af"/>' +
      '<text x="446" y="64" fill="#c5d5da" font-size="12" font-family="monospace">SERVICE PANEL</text>' +
      '<circle cx="452" cy="82" r="5" fill="' + (m.repaired ? '#9de1c5' : m.inspected ? '#edc27d' : '#8398a4') + '"/>' +
      '<text x="464" y="86" fill="#e0e7e9" font-size="11" font-family="monospace">INTEGRATION</text>' +
      '<text x="446" y="114" fill="#c5d5da" font-size="14" font-family="monospace">' + service.toUpperCase() + '</text>' +
      '<rect x="435" y="150" width="134" height="84" rx="3" fill="#334b57" stroke="#8da4af"/>' +
      '<circle cx="460" cy="183" r="14" fill="#152c36" stroke="#8ea5ae" stroke-width="2"/>' +
      '<text x="446" y="215" fill="#b6c8cf" font-size="10" font-family="monospace">SELECTOR</text>' +
      '<circle cx="535" cy="183" r="22" fill="#b4a071" stroke="#d3bd8b" stroke-width="2"/><circle cx="535" cy="183" r="14" fill="#8f514b"/>' +
      '<path d="M467 252H566M467 258H566M467 264H566" stroke="#142c38" stroke-width="3"/>' +
      '<rect x="79" y="260" width="271" height="15" fill="#273e49"/><text x="90" y="271" fill="#ced9dc" font-size="10" font-family="monospace">PLATING-WS07 · OPERATOR STATION</text>' +
      '<g fill="#b6c6cc" stroke="#3d5764"><circle cx="57" cy="37" r="4"/><circle cx="582" cy="37" r="4"/><circle cx="57" cy="277" r="4"/><circle cx="582" cy="277" r="4"/></g></svg>' +
      '<div class="plating-cabinet__legend"><span>Integration service · ' + service + '</span>' + badge(m.verified ? 'verified' : m.repaired ? 'ready' : 'waiting', m.verified ? 'Session verified' : m.repaired ? 'Repair applied · test pending' : 'Session not verified') + '</div></div>' + hold(holdConfirmed);
  }
  function node(title, value, tone, detail) {
    return '<li data-state="' + tone + '"><strong>' + title + '</strong>' + badge(tone, value) + '<p>' + detail + '</p></li>';
  }
  function services(ui, record, complete, holdConfirmed) {
    const m = model(record), selected = ui && ui.startup;
    const status = m.repaired ? 'Running' : m.inspected ? 'Stopped' : 'Query required';
    let html = '<section class="plating-tool plating-services"' + attributes(m, holdConfirmed) + ' aria-label="Production integration services"><div class="plating-tool__toolbar"><span>Services (Local)</span><strong>PLATING-WS07</strong></div>' +
      '<h3>Production Integration</h3><p class="plating-tool__intro">The workstation service connects the local production application to its controller session.</p>' +
      '<ol class="plating-dependency" aria-label="Integration dependency chain">' +
      node('Dependency start', m.repaired ? 'Automatic startup applied' : m.inspected ? 'Did not restart' : 'Not inspected', m.repaired ? 'ready' : m.inspected ? 'stopped' : 'unknown', m.repaired ? 'Approved automatic startup applied.' : m.inspected ? 'The overnight reboot left the dependency stopped.' : 'Inspect the chain to read the dependency state.') +
      node('Production Integration', status, m.repaired ? 'ready' : m.inspected ? 'stopped' : 'unknown', m.repaired ? 'Service change applied. The session still needs its own test.' : m.inspected ? 'The integration service is stopped.' : 'Service status has not been queried.') +
      node('Controller session', m.verified ? 'Verified' : m.repaired ? 'Ready to test' : 'Not verified', m.verified ? 'verified' : 'unknown', m.verified ? 'The technical session check passed.' : 'Reachability alone does not validate the application session.') + '</ol>' + hold(holdConfirmed);
    if (!m.repaired && !complete) {
      html += button('Inspect dependency chain', 'observe', 'integration_service') +
        '<fieldset class="doors-choices"><legend>Dependency startup</legend>' +
        [['manual', 'Manual'], ['auto', 'Automatic']].map(([id, label]) => button(label, 'doors-startup', id, ' aria-pressed="' + (selected === id) + '"')).join('') + '</fieldset>' +
        button('Apply startup and start service', 'doors-apply', '', ' class="doors-primary"');
    }
    return html + '</section>';
  }
  function connection(record, complete, holdConfirmed) {
    const m = model(record);
    let html = '<section class="plating-tool plating-connection"' + attributes(m, holdConfirmed) + ' aria-label="Controller connection diagnostics"><div class="plating-tool__toolbar"><span>Connection Test</span><strong>PLATING-WS07</strong></div>' +
      '<h3>Host → controller → session</h3><p class="plating-tool__intro">Test each layer separately. A reachable controller can still have no verified production session.</p>' +
      '<ol class="plating-checks">' +
      node('Local workstation', m.local ? 'Responsive' : 'Not checked', m.local ? 'verified' : 'unknown', m.local ? 'Local sign-in and applications respond.' : 'Use the local sign-in check to observe workstation health.') +
      node('Controller network path', m.controller ? 'Reachable' : 'Not checked', m.controller ? 'verified' : 'unknown', m.controller ? 'The expected path responds with stable latency.' : 'Ping the line controller to check its network path.') +
      node('Integration session', m.verified ? 'Session verified' : m.repaired ? 'Repair applied · test pending' : 'Not verified', m.verified ? 'verified' : m.repaired ? 'ready' : 'waiting', m.verified ? 'Service stayed running and the controller session re-established.' : m.repaired ? 'Start a fresh session test; a running service is not a completed check.' : 'The application has not re-established a verified session.') + '</ol>' +
      '<p class="plating-boundary">' + (m.verified ? 'Technical session verified. The operator’s real production task requires separate requester verification.' : 'Controller reachability does not prove the integration session or the operator’s production task.') + '</p>' + hold(holdConfirmed);
    if (!complete && !m.verified) {
      html += m.repaired ? button('Reconnect and test session', 'technical', '', ' class="doors-primary"') :
        button('Check local sign-in', 'observe', 'local_login') + button('Ping line controller', 'observe', 'controller_reachability');
    }
    return html + '</section>';
  }
  root.TechOpsDayPlating = { physical, services, connection };
})(globalThis);
