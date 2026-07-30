/* ============================================================
   TechOps Hero v7.14 — DECISION TREE
   The troubleshooting dialog was static: the same three questions
   every ticket, each eliminating a random wrong answer with a
   one-line shrug. v7.14 replaces it with a real diagnostic
   flowchart per ticket type:

   - DYNAMIC OPTIONS — every question offers 2–3 observable
     answers ("Just me" / "The whole team"), and the answer you
     pick determines what gets eliminated AND what question is
     suggested next. Two players troubleshooting the same ticket
     walk different branches.
   - VISIBLE HYPOTHESIS SPACE — the candidate root causes are
     listed live and struck through as evidence rules them out,
     each with the REASON (the educational part): "Instant denial
     = the server answered with an ACL decision — a path that
     reaches the server doesn't need remapping."
   - REAL METHODOLOGY — every tree is built from genuine
     helpdesk practice: scope questions first (one user or
     everyone?), then layer-splitting (works by IP? one band?
     send or receive?), then evidence (what does the log say?).
     Same costs/rewards as before (+5 min, +5 conf per question,
     methodical bonus at conclusion).
   ============================================================ */
(function () {
  "use strict";

  /* Each node: q = the question you ask / test you run.
     Each answer: t = what's observed, elim = wrong hypotheses it
     rules out (exact strings from TICKET_TYPES.diag.wrong),
     why = the teaching moment, next = suggested follow-up node. */
  const DT = {
    printer: [
      { id: "scope", short: "Scope", q: "👥 \"Is ANYONE able to print right now?\"", answers: [
        { t: "Nobody can print", elim: ["Reinstall the printer driver", "Replace the toner cartridge"], why: "A shared queue down for everyone lives on the print server — no single client driver or toner cartridge can take down every user at once.", next: "queue" },
        { t: "Just me", elim: ["Power-cycle the network switch", "Update the printer firmware"], why: "One client affected while everyone else prints fine — the network path and the printer itself are proven healthy by the crowd.", next: "queue" } ] },
      { id: "queue", short: "Queue", q: "🖨️ \"Open the queue — what do the jobs do?\"", answers: [
        { t: "Jobs pile up, then vanish", elim: ["Reinstall the printer driver", "Power-cycle the network switch"], why: "Jobs REACH the queue and die inside it — a spooler crash loop. The driver and network only matter upstream of the queue, and the jobs are clearly arriving.", next: null },
        { t: "Queue is empty, jobs never arrive", elim: ["Update the printer firmware", "Replace the toner cartridge"], why: "Nothing reaches the spooler — the submission path is broken, so printer-side consumables and firmware can't be the fault.", next: null } ] } ],
    vpn: [
      { id: "stage", short: "Stage", q: "🚇 \"Where exactly does the connection die?\"", answers: [
        { t: "During the handshake, before login", elim: ["Flush DNS and release/renew IP", "Lower the MTU on the NIC"], why: "IKE negotiates with the gateway IP over UDP 500/4500 — name resolution and MTU clamping only matter AFTER the tunnel exists.", next: "reach" },
        { t: "Authenticates, then drops", elim: ["Reinstall the VPN client", "Reboot the user's router"], why: "A tunnel that forms and then dies is a cert/NAT-T/session problem — the client app has already proven it can complete a handshake.", next: "reach" } ] },
      { id: "reach", short: "Reachability", q: "📡 \"Can you ping the VPN gateway by IP?\"", answers: [
        { t: "Replies fine", elim: ["Reboot the user's router", "Flush DNS and release/renew IP"], why: "Gateway reachable by IP — local routing and name resolution both work. The fault is inside the tunnel negotiation itself: certs, IKE ports, profile.", next: null },
        { t: "No reply at all", elim: ["Reinstall the VPN client", "Lower the MTU on the NIC"], why: "If the gateway doesn't answer at all, the problem is below the VPN layer — reinstalling the app or tweaking MTU can't fix a dead path.", next: null } ] } ],
    dns: [
      { id: "split", short: "Layer split", q: "📖 \"Browse to the site by IP address — does it load?\"", answers: [
        { t: "Yes — IP works, names don't", elim: ["Reboot the core switch", "Replace the WiFi access point"], why: "Traffic flows by IP, so layers 1–3 are healthy end to end. Only name resolution is broken — switches and APs forward packets regardless of names.", next: "scope" },
        { t: "No — nothing loads at all", elim: ["Reset the user's browser profile", "Re-image the workstation"], why: "A total outage is below DNS, and a total outage is never cured by nuking one browser profile or re-imaging — you'd be treating the wrong layer.", next: "scope" } ] },
      { id: "scope", short: "Scope", q: "🌐 \"Which names fail — one site, or everything?\"", answers: [
        { t: "Just our internal sites", elim: ["Replace the WiFi access point", "Re-image the workstation"], why: "Public names resolve, internal names don't — the fault is in OUR records or forwarders, not the client's hardware or OS.", next: null },
        { t: "Everything, for everyone", elim: ["Reset the user's browser profile", "Re-image the workstation"], why: "Company-wide resolution failure lives on the DNS servers — no client-side wipe can touch a server everyone shares.", next: null } ] } ],
    ad: [
      { id: "pattern", short: "Pattern", q: "⛪ \"When does the account lock?\"", answers: [
        { t: "Within minutes of every unlock", elim: ["Reset the user's password", "Clear the credential manager only"], why: "Instant re-lock means something is actively retrying a stored credential. A new password doesn't stop the old one hammering — and Credential Manager is only one cache of many (mapped drives, phones, scheduled tasks).", next: "follows" },
        { t: "Randomly, once or twice a day", elim: ["Disable the lockout policy", "Rejoin the machine to the domain"], why: "Sporadic locks smell like a scheduled task or mobile device with a stale password firing on a timer. Disabling the policy just hides the alarm, and domain trust isn't involved.", next: "follows" } ] },
      { id: "follows", short: "Follows user?", q: "🚶 \"Log in at a different PC — does the lockout follow you?\"", answers: [
        { t: "Yes, any machine locks me out", elim: ["Rejoin the machine to the domain", "Clear the credential manager only"], why: "It follows the USER, not the device — the culprit is something acting as you from elsewhere (phone, mapped drive, service account). This machine's domain relationship and local caches are innocent.", next: null },
        { t: "No, only on this PC", elim: ["Disable the lockout policy", "Reset the user's password"], why: "Local to one box — a saved credential on THIS machine is retrying. Event 4740 names the caller computer; changing the password or the policy never finds it.", next: null } ] } ],
    malware: [
      { id: "behavior", short: "Behavior", q: "☣️ \"What exactly are the pop-ups?\"", answers: [
        { t: "Fake antivirus demanding payment", elim: ["Block the pop-up domain in DNS", "Reinstall the browser"], why: "Scareware runs LOCALLY as an installed program — it isn't coming from a website, so DNS blocks and browser reinstalls treat the wrong layer entirely.", next: "spread" },
        { t: "Ads injected into every page", elim: ["Delete the temp internet files", "Reinstall the browser"], why: "Injection into every page is an adware extension or process on the host — cached files and a fresh browser binary don't remove a resident extension.", next: "spread" } ] },
      { id: "spread", short: "Spread", q: "🧫 \"Anyone else on your floor seeing this?\"", answers: [
        { t: "Yes, two coworkers have it too", elim: ["Run the antivirus scan immediately", "Delete the temp internet files"], why: "Multiple hosts means possible lateral movement — ISOLATE first. Scanning a live, spreading infection just announces you're onto it and lets it keep moving.", next: null },
        { t: "Just me", elim: ["Block the pop-up domain in DNS", "Delete the temp internet files"], why: "A single-host infection came from content or a download on this machine — network-level blocks and cache clears don't remove a local payload.", next: null } ] } ],
    email: [
      { id: "split", short: "Client/server", q: "📬 \"Log into webmail (OWA) in a browser — does it work there?\"", answers: [
        { t: "OWA works — only Outlook is broken", elim: ["Whitelist the domain in spam filter", "Restart the user's PC twice"], why: "The server delivers to the web client fine, so the mailbox and queues are healthy. Spam filters gate INBOUND mail, and reboots don't repair a client profile.", next: "direction" },
        { t: "OWA is broken too", elim: ["Recreate the Outlook profile", "Repair Office from Programs & Features"], why: "Every client failing means the problem is server-side — Exchange services, queues or auth. No amount of client reinstalling reaches a server fault.", next: "direction" } ] },
      { id: "direction", short: "Direction", q: "📤 \"Is it sending, receiving, or both?\"", answers: [
        { t: "Receives fine, can't send", elim: ["Repair Office from Programs & Features", "Recreate the Outlook profile"], why: "One-directional failure points at submission — the outgoing queue or auth tokens on the server — not the local mail profile.", next: null },
        { t: "Nothing syncs at all", elim: ["Restart the user's PC twice", "Whitelist the domain in spam filter"], why: "Total sync failure is authentication or service health — reboots don't mint tokens, and spam lists have nothing to do with syncing.", next: null } ] } ],
    bsod: [
      { id: "pattern", short: "Pattern", q: "💙 \"When does it crash?\"", answers: [
        { t: "Same app or driver every time", elim: ["Run a full memory test first", "Check for overheating components"], why: "A reproducible, software-correlated crash is a CODE path, not failing hardware — the minidump names the faulting module. Analyze it before suspecting silicon.", next: "boot" },
        { t: "Random, usually under load", elim: ["Update every driver on the machine", "Reinstall Windows cleanly"], why: "Load-correlated random crashes CAN be thermal or RAM — but the dump still comes first. Shotgunning drivers or reinstalling destroys the very evidence you need.", next: "boot" } ] },
      { id: "boot", short: "Boot timing", q: "🔌 \"Does it ever crash before the login screen?\"", answers: [
        { t: "Yes, during boot", elim: ["Reinstall Windows cleanly", "Update every driver on the machine"], why: "Boot-time crashes point at boot drivers or storage — read the dump from safe mode before wiping the OS and losing the trail.", next: null },
        { t: "Only after hours of use", elim: ["Run a full memory test first", "Reinstall Windows cleanly"], why: "Hours-in crashes smell like heat or marginal RAM — still prove it with the dump (it's free and takes minutes) before committing to a 12-hour memtest.", next: null } ] } ],
    plc: [
      { id: "link", short: "Link state", q: "🏭 \"What do the switch link lights say on that port?\"", answers: [
        { t: "Link light is dead", elim: ["Update the SCADA software", "Restart the engineering workstation"], why: "No link light is layer 1/2 — nothing on any host matters until the port comes up. Software can't fix a dead physical path.", next: "segment" },
        { t: "Link up, but ping fails", elim: ["Replace the ethernet cable", "Reboot the PLC cabinet"], why: "Link up with no ping means frames flow but land in the wrong broadcast domain — a VLAN or trunk tag issue, not cabling and not the controller itself.", next: "segment" } ] },
      { id: "segment", short: "Segment scope", q: "🔌 \"Are the OTHER PLCs on this line reachable?\"", answers: [
        { t: "Yes — only this one is dark", elim: ["Reboot the PLC cabinet", "Restart the engineering workstation"], why: "Segment healthy, one device dark — check THAT port's access VLAN and tag before power-cycling a running controller. And the HMI workstation is just a client.", next: null },
        { t: "The whole line dropped", elim: ["Replace the ethernet cable", "Update the SCADA software"], why: "Every device on a segment down at once is the trunk or its allow-list — never a single drop cable, and SCADA software only rides on top.", next: null } ] } ],
    wifi: [
      { id: "scope", short: "Scope", q: "📶 \"Is it dead for EVERYONE in that corner, or just you?\"", answers: [
        { t: "Everyone in that area has issues", elim: ["Replace the user's WiFi adapter", "Move the user's desk closer"], why: "Location-correlated failure for many clients is RF coverage or interference — a survey problem. One adapter can't explain a crowd, and users shouldn't have to relocate.", next: "band" },
        { t: "Just my laptop", elim: ["Boost transmit power on all APs", "Factory-reset the controller"], why: "One client among many healthy ones is client-side — drivers or band capability. Never re-tune the entire RF plan (or wipe every site's config) for a single device.", next: "band" } ] },
      { id: "band", short: "Band split", q: "📡 \"Does 5 GHz work where 2.4 GHz fails?\"", answers: [
        { t: "5 GHz is fine, 2.4 is dead", elim: ["Replace the user's WiFi adapter", "Boost transmit power on all APs"], why: "Band-selective failure is congestion or interference on 2.4 GHz — that's a channel-plan answer. More transmit power just adds more noise to an already noisy band.", next: null },
        { t: "Both bands are weak", elim: ["Factory-reset the controller", "Move the user's desk closer"], why: "Both bands weak in one spot is a coverage hole — AP placement from a proper survey. Resetting the controller wipes every site's config for zero gain.", next: null } ] } ],
    cert: [
      { id: "who", short: "Scope", q: "📜 \"Does the warning show on EVERY device, or just yours?\"", answers: [
        { t: "Every browser and phone", elim: ["Re-import the root CA on every client", "Clear SSL state on the clients"], why: "All clients agree the certificate is bad — the problem is ON the certificate the server presents. Touching hundreds of client stores fixes nothing.", next: "detail" },
        { t: "Just my machine", elim: ["Restart the web server", "Switch the site to a different port"], why: "One client complaining while everyone else connects clean is a local clock or trust-store issue — the server's listener and port are already proven by the crowd.", next: "detail" } ] },
      { id: "detail", short: "Exact error", q: "🔍 \"What does the browser say, word for word?\"", answers: [
        { t: "\"Certificate expired\"", elim: ["Switch the site to a different port", "Restart the web server"], why: "Expired is expired — only a renewal changes a validity date. Listeners, ports and restarts can't make time run backwards.", next: null },
        { t: "\"Untrusted root\" — but the dates are fine", elim: ["Clear SSL state on the clients", "Re-import the root CA on every client"], why: "Valid dates but untrusted means a missing intermediate in the chain the SERVER presents — fix the chain order server-side, not client trust stores one by one.", next: null } ] } ],
    disk: [
      { id: "what", short: "What's eating it", q: "💽 \"What does a quick look show is consuming the space?\"", answers: [
        { t: "Logs and temp dirs — gigabytes", elim: ["Extend the volume immediately", "Delete the pagefile"], why: "Known junk should be purged. Extending without cleanup just feeds the growth, and deleting the pagefile trades your disk problem for a stability problem.", next: "rate" },
        { t: "No idea — it just keeps growing", elim: ["Compress the entire drive", "Uninstall unused Windows features"], why: "Unknown growth needs measurement first (WinDirStat). Blind compression taxes every file access forever, and feature removal recovers megabytes against a gigabyte problem.", next: "rate" } ] },
      { id: "rate", short: "Fill rate", q: "📈 \"How fast is it filling up?\"", answers: [
        { t: "Full again within hours of cleanup", elim: ["Uninstall unused Windows features", "Extend the volume immediately"], why: "Rapid refill means an ACTIVE writer — a runaway log or backup loop. Find and stop the writer; capacity changes are procrastination, not a fix.", next: null },
        { t: "Slow creep over months", elim: ["Delete the pagefile", "Compress the entire drive"], why: "Slow organic growth is a retention-policy question — that's what quotas are for. Never sacrifice the pagefile or CPU to compression for it.", next: null } ] } ],
    update: [
      { id: "stage", short: "Stuck where", q: "🔄 \"Where exactly is the update stuck?\"", answers: [
        { t: "\"Downloading…\" for hours", elim: ["Roll back every installed update", "Disable the Windows Update service"], why: "A download stall is the delivery cache (SoftwareDistribution). Rolling back updates that installed fine targets the wrong thing, and disabling the service just hides the symptom.", next: "history" },
        { t: "Installs, then rolls back", elim: ["Reboot and hope it resumes", "Manually download the KB"], why: "Install-time rollback is servicing-stack or pending.xml corruption — a manual KB hits the same broken stack, and hope is not a remediation.", next: "history" } ] },
      { id: "history", short: "History", q: "🗓️ \"Did LAST patch Tuesday install cleanly?\"", answers: [
        { t: "No — it failed then too", elim: ["Reboot and hope it resumes", "Disable the Windows Update service"], why: "Repeated failures are systemic servicing corruption — repair the stack (SFC/DISM) instead of repeating the same reboot and expecting a different result.", next: null },
        { t: "Yes — first failure ever", elim: ["Roll back every installed update", "Manually download the KB"], why: "A first-ever failure is usually a poisoned download cache — reset it. Mass rollback creates brand-new problems to troubleshoot.", next: null } ] } ],
    share: [
      { id: "scope", short: "Scope", q: "👥 \"Is it just you, or is the whole team locked out?\"", answers: [
        { t: "Just me — coworkers are fine", elim: ["Restart the file server", "Re-add the user to the share ACL"], why: "One SID denied while others work is YOUR identity or effective rights. Restarting the server can't fix one user, and re-adding you to the SHARE ACL ignores that NTFS is usually the more restrictive layer.", next: "layer" },
        { t: "The whole team is denied", elim: ["Remap the network drive", "Flush the offline files cache"], why: "Everyone denied means a server/share-level change — a stripped group or an ACL edit. Client-side remaps and caches can't override a server decision.", next: "layer" } ] },
      { id: "layer", short: "Layer", q: "📁 \"Try it by IP — and what's the EXACT error?\"", answers: [
        { t: "\"Access is denied\", instantly", elim: ["Remap the network drive", "Flush the offline files cache"], why: "An instant denial means the server evaluated you and said no — that's Share × NTFS effective access. A path that demonstrably reaches the server doesn't need remapping.", next: null },
        { t: "Long pause, then a timeout", elim: ["Re-add the user to the share ACL", "Restart the file server"], why: "A timeout is not a denial — the request was never evaluated, so permissions aren't in play at all. That's name resolution or connectivity.", next: null } ] } ],
    vlan: [
      { id: "scope", short: "Scope", q: "🔀 \"Is it just this desk jack, or a whole row?\"", answers: [
        { t: "Only this jack", elim: ["Reboot the access switch", "Static-assign the laptop's IP"], why: "One wrong port is that port's access VLAN config. A switch-wide reboot gambles every other user's session, and a static IP just papers over the wrong subnet.", next: "lease" },
        { t: "A whole row of desks", elim: ["Replace the patch cable", "Disable port security on the switch"], why: "Multiple ports wrong at once is the uplink or trunk allow-list — never a single patch lead, and port security doesn't decide which VLAN you land in.", next: "lease" } ] },
      { id: "lease", short: "DHCP evidence", q: "📋 \"What IP did the laptop actually get?\"", answers: [
        { t: "169.254.x.x — a self-assigned one", elim: ["Static-assign the laptop's IP", "Replace the patch cable"], why: "APIPA means no DHCP Offer was heard — you're in a VLAN with no helper or scope. Static-addressing inside the WRONG subnet just strands you more convincingly.", next: null },
        { t: "A valid IP from the wrong department's range", elim: ["Disable port security on the switch", "Reboot the access switch"], why: "A valid lease from the wrong scope PROVES the port sits in the wrong VLAN — that's a config fix on the port, not hardware and not security policy.", next: null } ] } ],
    backup: [
      { id: "when", short: "Failure point", q: "🗃️ \"Does the job fail at the same step every time?\"", answers: [
        { t: "Instantly, at the snapshot", elim: ["Change the job schedule", "Update the backup software"], why: "Instant snapshot failure is a sick VSS writer — vssadmin list writers will name it. Schedules and software versions don't repair writers.", next: "target" },
        { t: "Runs for hours, fails at the end", elim: ["Restart the backup service only", "Change the job schedule"], why: "Late failure is target-side — space or I/O. Read the job log for the exact file it choked on; restarts and schedules don't manufacture capacity.", next: "target" } ] },
      { id: "target", short: "Target space", q: "💾 \"How full is the backup target?\"", answers: [
        { t: "At 100%", elim: ["Update the backup software", "Restart the backup service only"], why: "A full disk is a retention and space problem — no software version and no service restart can write to a full volume.", next: null },
        { t: "Plenty of room", elim: ["Delete old backup sets blindly", "Change the job schedule"], why: "Space is fine, so look at VSS and the job logs. Deleting recovery points without cause destroys the safety net you're paid to maintain.", next: null } ] } ],
    slowpc: [
      { id: "when", short: "When slow", q: "🐌 \"WHEN is it slow?\"", answers: [
        { t: "Agonizing for 10 minutes after login", elim: ["Add more RAM immediately", "Reinstall the graphics driver"], why: "Slow ONLY after login is a startup pile-up — services, updaters, sync tools all launching at once. Hardware upgrades and drivers don't stop 40 apps from starting.", next: "resmon" },
        { t: "Slow all day, in every app", elim: ["Run disk defragmenter", "Scan for malware as first step"], why: "Constant slowness is a resource bottleneck — measure it in Resource Monitor first. Defrag is useless on SSDs, and a malware scan as step one is a guess, not a method.", next: "resmon" } ] },
      { id: "resmon", short: "ResMon", q: "📊 \"What does Resource Monitor show?\"", answers: [
        { t: "Disk at 100% active time", elim: ["Add more RAM immediately", "Reinstall the graphics driver"], why: "Disk-bound means something is hammering it — search indexer, AV, sync client. RAM and GPU drivers don't make a disk less busy.", next: null },
        { t: "CPU pegged by one named process", elim: ["Run disk defragmenter", "Scan for malware as first step"], why: "A named hog in ResMon is evidence handed to you — chase THAT process and why it runs, not blanket defrags and scans.", next: null } ] } ],
    av_hdmi: [
      { id: "chain", short: "Signal chain", q: "📽️ \"Where in the chain does the signal die?\"", answers: [
        { t: "Screen says 'No Signal' on every input", elim: ["Reinstall the graphics driver", "Reboot the Teams room PC"], why: "No signal on EVERY input means the display never sees anything — the chain (cable, input select) is the suspect. Sources can't all be broken at once.", next: "cheap" },
        { t: "Other inputs work, just the room PC is dark", elim: ["Update the display firmware first", "Replace the projector lamp"], why: "The display proves it can show a picture — firmware and the lamp are fine. The fault is upstream: cable, dock or output port.", next: "cheap" } ] },
      { id: "cheap", short: "Cheapest link", q: "🔌 \"Swap the HDMI cable for a known-good one — result?\"", answers: [
        { t: "Picture comes back", elim: ["Update the display firmware first", "Replace the projector lamp"], why: "A $6 cable fixed it — the classic AV lesson: swap the cheapest link first. Firmware flashes and lamp replacements are expensive answers to cheap problems.", next: null },
        { t: "Still dark", elim: ["Reinstall the graphics driver", "Reboot the Teams room PC"], why: "Cable exonerated — test a known-good SOURCE next before touching drivers or reboots. Halve the chain: display side or source side?", next: null } ] } ],
    av_teams: [
      { id: "scope", short: "Scope", q: "📹 \"Can the room sign into ANYTHING — what does the console show?\"", answers: [
        { t: "Signed out / asking for credentials", elim: ["Replace the camera", "Reset the room's network jack"], why: "A signed-out room is an ACCOUNT problem — Teams Rooms run on a licensed resource account. Cameras and network jacks don't sign anything in.", next: "periph" },
        { t: "Signed in, but can't join meetings", elim: ["Factory-reset the touch console", "Reinstall Teams on the room PC"], why: "Authenticated but can't join points at licensing or pairing state — not something a factory reset teaches you anything about.", next: "periph" } ] },
      { id: "periph", short: "Peripherals", q: "🎤 \"Do camera and mic show up in device settings?\"", answers: [
        { t: "Both missing from the device list", elim: ["Reinstall Teams on the room PC", "Factory-reset the touch console"], why: "Devices missing at the OS level is USB pairing or hardware — Teams the app never saw them, so reinstalling it changes nothing.", next: null },
        { t: "Present and healthy", elim: ["Replace the camera", "Reset the room's network jack"], why: "Peripherals enumerated and fine — look at the room account's license and sign-in state before replacing working hardware.", next: null } ] } ],
    plant_scanner: [
      { id: "where", short: "Failure locus", q: "🔫 \"Where does the scanner die — everywhere, or in certain aisles?\"", answers: [
        { t: "Drops in the same aisles every time", elim: ["Restart the WMS server", "Replace the scanner battery blindly"], why: "Location-correlated drops are RF roaming — the scanner is a WiFi client losing its session between APs. The WMS server serves the whole warehouse fine from other aisles.", next: "base" },
        { t: "Dead everywhere, even at the base", elim: ["Reflash the scanner firmware", "Swap the barcode labels"], why: "Dead at the base station too is pairing or power — labels can't affect connectivity, and firmware flashes are a last resort, not a first.", next: "base" } ] },
      { id: "base", short: "Base station", q: "📡 \"Do OTHER scanners work from the same base station?\"", answers: [
        { t: "Yes — only this one is dead", elim: ["Restart the WMS server", "Swap the barcode labels"], why: "The base and WMS serve every other scanner — this unit's pairing or roaming profile is the fault, and labels never touch the network.", next: null },
        { t: "No — the whole base is dark", elim: ["Replace the scanner battery blindly", "Reflash the scanner firmware"], why: "Every scanner off one base is the base station or its uplink — not any single unit's battery or firmware.", next: null } ] } ],
    label_printer: [
      { id: "reach", short: "Reachability", q: "🏷️ \"Can you ping the label printer's IP?\"", answers: [
        { t: "No reply — and it's on WiFi/DHCP", elim: ["Replace the printhead first", "Reinstall the ZPL driver"], why: "Unreachable printer is network-side: a lapsed DHCP reservation or dropped share. Printheads and drivers only matter once it answers.", next: "queue" },
        { t: "Replies fine", elim: ["Move the printer to another desk", "Factory-reset the printer"], why: "Reachable means the network path is proven — the fault is the share, queue or calibration. Desks and factory resets don't fix queues.", next: "queue" } ] },
      { id: "queue", short: "Queue state", q: "🖨️ \"What do the shipping station's print jobs do?\"", answers: [
        { t: "Jobs stack up in the queue", elim: ["Move the printer to another desk", "Factory-reset the printer"], why: "Jobs held in the queue is a share/queue problem on the station that serves every packer — relocating or wiping the printer doesn't clear it.", next: null },
        { t: "Jobs 'print' but labels come out blank or skewed", elim: ["Replace the printhead first", "Reinstall the ZPL driver"], why: "Labels emerging but wrong is media calibration — the label sensor. Recalibrate before condemning a printhead, and ZPL drivers don't align sensors.", next: null } ] } ],
    hw_replace: [
      { id: "facts", short: "Facts first", q: "💻 \"What do the device facts say — age, warranty, battery?\"", answers: [
        { t: "6+ years old, warranty long expired", elim: ["Re-image it and hope", "Add more RAM to a 6-year-old laptop"], why: "Past warranty with failing hardware is a repair-vs-replace DECISION, not a repair job. Re-imaging doesn't fix dying capacitors, and RAM into an EOL chassis is good money after bad.", next: "diag" },
        { t: "3 years old, still under warranty", elim: ["Replace the SSD on an expired device", "Tell the user to restart more"], why: "In-warranty means the vendor pays for parts — diagnose properly and RMA. 'Restart more' is not lifecycle management.", next: "diag" } ] },
      { id: "diag", short: "Diagnostics", q: "🩺 \"What do hardware diagnostics show?\"", answers: [
        { t: "Disk and battery both failing", elim: ["Add more RAM to a 6-year-old laptop", "Re-image it and hope"], why: "Multiple subsystems failing is end-of-life economics — the report makes the replace case for you. Part-swapping a device with two failing systems never ends.", next: null },
        { t: "Clean — just slow", elim: ["Replace the SSD on an expired device", "Tell the user to restart more"], why: "Clean diagnostics on an in-support device is a software question — run the battery report and fix the actual workload instead of guessing parts.", next: null } ] } ],

    shadow: [
      { id: "trace", short: "Process tree", q: "🕳️ \"Where does the process tree lead?\"", answers: [
        { t: "It's a child of a legitimate service", elim: ["Kill the process and move on", "Report it to the vendor SOC"], why: "Masquerading under a service is persistence — kill the child and the parent respawns it. Understand the mechanism before you escalate or amputate.", next: null },
        { t: "Orphaned — reparented to init", elim: ["Shut down the affected subnet", "Kill the process and move on"], why: "Reparenting is classic daemonization: it was BUILT to survive you. Trace it to the root terminal instead of scorching the network.", next: null } ] } ],
  };

  /* ---------- flow engine ---------- */
  function ensurePool(n) {
    if (n._pool) return;
    const t = n.type;
    // the FULL hypothesis space: best + okay + all four wrongs.
    // every tree answer prunes 1–2 of them, so the board visibly narrows.
    n._pool = [
      { text: t.diag.best, kind: "best" },
      { text: t.diag.okay, kind: "okay" },
      ...t.diag.wrong.map(w => ({ text: w, kind: "wrong" })),
    ].sort(() => Math.random() - .5);
    n._clues = [];
    n._stepsDone = 0;
    n._stepsUsed = {};
    n._path = []; // breadcrumb: "Scope: Just me"
  }

  function hypList(n) {
    return n._pool.map(o => {
      if (o.ruledOut) return `❌ <s>${o.text}</s><br><small>&nbsp;&nbsp;&nbsp;&nbsp;↳ ${o.reason}</small>`;
      return `❔ ${o.text}`;
    }).join("<br>");
  }

  function board(n) {
    const t = n.type, nodes = DT[t.id] || [];
    const open = n._pool.filter(o => !o.ruledOut).length;
    const pathLine = n._path.length ? `<br>🧭 <small>${n._path.join(" → ")}</small>` : "";
    const clueLog = n._clues.length ? `<br><br>📋 <b>Findings:</b><br>${n._clues.join("<br>")}` : "";
    // dynamic options: suggested next node first, then any other unasked node
    const unasked = nodes.filter(nd => !n._stepsUsed[nd.id]);
    const sug = n._suggest && unasked.find(nd => nd.id === n._suggest);
    const ordered = sug ? [sug, ...unasked.filter(nd => nd !== sug)] : unasked;
    const opts = ordered.map((nd, i) => ({
      t: `${i === 0 && sug ? "▶" : "💬"} ${nd.q} <small>(+5 min, +5 conf)</small>`,
      f: () => ask(n, nd),
    }));
    opts.push({
      t: `🧠 Form a conclusion <small>(${open} hypotheses left)</small>`,
      f: () => conclude(n),
    });
    dlg(`🌳 Diagnostic Tree — ${t.label}`,
      `<small>Narrow the tree before you cut it: <b>scope → layer → evidence</b>. Each answer rules out whole branches — with the reason why.</small>` +
      `<br><b>Hypotheses in play: ${open} / ${n._pool.length}</b>${pathLine}<br><br>${hypList(n)}${clueLog}`,
      opts);
  }

  function ask(n, nd) {
    const opts = nd.answers.map(a => ({
      t: `🗨️ ${a.t}`,
      f: () => {
        n._stepsUsed[nd.id] = true;
        n._stepsDone++;
        n._path.push(`${nd.short}: ${a.t}`);
        advanceClock(5);
        n.preConf = (n.preConf || 0) + 5;
        // apply eliminations against the LIVE pool only
        let hits = 0;
        for (const o of n._pool) {
          if (o.kind === "wrong" && !o.ruledOut && a.elim.includes(o.text)) { o.ruledOut = true; o.reason = a.why; hits++; }
        }
        n._clues.push(`<small>“${a.t}” — ${a.why}${hits ? "" : " <i>(confirms what you already ruled out)</i>"}</small>`);
        n._suggest = a.next;
        if (typeof sfx === "function") try { sfx("click"); } catch (e) { }
        board(n);
      },
    }));
    opts.push({ t: "🔙 Back to the board", f: () => board(n) });
    dlg(`🔧 ${n.type.label} — ${nd.short}`,
      `<b>${nd.q}</b><br><small>Pick what you actually observe — the answer decides which branches of the tree get pruned.</small>`,
      opts);
  }

  /* diagnose() currently points at v4.4's static troubleshoot();
     replace the front door so every caller (world, phone, rooms)
     gets the flowchart instead. */
  diagnose = function (n) {
    ensurePool(n);
    if (!DT[n.type.id]) { // safety net: unknown type → straight to conclusion
      conclude(n);
      return;
    }
    board(n);
  };

  // v4.4's conclude() only had letters for 4 options; with the full 6-hypothesis
  // space we need our own copy with a wider palette (same mechanics otherwise).
  conclude = function (n) {
    const s = S, t = n.type;
    const pool = n._pool;
    const remaining = pool.filter(o => !o.ruledOut);
    const ruledOut = pool.filter(o => o.ruledOut);
    const LET = ["🅰", "🅱", "🅲", "🅳", "🅴", "🅵"];
    const opts = remaining.map((o, i) => ({
      t: `${LET[i] || "▫️"} ${o.text}`,
      f: () => {
        n.diagnosed = true; n.correctDiag = o.kind === "best";
        advanceClock(15);
        const dp = freeSpot(s.map, n.x, n.y);
        s.devices.push({ ...dp, type: t, fixed: false, npc: n.id });
        const pp = freeSpot(s.map, dp.x, dp.y);
        if (o.kind === "best") {
          addXP(8); toast("🎯 Correct diagnosis! (+8 XP)");
          s.portals.push({ ...pp, npc: n.id, weak: true });
        } else if (o.kind === "okay") {
          addXP(4);
          toast(`🤔 Reasonable — that helps some, but it's not the root cause. (+4 XP)<br><small>Best move: ${t.diag.best}</small>`, 3400);
          s.portals.push({ ...pp, npc: n.id, weak: false, partial: true });
        } else {
          addStress(10); n.trustHurt = true;
          toast(`❌ Wrong hypothesis... the problem is worse than it looked. (+10 stress)<br><small>Best move: ${t.diag.best}</small>`, 3400);
          s.portals.push({ ...pp, npc: n.id, weak: false });
        }
        if (n._stepsDone >= 2) {
          addXP(3); n.processCredit = true;
          toast(`📋 By the book — evidence first, conclusion second. (+3 XP, +${n._stepsDone * 5} confidence banked)`, 3000);
        } else if (n._stepsDone === 0) {
          toast("🎲 Blind guess — no investigation, no bonus. The ticket remembers.", 2600);
        }
        n.fixedReady = true;
        closeDlg(); updateHUD();
      },
    }));
    dlg("🧠 Conclusion", `<b>${t.label}</b><br>Based on your findings, what's the root cause?` +
      (ruledOut.length ? `<br><small>Ruled out by investigation: ${ruledOut.map(o => `<s>${o.text}</s>`).join(", ")}</small>` : ""),
      opts);
  };

  window.v714 = {
    DT,
    // validator: every wrong answer in every table must be eliminable somewhere in its tree
    coverage() {
      const bad = [];
      for (const t of TICKET_TYPES) {
        const nodes = DT[t.id] || [];
        const elimSet = new Set();
        nodes.forEach(nd => nd.answers.forEach(a => a.elim.forEach(w => elimSet.add(w))));
        for (const w of t.diag.wrong) if (!elimSet.has(w)) bad.push(t.id + ": " + w);
      }
      return bad;
    },
  };
})();
