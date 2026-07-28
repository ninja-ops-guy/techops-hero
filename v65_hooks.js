// v6.5 "Deep Interviews & Real Faces": type-specific questioning with logically consistent
// answers (signal / neutral / red-herring), varied reasoning outcomes, and a cohesive
// AI-generated NPC sprite cast in the player's art style.
(function () {
  const V65_VER = "6.5.0";

  // ================= NPC sprite cast =================
  const npcImg = new Image();
  if (typeof TO_NPCS !== "undefined") npcImg.src = TO_NPCS;
  const NPC_CELL = 128;
  const NPC_DEPT_IDX = { IT: 0, Infrastructure: 0, Engineering: 1, Marketing: 2, HR: 3, Manufacturing: 4, Executives: 5, Finance: 6, Sales: 7 };
  function npcIdx(n) {
    if (!n) return 1;
    const nm = (n.name || "").toLowerCase();
    if (["mike", "nick", "amit", "brandon", "daniel"].some(k => nm.includes(k))) return 0; // IT crew wears the vest
    if (NPC_DEPT_IDX[n.dept] !== undefined) return NPC_DEPT_IDX[n.dept];
    let h = 0; for (const ch of nm) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return 1 + (h % 7);
  }
  const __origDrawSpr65 = drawSpr;
  drawSpr = function (rows, pal, tx, ty, flip) {
    if (rows === SPR_NPC && npcImg.complete && npcImg.naturalWidth && typeof S !== "undefined" && S && S.npcs) {
      const n = S.npcs.find(n => n.x === tx && n.y === ty);
      const idx = npcIdx(n);
      const dw = 36, dh = 36;
      const bob = Math.sin(performance.now() / 480 + tx * 7 + ty * 3) * 1.1;
      const dx = tx * TILE + (TILE - dw) / 2, dy = ty * TILE + TILE - dh + 3 + bob;
      ctx.drawImage(npcImg, idx * NPC_CELL, 0, NPC_CELL, NPC_CELL, dx, dy, dw, dh);
      return;
    }
    return __origDrawSpr65(rows, pal, tx, ty, flip);
  };

  // ================= questioning phase rework =================
  // Per ticket type: for each question kind, answers that are technically consistent with
  // the TRUE root cause. s = real signal, n = no info, d = plausible red herring (verifiable).
  const ASK_BANKS = {
    _generic: {
      when: { s: ["It started right after the morning login rush — like clockwork.", "It began the moment everyone got back from lunch."], n: ["Sometime today, I think? I wasn't really watching the clock."], d: ["Honestly it's probably just my computer being old."] },
      change: { s: ["IT pushed something overnight — a notice went out about maintenance.", "They moved some equipment around in the rack room yesterday."], n: ["Nothing I noticed. Same desk, same cables."], d: ["I got a new mouse last week? Could that do it?"] },
      repro: { s: ["Every single time I try it, same result. Want me to show you?", "Yes — it fails at the exact same step each time."], n: ["It comes and goes. I can't make it happen on purpose."], d: ["It only breaks when I'm in a hurry, I swear."] },
      scope: { s: ["My whole row has the same problem — we compared notes at standup.", "Just me and the new hire who started Monday."], n: ["Haven't asked around. Everyone seems busy though."], d: ["I heard someone in another building had something similar once."] },
      rebuttal: ["The failing theory contradicts what the user told you — go back to their answers.", "That theory explains the symptom but not the timeline. Check what changed first."]
    },
    printer: {
      when: { s: ["Right after the 9 AM print storm — the queue backed up and never drained.", "Since the big report job this morning. It printed half, then nothing."], n: ["Sometime today. It's a printer, it has moods."], d: ["Ever since they changed the toner brand, I bet it's the toner."] },
      change: { s: ["The print server got patched last night — the banner said so.", "Someone 'helpfully' reseated the network cable in the closet."], n: ["Nothing on my end. I just print."], d: ["New paper stock arrived Monday — probably the paper."] },
      repro: { s: ["Every job sits at 'Spooling' forever, then vanishes. Consistent as sunrise.", "Test page fails the same way from every PC here."], n: ["Sometimes it works, sometimes it doesn't. No pattern."], d: ["It works fine when I kick the side panel, so it's mechanical, right?"] },
      scope: { s: ["The whole department — every one of us points at the same queue.", "Just this floor; downstairs prints fine on their own queue."], n: ["I only print my own stuff, couldn't say."], d: ["Accounting's ancient dot-matrix works, so the network's fine, yeah?"] },
      rebuttal: ["Toner and paper wouldn't explain every PC's jobs stalling in the same queue — think spooler or connectivity, not consumables.", "If the panel-kick 'fix' worked, test pages from other PCs would fail differently. The consistent spool stall is the tell."]
    },
    vpn: {
      when: { s: ["Right after I changed my password through the portal this morning.", "Since the MFA push got a new phone enrolled yesterday."], n: ["Sometime recently — I only VPN from home, so who knows."], d: ["Ever since my ISP 'upgraded' my router. It's definitely them."] },
      change: { s: ["The VPN client updated itself this morning — version banner changed.", "Security rotated certificates; there was an email about re-enrolling."], n: ["Nothing changed at home. Same laptop, same couch."], d: ["I installed a browser extension for coupons. Probably that."] },
      repro: { s: ["Fails at 40% every time — 'verifying credentials', then drops.", "Connects, then dies exactly when I open Outlook. Repeatable."], n: ["Random. Sometimes it just works, which is worse."], d: ["It only fails when my kid's streaming. Bandwidth, obviously."] },
      scope: { s: ["The whole remote sales team is in the group chat about it right now.", "Just me — but I changed my password today and others didn't."], n: ["No idea, I'm the only one remote today I think."], d: ["My neighbor works for a bank and their VPN is fine."] },
      rebuttal: ["ISP and bandwidth theories don't fit a clean credential-stage failure — the handshake never reaches traffic. Think identity, not pipe.", "If it were the home router, it wouldn't fail at the exact same auth percentage every time. The pattern is credential-side."]
    },
    dns: {
      when: { s: ["This morning — intranet names stopped resolving, but IPs still work.", "Right after the network team did 'resolver maintenance' last night."], n: ["Recently. The internet feels 'flaky' is all I know."], d: ["Since the Windows update. Everything breaks after those."] },
      change: { s: ["My PC got a new network profile pushed — DNS addresses look different.", "They migrated a DNS server to the new subnet over the weekend."], n: ["Nothing I changed. I wouldn't know how."], d: ["I cleared my browser history yesterday, maybe that?"] },
      repro: { s: ["Type the name — fails. Type the IP — works. Every time, both.", "nslookup times out on one server, answers on the other. Consistent."], n: ["Sometimes pages load, sometimes they don't. Coin flip."], d: ["It's only slow websites. Fast ones are fine, so it's the websites."] },
      scope: { s: ["Everyone on this VLAN — we all fail resolution together.", "Just me; my neighbor resolves fine on the same switch."], n: ["Haven't compared with anyone."], d: ["The guest Wi-Fi works, so the internet itself is fine, right?"] },
      rebuttal: ["Browser history and Windows updates don't make names fail while IPs succeed — that's resolution, not the client stack.", "If websites were the problem, the IP test wouldn't work. Name-vs-IP asymmetry is the DNS signature."]
    },
    ad: {
      when: { s: ["Since the weekend 'domain maintenance' email — logins take forever since Monday.", "This morning — half my drives didn't map, then my account locked twice."], n: ["Recently. Windows has been 'weird'."], d: ["Since they changed the password policy. It's that."] },
      change: { s: ["I got moved to a new security group for the project last week.", "A domain controller was rebooted during the patching window."], n: ["Nothing I know of — I just log in."], d: ["I got a new monitor. Could that affect logins?"] },
      repro: { s: ["Every login hangs at 'Applying group policy' for minutes. Consistent.", "Lockout happens exactly when my phone tries mail too. Repeatable."], n: ["Sometimes it's fine, sometimes it crawls. No pattern."], d: ["It works if I type my password really slowly. Weird, huh?"] },
      scope: { s: ["Everyone in my OU is seeing the slow logons — we timed it.", "Just me and one other person who got moved groups with me."], n: ["Haven't heard anyone else mention it."], d: ["The boss logs in instantly, so it's not the domain."] },
      rebuttal: ["Password policy and monitors don't cause OU-wide group policy hangs — the scope of the symptom points at replication or policy, not the endpoint.", "Typing speed can't change Kerberos. The repeatable group-policy stall is where the evidence lives."]
    },
    malware: {
      when: { s: ["Since I opened an 'invoice' attachment Monday — pop-ups started that afternoon.", "Right after a 'package delivery' email link. I know, I know."], n: ["A few days now? Things just got slower and weirder."], d: ["Since the antivirus updated. It's probably the antivirus."] },
      change: { s: ["My homepage changed itself and there's a new 'search helper' toolbar.", "A process called 'svchost_update' hogs CPU in task manager."], n: ["Nothing I installed. On purpose. Recently."], d: ["I downloaded a font pack for a flyer. Fonts are safe though, right?"] },
      repro: { s: ["Open the browser — redirects, every time, same fake search page.", "Boot the PC — fan spins up and the unknown process is back. Consistent."], n: ["It just feels cursed at random times."], d: ["It only acts up when the antivirus scans, so it's that."] },
      scope: { s: ["Just me — but two others opened the same 'invoice' email.", "Only my machine. Everyone else is clean."], n: ["Don't know, haven't told anyone. Embarrassing."], d: ["The intern's PC is slow too, so maybe it's the network."] },
      rebuttal: ["Antivirus and font packs don't change homepages or respawn unknown processes — the persistence mechanism is the target, not the scanner.", "A network cause wouldn't follow one user across reboots. The reproducible boot-time process is the anchor point."]
    },
    email: {
      when: { s: ["Since the mailbox migration notice — half my folders show 'syncing' forever.", "This morning: I can receive but every send bounces with a 550 error."], n: ["Recently. Outlook 'acts up' sometimes."], d: ["Since I hit 90% mailbox quota. It's just full, right?"] },
      change: { s: ["My mailbox got moved to the new tenant over the weekend.", "They changed our sending domain's SPF record for the marketing tool."], n: ["Nothing on my side. Outlook updated itself maybe?"], d: ["I created a bunch of inbox rules last week. Probably those."] },
      repro: { s: ["Send anything external — bounces in 30 seconds with the same code.", "Search any old mail — results come back empty. Every time."], n: ["Off and on. Some mails go, some don't."], d: ["It works on my phone, so it must be this PC."] },
      scope: { s: ["The whole migrated batch of users has the same sync stalls.", "Only external sends fail — internal mail is fine for everyone."], n: ["Just me complaining, I think."], d: ["My phone works, so the server's fine."] },
      rebuttal: ["Quota and inbox rules don't produce a consistent 550 bounce code — the error text is the evidence, not the mailbox size.", "If 'the PC' were the cause, the same failure wouldn't follow the account to webmail. Identity-side beats device-side."]
    },
    bsod: {
      when: { s: ["Since the new engineering driver installed Monday — crashes at the same app launch.", "Right after the RAM upgrade the vendor did last week."], n: ["Random blue screens lately. Computers, am I right?"], d: ["Since I started charging my phone off the USB port. Power drain?"] },
      change: { s: ["A kernel driver updated for the new CAD accelerator card.", "Thermal paste was 're-done' during the bench visit — fans sound louder now."], n: ["Nothing changed that I know of."], d: ["I moved the PC under my desk. Maybe it's cramped?"] },
      repro: { s: ["Launch the CAD viewer — blue screen in under a minute. Every time.", "Run a memory-heavy render — dies at the same percentage. Repeatable."], n: ["Completely random. Middle of typing an email, even."], d: ["It never crashes in safe mode, so the hardware's fine, yeah?"] },
      scope: { s: ["Everyone who got the driver push is crashing — the bench is backed up.", "Just the machines that got the RAM batch from that vendor."], n: ["Only mine as far as I know."], d: ["The laptops never crash, so it's desktops."] },
      rebuttal: ["USB charging and desk placement don't produce the identical stop code at the identical action — driver or memory, not environment.", "'No crash in safe mode' points AT drivers, not away from them — safe mode loads none of them."]
    },
    plc: {
      when: { s: ["Since line 3's HMI froze during the morning run — the fault code hasn't cleared.", "Right after the controls vendor 'optimized' the ladder logic remotely."], n: ["Today sometime. The line just stopped."], d: ["Since the new operator started. He touches things."] },
      change: { s: ["They swapped an I/O card in cabinet B during the last PM.", "The SCADA network got re-patched into the new switch yesterday."], n: ["Nothing scheduled. Line ran fine all month."], d: ["The floor got pressure-washed over the weekend. Moisture?"] },
      repro: { s: ["Fault trips exactly when the conveyor hits speed setpoint 4. Every cycle.", "The interlock drops the moment the robot home routine runs. Repeatable."], n: ["Random stops. No pattern we've found."], d: ["It runs fine on second shift, so it's the crew."] },
      scope: { s: ["Just cell 3 — cells 1 and 2 run the same program clean.", "Every line on that switch uplink shows the same comms errors."], n: ["Only our line, I think."], d: ["Maintenance says the motor's fine, so it's not mechanical, probably."] },
      rebuttal: ["Operators and pressure-washing don't produce a setpoint-correlated fault — the trigger is a parameter, I/O, or comms, not the humans.", "If 'the crew' caused it, second shift would fault at random — but it faults at a specific setpoint. Follow the setpoint."]
    },
    wifi: {
      when: { s: ["Since the new AP was mounted in the corridor — dead zone by the conference rooms.", "Right after the controller pushed the new firmware ring Monday."], n: ["Wi-Fi's been sad for days."], d: ["Since the microwave in the break room got replaced. It's huge."] },
      change: { s: ["Channel plan changed — all the APs are now stacked on channel 6.", "They enabled band steering and our older scanners only do 2.4."], n: ["Nothing I did. Same laptop, same seat."], d: ["My phone got a new case. Metal, maybe?"] },
      repro: { s: ["Walk to the east corridor — drops at the same spot, reconnects back here.", "Speed test at my desk: 4 Mbps down every time; at the AP: 400."], n: ["Random dropouts. Can't predict them."], d: ["It's worse at lunch, so it's people blocking the signal, right?"] },
      scope: { s: ["Everyone on this floor's east side reports the same dead zone.", "Just the older devices — new laptops are fine on 5 GHz."], n: ["Haven't surveyed anyone."], d: ["My phone is fine, so the Wi-Fi's fine."] },
      rebuttal: ["Microwaves and phone cases don't create a repeatable geographic dead zone — coverage and channel planning are physical, testable things.", "If 'people' blocked the signal, failures wouldn't cluster by device generation. The 2.4/5 GHz split is the clue."]
    },
    cert: {
      when: { s: ["Since Monday — the red warning appeared on the portal for everyone at once.", "Right after the CA renewed 'as scheduled' — except someone forgot the load balancer."], n: ["Recently. Browsers complain about the site."], d: ["Since my browser updated. It's the browser."] },
      change: { s: ["The cert on the public site shows a new expiry — but the internal one looks ancient.", "They migrated the site behind the new reverse proxy over the weekend."], n: ["Nothing on my end."], d: ["I cleared my cookies. Maybe I deleted the certificate?"] },
      repro: { s: ["Every browser, every machine — same warning, same cert details.", "curl shows the expired intermediate in the chain. Every time."], n: ["Some people see it, some don't, some days."], d: ["If I click 'advanced → proceed' it works, so it's not real, yeah?"] },
      scope: { s: ["Company-wide — every user hitting the portal gets the warning.", "Only traffic through the new proxy path; direct IP is clean."], n: ["Just heard it from one person."], d: ["Chrome warns but Edge is fine for me, so it's Chrome."] },
      rebuttal: ["Browsers and cookies don't mint identical warnings on every machine — the chain itself is wrong, and it's served to everyone equally.", "'Proceed anyway' bypasses the check, not the expiry. The clock doesn't care which browser asks."]
    },
    disk: {
      when: { s: ["Since the big data import Friday — free space fell off a cliff.", "Right after backups started failing with 'insufficient space' errors."], n: ["Recently. It says the disk is full a lot."], d: ["Since I installed the game launcher. It's 100 gigs, probably that."] },
      change: { s: ["The file share got a new archive policy — nothing is being archived though.", "WinSxS and update caches ballooned after the failed feature update."], n: ["I don't install anything. It just fills up."], d: ["My photos folder synced down. It's my photos, isn't it?"] },
      repro: { s: ["Run the report export — dies at the same point with disk-full. Every time.", "Delete 5 GB, watch it refill overnight. Repeatable for three days."], n: ["Sometimes it warns, sometimes not."], d: ["If I empty the recycle bin it's fine for a bit, so it's just trash."] },
      scope: { s: ["Every machine that ran the import script shows the same cliff.", "Just this file server — the others trend flat."], n: ["Only mine that I know of."], d: ["The new laptops have bigger drives and don't complain, so it's old drives."] },
      rebuttal: ["Game launchers and photo syncs don't refill 5 GB nightly on a schedule — something writes on a timer. Find the writer, not the biggest folder.", "Bigger drives only delay the symptom; the growth rate is the disease. Capacity is not root cause."]
    },
    update: {
      when: { s: ["Since Tuesday's patch window — half the floor got the update, half are pending.", "Right after the WSUS server was rebuilt last month."], n: ["Updates have been weird lately."], d: ["Since I clicked 'remind me tomorrow' a lot. It's me, isn't it?"] },
      change: { s: ["The update ring policy changed — our group moved to the fast ring.", "A cumulative update failed and rolled back twice on these machines."], n: ["Nothing I changed. It updates itself."], d: ["I shut my laptop at 5 PM sharp daily. That's it, right?"] },
      repro: { s: ["Check for updates — spins, then the same 0x800 error. Every time.", "The same three updates install, fail, and roll back in a loop. Repeatable."], n: ["Sometimes it works after a reboot, sometimes not."], d: ["If I update at home it works, so it's the office network."] },
      scope: { s: ["Every machine in the fast ring shows the same error code.", "Just the machines that failed the first cumulative attempt."], n: ["Only heard it from me, maybe."], d: ["The new imaging PCs update fine, so it's old installs."] },
      rebuttal: ["Snoozing reminders and early shutdowns don't mint the same error code on a whole ring — the ring or the servicing stack is broken, not the user habit.", "Working-from-home success still goes through the same client — the common point is the update source, not the LAN."]
    },
    share: {
      when: { s: ["Since the permission restructure — the project folder denies people it shouldn't.", "Right after the file server migration over the weekend."], n: ["Recently. The drive 'acts up'."], d: ["Since I mapped it with a different letter. It's the letter."] },
      change: { s: ["I was added to the project group Monday — but the folder says access denied.", "They tightened NTFS permissions and something broke inheritance."], n: ["Nothing on my side."], d: ["I renamed one of my files. Could that break it?"] },
      repro: { s: ["Open the share — denied. Open via the server's IP — same. Every time.", "Colleague opens the identical folder fine from the desk next to me. Repeatable."], n: ["Sometimes it connects, sometimes it asks for a password."], d: ["It works after I reboot, so it's my PC."] },
      scope: { s: ["Everyone added in the Monday batch is denied; older members are fine.", "Just one subfolder — everything else on the share works for all."], n: ["Haven't polled the team."], d: ["Mapped drives fail but UNC works for me, so it's mapping."] },
      rebuttal: ["Drive letters and reboots don't change ACLs — the denial follows the account across paths, which makes it identity and permissions.", "If 'mapping' were broken, UNC-vs-letter would differ for everyone. It differs per person — that's group membership."]
    },
    vlan: {
      when: { s: ["Since my desk moved to the third floor Monday — laptop gets no IP at all.", "Right after the switch stack in IDF-2 was replaced."], n: ["Since the move. Network's dead here."], d: ["Since I got a new docking station. It's the dock."] },
      change: { s: ["The port I'm on shows up in the wrong subnet — DHCP offers are from the guest range.", "They re-patched the wall jacks during the floor rewire."], n: ["Nothing I changed. Plugged in like always."], d: ["I coiled my ethernet cable tighter. Bad coil?"] },
      repro: { s: ["Plug in at my desk — 169.254 address, every time.", "Same laptop on my neighbor's port gets a proper address. Repeatable."], n: ["Sometimes it grabs an address after a long wait."], d: ["Wi-Fi works at my desk, so the network's fine."] },
      scope: { s: ["Everyone who moved with me is on the wrong subnet.", "Just my row of ports — the other row is correct."], n: ["Only tried my own port."], d: ["Desktop phones on the same jacks work, so it's not the jack."] },
      rebuttal: ["Docks and cable coils don't hand out the wrong subnet — DHCP offers come from the port's VLAN, and the port's VLAN is config, not hardware.", "Phones working proves the jack passes traffic — voice VLAN. The data VLAN assignment is the broken piece."]
    },
    backup: {
      when: { s: ["Since the backup window was shortened — jobs started overrunning into production hours.", "Right after the repository disk was expanded Friday."], n: ["Backups 'fail sometimes' lately."], d: ["Since daylight saving time. The schedule got confused."] },
      change: { s: ["The retention policy changed — increments are kept far longer now.", "A new agent rolled out to the database servers Monday."], n: ["Nothing on the server that I know."], d: ["We added more files. It's just more data, right?"] },
      repro: { s: ["The finance DB job fails at 94% every single night, same error.", "Retry the job manually — fails at the identical file. Repeatable."], n: ["Random failures, different jobs, no pattern."], d: ["If I kick it off early it succeeds, so it's timing."] },
      scope: { s: ["All jobs through that repository fail; the other repo is clean.", "Just the DB agents — file-level backups pass."], n: ["Only the failures I get emailed about."], d: ["The test backups work, so the system's fine."] },
      rebuttal: ["Clock changes and data growth don't fail one job at 94% nightly — something specific breaks at the tail of that transfer. Look at the file, not the schedule.", "Manual reruns failing at the identical byte rule out 'timing' — determinism is the fingerprint of a real fault."]
    },
    slowpc: {
      when: { s: ["Since the 'optimization tool' the last tech installed — boot takes five minutes now.", "Right after the disk hit 95% full last week."], n: ["It got slow gradually. Old age?"], d: ["Since I opened too many browser tabs. It's the tabs."] },
      change: { s: ["Eight startup items appeared in Task Manager that I never approved.", "Windows is pending a reboot for an update it keeps deferring."], n: ["Nothing I installed. It just got tired."], d: ["I have a lot of desktop icons. Heard that's bad."] },
      repro: { s: ["Boot it — 100% disk for five minutes, same processes topping the list.", "Open the big spreadsheet — stalls at the same recalc step. Repeatable."], n: ["Just generally sluggish, no specific trigger."], d: ["It's fastest after lunch. Mysterious, right?"] },
      scope: { s: ["Everyone who got that 'optimization' image has the same five-minute boot.", "Just my machine — identical hardware next to me is fast."], n: ["Haven't compared with colleagues."], d: ["New PCs are fast, so it's just that mine is old."] },
      rebuttal: ["Tabs and desktop icons don't pin disk at 100% for exactly five minutes at boot — the startup list and disk queue are measurable, the vibes aren't.", "'Old age' explains gradual slowdown, not a step change after a specific install. The step change is the story."]
    },
    shadow: {
      when: { s: ["Since the new SaaS dashboard appeared — people sign in with their work SSO.", "Right after procurement 'fast-tracked' that AI note-taking tool."], n: ["Recently. There are just... more tools now."], d: ["Since IT got slow at approving things. You made us do it."] },
      change: { s: ["Three new apps appeared in the SSO logs that nobody here approved.", "An OAuth consent grant went to a domain registered last month."], n: ["Nothing official changed."], d: ["The team started using a shared spreadsheet. That's sanctioned though?"] },
      repro: { s: ["Check the proxy logs — steady callbacks to the same unknown API host.", "Revoke the consent — it reappears within a day. Repeatable."], n: ["It's invisible until you look at the logs."], d: ["It's just the marketing analytics pixel. Marketing pixels are fine."] },
      scope: { s: ["Twelve accounts hold grants to it, across four departments.", "One department championed it; the usage spans everyone though."], n: ["No idea how far it goes. That's the scary part."], d: ["Only power users touch it, so the blast radius is small."] },
      rebuttal: ["Approval-queue complaints don't mint OAuth grants — the consent records are dated, signed, and specific. Follow the grants, not the grievances.", "Pixels don't request offline_access. The scope of the permissions is the tell that it's more than marketing."]
    },
    apt: {
      when: { s: ["The badge anomalies go back 243 days — to the week she arrived.", "The 03:00 beaconing started the same week the café scans appeared."], n: ["Patterns stretch back months. Hard to say exactly."], d: ["The printer thing was real though. Printers just break."] },
      change: { s: ["Her access expanded 'temporarily' for an integration project — and never reverted.", "Rack 04 got a new uplink module she signed for."], n: ["Routine contractor churn. Nothing flagged."], d: ["The launch schedule shifted. Launch weeks are always weird."] },
      repro: { s: ["Correlate badge, camera and beacon on one timeline — the gaps align. Every time.", "Revoke nothing, watch quietly — the pattern repeats nightly."], n: ["It's a pattern, not a single reproducible event."], d: ["If I badge in early too, the logs will look the same. See?"] },
      scope: { s: ["Only her badge correlates across all three anomaly streams.", "Contractors are many; the intersection is one person."], n: ["Unclear who else might be involved."], d: ["Other people work late too. It's a startup mindset."] },
      rebuttal: ["Launch-week chaos explains noise, not a 243-day correlation across three independent systems. Patterns that survive three lenses aren't noise.", "Early badging by others would create new anomalies — it wouldn't erase hers. The correlation is person-specific."]
    },
    av_hdmi: {
      when: { s: ["Right at 9:00 when the all-hands started — screen stayed dark on every input.", "Since the room control panel got 'simplified' last week."], n: ["Sometime before the meeting. It just says No Signal."], d: ["Since Facilities moved the table. Maybe a cable got pinched?"] },
      change: { s: ["The room's HDMI run was re-terminated during the wall repair.", "Someone swapped the presentation laptop to a USB-C-only one."], n: ["Nothing I know of. I just booked the room."], d: ["New TV firmware updated overnight. It's the TV."] },
      repro: { s: ["Select HDMI-1 — black screen. HDMI-2 — works with the spare cable. Every time.", "Any laptop on that input shows the same No Signal. Repeatable."], n: ["Sometimes it syncs after a few minutes."], d: ["It works with my personal laptop, so it's the company image."] },
      scope: { s: ["Every presenter in that room, on every laptop.", "Just that one input — wireless casting still works for everyone."], n: ["Only tried it once myself."], d: ["The other rooms are fine, so it's not the AV system."] },
      rebuttal: ["TV firmware doesn't kill one input while its twin works — the fault lives in the cable path, not the display.", "If it were the laptop image, wireless casting would fail too. Compare paths, not devices."]
    },
    av_teams: {
      when: { s: ["Since Monday — the room joins meetings but nobody hears us.", "Right after the Teams Rooms update ring hit our floor."], n: ["Recently. The room 'acts offline'."], d: ["Since they repainted the room. Paint fumes in the mic?"] },
      change: { s: ["The room account's password rotated and the console never signed back in.", "The new firmware moved the mic input to a different default device."], n: ["Nothing changed that I saw."], d: ["The calendar integration is just slow. It's Exchange."] },
      repro: { s: ["Join any meeting — remote side sees us, hears nothing. Every time.", "Device settings show the wrong microphone selected. Repeatable."], n: ["Sometimes audio works, sometimes not."], d: ["If I dial in from my phone it works, so it's Teams itself."] },
      scope: { s: ["Both Teams Rooms on the floor show the same muted-uplink symptom.", "Just this one console; the others updated fine."], n: ["Only used this room."], d: ["My laptop Teams is fine, so it's the room hardware dying."] },
      rebuttal: ["Exchange latency and phone dial-ins don't explain a room console picking the wrong mic after an update — check the device's defaults, not the cloud.", "If Teams 'itself' were down, laptops would fail too. The failure is room-scoped, so the room is where you fix it."]
    },
    plant_scanner: {
      when: { s: ["Since the morning shift — scans lag thirty seconds behind the beep.", "Right after the warehouse Wi-Fi got 'optimized' onto fewer APs."], n: ["Today sometime. The scanners feel slow."], d: ["Since the new label stock. Heavier labels slow the line?"] },
      change: { s: ["The scanner fleet got a config push changing the roaming threshold.", "The WMS gateway moved to the new data hall over the weekend."], n: ["Nothing on the line itself."], d: ["Operators got new gloves. Touch issues?"] },
      repro: { s: ["Walk the aisle — scans queue up at the same two spots, flush all at once.", "Ping the gateway from a scanner — spikes at the same roaming handoff. Repeatable."], n: ["Random lag. Can't pin it down."], d: ["If I reboot the scanner it's fast for a while, so it's the scanner."] },
      scope: { s: ["Every scanner on the north aisles; the south side is clean.", "Just the oldest scanner models — new ones roam fine."], n: ["Only my scanner that I know."], d: ["Forklifts block the signal. It's the forklifts."] },
      rebuttal: ["Gloves and forklifts don't make lag cluster at fixed aisle spots — geography-correlated latency is RF or roaming, not the human factor.", "Rebooting masks a roaming problem for exactly as long as the scanner stays on one AP. The flush-at-handoff pattern is the tell."]
    },
    label_printer: {
      when: { s: ["Since the shipping rush — labels come out blank every few pages.", "Right after someone 'recalibrated' it mid-shift yesterday."], n: ["Today sometime. It prints weird."], d: ["Since the new ribbon brand. It's the ribbon."] },
      change: { s: ["The darkness setting got maxed and the head's leaving streaks.", "They switched from direct-thermal to transfer stock without changing the mode."], n: ["Nothing on my station."], d: ["The cutter blade is dull. It's mechanical."] },
      repro: { s: ["Print ten labels — blanks at the same interval, like a rotation mark.", "Self-test page shows the same streak column. Repeatable."], n: ["Random quality issues."], d: ["If I slam it, one good label comes out."] },
      scope: { s: ["All stations printing through that queue see the same blanks.", "Just this printer — the other two print clean."], n: ["Only ship from my station."], d: ["It worked yesterday, so it's today-specific?"] },
      rebuttal: ["A dull cutter can't blank a label at rotation intervals — print-mode and darkness are settings, and settings are where periodic defects live.", "Slamming 'fixes' contact, not configuration. The self-test reproduces it with no human involved — trust the self-test."]
    },
    hw_replace: {
      when: { s: ["The battery report shows 40% health — it's been dying for months, worse lately.", "Since the last BIOS update it takes three tries to POST."], n: ["It's just old and tired."], d: ["Since I dropped it last year. It's the drop, finally catching up."] },
      change: { s: ["Warranty expired in March — it's officially past end-of-life now.", "The vendor discontinued the model; parts are refurb-only."], n: ["Nothing changed, it's cumulative."], d: ["I filled the hard drive recently. It's the drive."] },
      repro: { s: ["Cold boot — fails POST twice, then starts. Every morning.", "Run the battery down — dies at 30% instantly. Repeatable."], n: ["Random old-laptop nonsense."], d: ["If I keep it plugged in it's fine, so it's the charger."] },
      scope: { s: ["The whole batch from that purchase year is on your bench this month.", "Just this unit; the rest of the batch already got replaced."], n: ["Only mine."], d: ["Everyone's old laptops are slow, so it's normal."] },
      rebuttal: ["Drops and chargers don't make a battery die at 30% or POST fail on schedule — age and component wear are measured in reports, not memories.", "'Normal' for a fleet still has a per-device root: the lifecycle data is the evidence here. Read the reports, not the vibes."]
    },
  };

  const KIND_Q = {
    when: "“When did this start?”",
    change: "“What changed recently?”",
    repro: "“Can you reproduce it?”",
    scope: "“Is anyone else affected?”"
  };

  function v65Ask(nQ, ability) {
    const s = S;
    const bank = ASK_BANKS[B.t.id] || ASK_BANKS._generic;
    B._asked = B._asked || [];
    const kinds = ["when", "change", "repro", "scope"].filter(k => !B._asked.includes(k));
    const qs = kinds.slice(0, nQ);
    if (!qs.length) {
      blog(`<span class="sys">🗣️ You've covered the basics — the answers are on the table. Inspect, prune, hypothesize.</span>`);
      renderBattle(); updateHUD(); return;
    }
    addStress(ability && ability.stress || 0);
    addXP(2);
    B.seq.push("ask");
    B.evidence += nQ;
    const w = (EVIDENCE_WEIGHTS[B.t.id] || {}).testimony || 2;
    const big = nQ > 1;
    for (const k of qs) {
      B._asked.push(k);
      const cell = bank[k];
      const r = Math.random();
      let kind, txt;
      const canDistract = (B.leads || 0) < 2;
      if (canDistract && r < .22) { kind = "d"; txt = pick(cell.d); B.leads = (B.leads || 0) + 1; }
      else if (r < .62) { kind = "s"; txt = pick(cell.s); }
      else { kind = "n"; txt = pick(cell.n); }
      blog(`<span class="sys">🗣️ ${KIND_Q[k]}</span>`);
      const cg = Math.round(w * R(4, 7) * (big ? 1.3 : 1));
      if (kind === "s") {
        const du = R(14, 20);
        B.uncertainty = clamp(B.uncertainty - du, 0, 100);
        B.confidence = clamp(B.confidence + cg, 0, 100);
        blog(`<span class="heal">💬 ${txt} <i>(−${du}% uncertainty, +${cg} confidence — that points somewhere)</i></span>`);
        const live = B.branches ? B.branches.filter(b => !b.dead && !b.correct) : [];
        if (live.length && Math.random() < .4) {
          const b = pick(live); b.dead = true;
          blog(`<span class="sys">🧩 ...which rules out <s>${b.text}</s>.</span>`);
        }
      } else if (kind === "d") {
        const du = R(4, 8);
        B.uncertainty = clamp(B.uncertainty - du, 0, 100);
        B.confidence = clamp(B.confidence + Math.round(cg * .3), 0, 100);
        blog(`<span class="dmg">💬 ${txt} <i>(plausible… but verify before you chase it)</i></span>`);
        B._redHerring = (B._redHerring || 0) + 1;
      } else {
        const du = R(8, 12);
        B.uncertainty = clamp(B.uncertainty - du, 0, 100);
        B.confidence = clamp(B.confidence + Math.round(cg * .6), 0, 100);
        blog(`<span class="sys">💬 ${txt}</span>`);
      }
    }
    // the user self-corrects after enough red herrings — the world stays consistent
    if ((B._redHerring || 0) >= 2 && !B._corrected) {
      B._corrected = true;
      const live = B.branches ? B.branches.filter(b => !b.dead && !b.correct) : [];
      if (live.length) {
        const b = pick(live); b.dead = true;
        blog(`<span class="heal">💬 "Wait — actually, scratch what I said earlier. It's definitely not ${b.text.toLowerCase()}." <i>(lead corrected — branch ruled out)</i></span>`);
      }
    }
    if (big) blog(`<span class="sys">🗣️ Guided interview: the user walks you through the whole failure timeline.</span>`);
    pruneBranches();
    renderBattle(); updateHUD();
  }

  const __origWFA65 = workflowAction;
  workflowAction = function (a) {
    if (B && !B.over && a && a.cat === "ask") {
      return v65Ask(a.id === "interview" ? 2 : 1, a);
    }
    return __origWFA65(a);
  };

  // ================= reasoning phase: varied, consistent outcomes =================
  const __origRH65 = resolveHypothesis;
  resolveHypothesis = function (correct) {
    if (B && !correct) {
      const bank = ASK_BANKS[B.t.id] || ASK_BANKS._generic;
      blog(`<span class="sys">🔍 Post-mortem: ${pick(bank.rebuttal)}</span>`);
      // a failed test still yields information: one wrong branch provably dies
      const live = B.branches ? B.branches.filter(b => !b.dead && !b.correct) : [];
      if (live.length && Math.random() < .5) {
        const b = pick(live); b.dead = true;
        blog(`<span class="sys">🌳 The failed test wasn't wasted — <s>${b.text}</s> is provably eliminated.</span>`);
      }
    }
    return __origRH65(correct);
  };

  window.v65Ask = v65Ask; window.ASK_BANKS = ASK_BANKS; window.npcIdx = npcIdx;
  console.log(`[v6.5] Deep Interviews & Real Faces loaded (${V65_VER})`);
})();