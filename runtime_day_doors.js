/* Doors field desktop. Loaded on the first local screen visit. All ticket writes
 * go through the Day transaction owner; open windows and test jobs are ephemeral. */
(function (root) {
  'use strict';

  const tools = {
    order: ['Work Order', 'notes'],
    print: ['Print Center', 'print'],
    access: ['Queue Security', 'key'],
    services: ['Services', 'services'],
    link: ['Connection Test', 'link'],
    log: ['Badge Log', 'key']
  };
  // Each optional station exposes the tools actually attached to that device.
  // The case definition supplies its observations, consent and verification rules.
  const benches = {
    laptop_dock_link: ['Device Manager', 'display', 'USB-C dock', '', 'Rescan dock and test drawing share'],
    desktop_restart_window: ['Update Manager', 'services', 'Finance export host', 'Restart after saved export', 'Check saved export and restart status'],
    signage_player_session: ['Signage Player', 'display', 'Lobby player', 'Renew managed player session', 'Refresh live playlist'],
    printer_queue_blocked: ['Print Center', 'print', 'Finance batch queue', 'Remove the blocked job', 'Send the approved test page'],
    plc_hmi_dependency: ['HMI Services', 'services', 'Packaging HMI host', 'Start approved HMI dependency', 'Read fresh controller telemetry'],
    industrial_scanner_vlan: ['Network Settings', 'link', 'Traceability station port', 'Apply assigned port profile', 'Renew lease and test scan service'],
    access_point_poe: ['Port Monitor', 'link', 'Engineering AP uplink', '', 'Test link, power and controller join'],
    timeclock_time_sync: ['Time Settings', 'services', 'HR attendance terminal', 'Apply approved time source', 'Sync and test collector']
  };
  const paths = {
    print: 'M7 8V3h10v5 M7 16H4V9h16v7h-3 M7 13h10v8H7z M16 11h1',
    key: 'M14 10a5 5 0 1 0-4 4l2 2h3v3h4v-4l-5-5z M7 8h1',
    notes: 'M5 4h14v17H5z M8 8h8 M8 12h8 M8 16h5',
    services: 'M4 4h16v6H4z M4 14h16v6H4z M7 7h1 M7 17h1 M12 7h5 M12 17h5',
    link: 'M3 3h8v6H3z M13 15h8v6h-8z M7 9v8h6 M11 6h6v9',
    display: 'M3 3h18v13H3z M8 21h8 M12 16v5'
  };

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  }
  function icon(name) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><path d="' + paths[name] + '"/></svg>';
  }
  function button(label, action, value, attrs) {
    return '<button type="button" data-day-action="' + action + '"' +
      (value ? ' data-value="' + esc(value) + '"' : '') + (attrs || '') + '>' + label + '</button>';
  }
  function apps(station) {
    if (station.id === 'security_workstation') return ['log'];
    if (station.id === 'shipping_workstation') return ['print', 'access', 'order'];
    if (station.id === 'plating_workstation') return ['services', 'link', 'order'];
    return ['device', 'order'];
  }
  function details(station, id) {
    return id === 'device' ? benches[station.caseId] : tools[id];
  }
  function state(session) {
    if (!session.doors) session.doors = { app: '', minimized: false, maximized: false, user: 'clerk', grant: '', startup: '', jobs: [] };
    return session.doors;
  }
  function rows(entries) {
    return '<dl class="doors-properties">' + entries.map(([key, value]) =>
      '<div><dt>' + esc(key) + '</dt><dd>' + esc(value) + '</dd></div>').join('') + '</dl>';
  }
  function choices(label, action, selected, entries) {
    return '<fieldset class="doors-choices"><legend>' + esc(label) + '</legend>' +
      entries.map(([id, title]) => button(esc(title), action, id, ' aria-pressed="' + (selected === id) + '"')).join('') + '</fieldset>';
  }
  function notice(session) {
    if (!session.notice) return '';
    return '<p class="doors-message" role="status" data-error="' + Boolean(session.error) + '">' + esc(session.notice) + '</p>';
  }
  function printApp(ui, record) {
    const jobs = ui.jobs.map(job => '<li><span>' + esc(job.user) + '</span><strong>' + esc(job.status) + '</strong></li>').join('');
    return rows([['Printer', 'SHIP-LBL02'], ['Document', 'Customs label · test copy']]) +
      choices('Test print identity', 'doors-user', ui.user, [['clerk', 'Shipping clerk'], ['lead', 'Authorized lead']]) +
      button('Send test label', 'doors-print', '', ' class="doors-primary"') +
      '<h3>Job history</h3>' + (jobs ? '<ol class="doors-jobs">' + jobs + '</ol>' : '<p>No test jobs in this session.</p>') +
      (record.fixApplied && !record.technicalCheckPassed ? '<p>Test the repaired path using the clerk’s identity.</p>' : '');
  }
  function accessApp(ui, record, complete) {
    const base = rows([['Queue', 'SHIP-LBL02'], ['Shipping lead', 'Print'], ['Shipping clerk', record.fixApplied ? 'Print' : 'No effective Print permission']]);
    if (record.fixApplied || complete) return base;
    return base + choices('Permission change', 'doors-grant', ui.grant, [
      ['print', 'Approved Shipping group · Print'], ['manage', 'Shipping clerk · Manage queue'], ['everyone', 'Everyone · Full control']
    ]) + button('Apply and refresh token', 'doors-apply', '', ' class="doors-primary"');
  }
  function servicesApp(ui, record, complete) {
    let html = rows([['Host', 'PLATING-WS07'], ['Service', 'Production Integration'], ['Dependency status', record.fixApplied ? 'Running' : record.evidence.includes('integration_service') ? 'Stopped' : 'Query required']]);
    if (record.fixApplied || complete) return html;
    html += button('Inspect dependency chain', 'observe', 'integration_service');
    return html + choices('Dependency startup', 'doors-startup', ui.startup, [['manual', 'Manual'], ['auto', 'Automatic']]) +
      button('Apply startup and start service', 'doors-apply', '', ' class="doors-primary"');
  }
  function connectionApp(record, complete) {
    let html = rows([['Source', 'PLATING-WS07'], ['Target', 'Line controller'], ['Integration session', record.technicalCheckPassed ? 'Connected' : record.fixApplied ? 'Ready to test' : 'Disconnected']]);
    if (complete || record.technicalCheckPassed) return html;
    if (record.fixApplied) return html + button('Reconnect and test session', 'technical', '', ' class="doors-primary"');
    return html + button('Check local sign-in', 'observe', 'local_login') + button('Ping line controller', 'observe', 'controller_reachability');
  }
  function deviceApp(station, data) {
    const [, , device, repair, verify] = benches[station.caseId];
    const rec = data.record, def = data.def;
    let html = rows([['Device', device], ['Service record', data.complete ? 'Closed' : rec.technicalVerified ? 'Awaiting requester' : rec.fixApplied ? 'Repair applied' : 'Under investigation']]);
    if (data.complete || rec.technicalVerified) return html + '<p>' + esc(def.technicalCheck) + '</p>';
    if (rec.fixApplied) return html + button(esc(verify), 'technical', '', ' class="doors-primary"');
    html += def.evidence.filter(e => e.surface === 'screen').map(e => button(esc(e.label), 'observe', e.id)).join('');
    if (rec.authorized && repair) html += button(esc(repair), 'repair', '', ' class="doors-primary"');
    return html;
  }
  function badgeApp() {
    return rows([['Log', 'Sector 04 / East door'], ['02:13', 'ACCESS GRANTED'], ['Source', 'Badge reader']]) +
      button('Review access event', 'doors-badge', '', ' class="doors-primary"');
  }
  function appBody(id, station, data, session, notes) {
    const ui = state(session);
    switch (id) {
      case 'order': return notice(session) + notes;
      case 'print': return printApp(ui, data.record) + notice(session);
      case 'access': return accessApp(ui, data.record, data.complete) + notice(session);
      case 'services': return servicesApp(ui, data.record, data.complete) + notice(session);
      case 'link': return connectionApp(data.record, data.complete) + notice(session);
      case 'device': return deviceApp(station, data) + notice(session);
      case 'log': return badgeApp();
    }
  }
  function nextSteps(id, station, data) {
    if (!data || id === 'order' || !data.record.evidence.length) return '';
    let links = button('Open work order', 'doors-open', 'order');
    if (data.canonical && data.record.technicalCheckPassed && !data.complete) {
      links += button('Return to requester for verification', 'requester-route', station.ticketId);
    }
    return '<footer class="doors-next">' + links + '</footer>';
  }
  function view(station, data, session, notes) {
    const ui = state(session), list = apps(station), app = ui.app && details(station, ui.app);
    const visible = Boolean(app && !ui.minimized);
    const shortcuts = list.map(id => {
      const [label, art] = details(station, id);
      return button(icon(art) + '<span>' + esc(label) + '</span>', 'doors-open', id, ' class="doors-shortcut" aria-label="' + esc(label) + '"');
    }).join('');
    const window = visible ? '<section class="doors-window" aria-label="' + esc(app[0]) + '"><header><h2 tabindex="-1" data-doors-heading>' + icon(app[1]) + esc(app[0]) + '</h2><div>' +
      button('—', 'doors-min', '', ' aria-label="Minimize window"') +
      button(ui.maximized ? '❐' : '□', 'doors-max', '', ' aria-label="' + (ui.maximized ? 'Restore window size' : 'Maximize window') + '"') +
      button('×', 'doors-close', '', ' aria-label="Close window"') + '</div></header><div class="doors-pane">' +
      appBody(ui.app, station, data, session, notes) + nextSteps(ui.app, station, data) + '</div></section>' : '';
    const device = station.supportComputer ? station.supportComputer.label : station.label;
    const alert = !visible && data && !data.complete && !data.record.fixApplied && data.def.notifications[0];
    const notification = alert ? '<aside class="doors-notification"><b>Doors notification</b><p>' + esc(alert) + '</p></aside>' : '';
    return '<section class="day-console doors-field" aria-label="Doors desktop" data-window="' + visible + '" data-max="' + (visible && ui.maximized) + '">' +
      '<header class="doors-host"><strong id="day-device-title">' + esc(device) + '</strong><nav aria-label="Workstation">' +
      (station.id === 'security_workstation' ? '' : button('Inspect equipment', 'physical')) + button('Return to floor', 'exit') + '</nav></header>' +
      '<div class="doors-workarea"><div class="doors-wallpaper" aria-hidden="true"><i></i><b>Doors</b><small>Workstation Edition</small></div>' +
      '<nav class="doors-shortcuts" aria-label="Installed applications">' + shortcuts + '</nav>' + notification + window + '</div>' +
      '<footer class="doors-bar">' + button('<i class="doors-mark" aria-hidden="true"></i> Doors', 'doors-home', '', ' aria-label="Show desktop"') +
      (app ? button(esc(app[0]), 'doors-task', '', ' aria-label="' + (ui.minimized ? 'Restore ' : 'Minimize ') + esc(app[0]) + '" aria-pressed="' + visible + '"') : '') +
      '<span>LOCAL SESSION</span></footer></section>';
  }
  // Navigation changes this session only. The transaction callback owns durable
  // evidence, save failures, operator holds and independent requester closure.
  function handle(action, value, station, data, session, commit, reviewBadge) {
    const ui = state(session);
    function feedback(message, error) {
      session.notice = message;
      session.error = Boolean(error);
    }
    function open(id) {
      if (!apps(station).includes(id)) return;
      ui.app = id;
      ui.minimized = false;
      ui.maximized = false;
      feedback('');
    }
    function sendLabel() {
      const clerk = ui.user === 'clerk', record = data.record;
      const passed = !clerk || record.fixApplied;
      // A post-repair lead print never verifies the clerk's path. Reprints can
      // still appear in the spooler without changing an already recorded case.
      const evidence = clerk ? 'queue_trace' : 'compare_user';
      if (clerk && record.fixApplied && !record.technicalCheckPassed && !data.complete) {
        if (!commit('technical')) return;
      } else if (!record.fixApplied && !data.complete && !record.evidence.includes(evidence)) {
        if (!commit('observe', evidence)) return;
      }
      ui.jobs.unshift({ user: clerk ? 'Shipping clerk' : 'Authorized lead', status: passed ? 'Delivered to SHIP-LBL02' : 'Removed · access denied' });
      ui.jobs.length = Math.min(ui.jobs.length, 6);
      feedback(passed ? 'Spooler accepted the test label and delivered it to the printer.' : 'Spooler received the label. Authorization denied Print for this identity.');
    }
    switch (action) {
      case 'doors-open': open(value); break;
      case 'doors-repair-tool': open(station.id === 'shipping_workstation' ? 'access' : station.id === 'plating_workstation' ? 'services' : 'device'); break;
      case 'doors-test-tool': open(station.id === 'shipping_workstation' ? 'print' : station.id === 'plating_workstation' ? 'link' : 'device'); break;
      case 'doors-min':
      case 'doors-home': ui.minimized = true; break;
      case 'doors-task': ui.minimized = !ui.minimized; break;
      case 'doors-max': ui.maximized = !ui.maximized; break;
      case 'doors-close': ui.app = ''; ui.minimized = false; ui.maximized = false; feedback(''); break;
      case 'doors-user': ui.user = value; break;
      case 'doors-grant': ui.grant = value; break;
      case 'doors-startup': ui.startup = value; break;
      case 'doors-badge': reviewBadge(); break;
      case 'doors-print': sendLabel(); break;
      case 'doors-apply':
        if (ui.app === 'access' && ui.grant !== 'print') {
          feedback('The work order authorizes Print through the approved Shipping group. Select that scope to apply the change.', true);
        } else if (ui.app === 'services' && ui.startup !== 'auto') {
          feedback('The dependency must come back after a reboot. Select its persistent startup setting.', true);
        } else if (!data.record.hypothesis) {
          feedback('Record the supported cause in Work Order before changing this machine.', true);
        } else {
          commit('repair');
        }
        break;
    }
  }
  root.TechOpsDayDoors = { view, handle };
})(globalThis);
