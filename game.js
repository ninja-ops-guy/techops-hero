/* ============================================================
   TECHOPS HERO v3.1 — roguelite IT RPG (single-file web app)
   ============================================================ */
"use strict";

// ---------- helpers ----------
const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const $ = id => document.getElementById(id);

// ---------- constants ----------
const TILE = 32, MAPW = 42, MAPH = 32;
const DEPTS = ["Manufacturing", "Finance", "Engineering", "Executives", "HR", "Sales"];
const RANKS = [
  { name: "Help Desk Technician", xp: 0 },
  { name: "Senior Technician", xp: 120 },
  { name: "Site Administrator", xp: 300 },
  { name: "Systems Administrator", xp: 550 },
  { name: "Infrastructure Engineer", xp: 900 },
  { name: "Security Engineer", xp: 1350 },
  { name: "Security Architect", xp: 1900 },
  { name: "CIO", xp: 2600 },
];
const CERTS = [
  { id: "aplus", name: "A+", cost: 150, desc: "+15% repair success, unlocks 'Hardware Swap' ability", stat: "hardware" },
  { id: "netplus", name: "Network+", cost: 250, desc: "Unlocks 'Traceroute' (reveals enemy weakness)", stat: "networking" },
  { id: "secplus", name: "Security+", cost: 350, desc: "Unlocks 'Containment' (blocks enemy attack 1 turn)", stat: "security" },
  { id: "linux", name: "Linux+", cost: 350, desc: "Unlocks 'sudo' (big damage, high stress)", stat: "linux" },
  { id: "ccna", name: "CCNA", cost: 600, desc: "Unlocks 'ACL Strike' (piercing packet attack)", stat: "networking" },
  { id: "cloud", name: "Cloud Admin", cost: 600, desc: "Unlocks 'Auto-Scale' (regen HP each battle turn)", stat: "cloud" },
  { id: "auto", name: "Automation Mastery", cost: 800, desc: "Unlocks 'PowerShell Sweep' (auto-resolve 1 ticket/day)", stat: "automation" },
];
const CHAOS = [
  { id: "patch", name: "⚙️ PATCH TUESDAY", desc: "More tickets, +50% XP" },
  { id: "ceo", name: "👔 CEO VISIT", desc: "Executive tickets worth double rep" },
  { id: "outage", name: "🌐 ISP OUTAGE", desc: "Network enemies +30% HP, better loot" },
  { id: "audit", name: "📋 AUDIT WEEK", desc: "Documentation grants bonus budget" },
  { id: "heat", name: "🔥 HEAT WAVE", desc: "Stress builds faster, coffee plentiful" },
  { id: "drill", name: "🛡️ RANSOMWARE DRILL", desc: "Security enemies appear, big rewards" },
  { id: "calm", name: "😌 QUIET DAY", desc: "Fewer tickets, stress recovery doubled" },
];
// diag structure: best = root cause fix, okay = reasonable but suboptimal (partial credit),
// wrong = plausible mistakes real techs make (shuffled into options each time)
const TICKET_TYPES = [
  { id: "printer", label: "Printer Offline", icon: "🖨️", enemy: "Printer Goblin", eicon: "👺", world: "Paper Dimension", wbg: "#3a2e18", stat: "hardware",
    diag: { best: "Restart the print spooler & clear the queue", okay: "Check tray, cables & set as default", wrong: ["Reinstall the printer driver", "Update the printer firmware", "Power-cycle the network switch", "Replace the toner cartridge"] } },
  { id: "vpn", label: "VPN Won't Connect", icon: "🚇", enemy: "VPN Ghost", eicon: "👻", world: "Tunnel Caverns", wbg: "#14202e", stat: "networking",
    diag: { best: "Check tunnel certs, gateway & IKE ports", okay: "Re-enter credentials & reset the profile", wrong: ["Reboot the user's router", "Reinstall the VPN client", "Flush DNS and release/renew IP", "Lower the MTU on the NIC"] } },
  { id: "dns", label: "Internet 'Broken'", icon: "📖", enemy: "DNS Hydra", eicon: "🐍", world: "Labyrinth of Names", wbg: "#1e1430", stat: "networking",
    diag: { best: "Trace the bad DNS record & flush cache", okay: "Test against 8.8.8.8 to confirm DNS", wrong: ["Reboot the core switch", "Replace the WiFi access point", "Reset the user's browser profile", "Re-image the workstation"] } },
  { id: "ad", label: "Account Locked Out", icon: "⛪", enemy: "AD Lich", eicon: "💀", world: "Identity Cathedral", wbg: "#241a2e", stat: "windows",
    diag: { best: "Find the lockout source via Event 4740", okay: "Unlock the account & check mapped drives", wrong: ["Reset the user's password", "Rejoin the machine to the domain", "Disable the lockout policy", "Clear the credential manager only"] } },
  { id: "malware", label: "Suspicious Pop-ups", icon: "☣️", enemy: "Malware Swarm", eicon: "🦠", world: "Corrupted Network", wbg: "#2e1414", stat: "security",
    diag: { best: "Isolate the host first, then scan", okay: "Boot into safe mode & run a full scan", wrong: ["Run the antivirus scan immediately", "Delete the temp internet files", "Reinstall the browser", "Block the pop-up domain in DNS"] } },
  { id: "email", label: "Email Not Syncing", icon: "📬", enemy: "Email Phantom", eicon: "🕊️", world: "Mail Kingdom", wbg: "#142428", stat: "windows",
    diag: { best: "Check the Exchange queue & auth tokens", okay: "Test OWA in a browser to split client/server", wrong: ["Recreate the Outlook profile", "Repair Office from Programs & Features", "Restart the user's PC twice", "Whitelist the domain in spam filter"] } },
  { id: "bsod", label: "Blue Screen Crash", icon: "💙", enemy: "Blue Screen Titan", eicon: "🗿", world: "Kernel Forest", wbg: "#101c34", stat: "hardware",
    diag: { best: "Analyze the dump file in WinDbg", okay: "Check Event Viewer for the faulting driver", wrong: ["Run a full memory test first", "Update every driver on the machine", "Reinstall Windows cleanly", "Check for overheating components"] } },
  { id: "plc", label: "PLC Offline (Factory)", icon: "🏭", enemy: "Rust Golem", eicon: "🤖", world: "Motherboard Desert", wbg: "#2e2410", stat: "networking",
    diag: { best: "Check the OT VLAN segment & trunk tags", okay: "Ping the PLC & check link lights", wrong: ["Reboot the PLC cabinet", "Replace the ethernet cable", "Update the SCADA software", "Restart the engineering workstation"] } },
  { id: "wifi", label: "WiFi Dead Zone", icon: "📶", enemy: "WiFi Sprite", eicon: "🧚", world: "RF Shadow Realm", wbg: "#1a2a1e", stat: "networking",
    diag: { best: "Survey AP placement & channel overlap", okay: "Check band steering & AP health", wrong: ["Boost transmit power on all APs", "Replace the user's WiFi adapter", "Factory-reset the controller", "Move the user's desk closer"] } },
  { id: "cert", label: "SSL Certificate Expired", icon: "📜", enemy: "Certificate Beast", eicon: "🐗", world: "Chain of Trust", wbg: "#2a2010", stat: "security",
    diag: { best: "Renew the cert & repair the full chain", okay: "Check server date/time & chain order", wrong: ["Re-import the root CA on every client", "Restart the web server", "Switch the site to a different port", "Clear SSL state on the clients"] } },
  { id: "disk", label: "Disk Space Critical", icon: "💽", enemy: "Data Hoarder", eicon: "🐲", world: "Sector Wastes", wbg: "#241a10", stat: "windows",
    diag: { best: "Purge logs/temps & set quotas", okay: "Run disk cleanup & visualize with WinDirStat", wrong: ["Extend the volume immediately", "Delete the pagefile", "Compress the entire drive", "Uninstall unused Windows features"] } },
  { id: "update", label: "Stuck Windows Update", icon: "🔄", enemy: "Patch Gremlin", eicon: "😈", world: "Servicing Stack", wbg: "#1e1a2e", stat: "windows",
    diag: { best: "Repair servicing stack & pending ops", okay: "Reset the SoftwareDistribution folder", wrong: ["Reboot and hope it resumes", "Manually download the KB", "Disable the Windows Update service", "Roll back every installed update"] } },
  { id: "share", label: "File Share Access Denied", icon: "📁", enemy: "Permission Troll", eicon: "🧌", world: "ACL Abyss", wbg: "#201428", stat: "windows",
    diag: { best: "Compare Share vs NTFS effective access", okay: "Check group membership & effective access", wrong: ["Remap the network drive", "Restart the file server", "Re-add the user to the share ACL", "Flush the offline files cache"] } },
  { id: "vlan", label: "Wrong VLAN Assignment", icon: "🔀", enemy: "Trunk Ogre", eicon: "👹", world: "Switching Maze", wbg: "#10242a", stat: "networking",
    diag: { best: "Fix access port VLAN & trunk allow-list", okay: "Verify the port's mode & voice VLAN", wrong: ["Replace the patch cable", "Reboot the access switch", "Static-assign the laptop's IP", "Disable port security on the switch"] } },
  { id: "backup", label: "Backup Job Failed", icon: "🗃️", enemy: "Archive Wraith", eicon: "👻", world: "Tape Catacombs", wbg: "#1a1426", stat: "windows",
    diag: { best: "Check VSS writers & job logs, then rerun", okay: "Verify target storage & free space", wrong: ["Restart the backup service only", "Update the backup software", "Change the job schedule", "Delete old backup sets blindly"] } },
  { id: "slowpc", label: "PC Running Slow", icon: "🐌", enemy: "Bloatware Blob", eicon: "🦠", world: "Startup Swamp", wbg: "#14201a", stat: "hardware",
    diag: { best: "Audit startup items & resource hogs", okay: "Check Resource Monitor for the bottleneck", wrong: ["Add more RAM immediately", "Run disk defragmenter", "Scan for malware as first step", "Reinstall the graphics driver"] } },
  { id: "shadow", label: "UNKNOWN ROOT PROCESS", icon: "🕳️", enemy: "THE SHADOW ADMINISTRATOR", eicon: "🌑", world: "The Root Directory", wbg: "#0a0a12", stat: "security",
    diag: { best: "Confront palan0 at the root terminal", okay: "Trace the process tree to its origin", wrong: ["Kill the process and move on", "Report it to the vendor SOC", "Shut down the affected subnet"] } },
];
// moves unlocked by career rank (RANKS index) — your loadout evolves as you level
const MOVE_LEVELS = [
  { rank: 1, ability: { id: "rdp", name: "Remote Desktop", icon: "🖥️", dmg: [8, 14], stress: 5, heal: 6, desc: "Fix it without leaving your desk" } },
  { rank: 1, ability: { id: "eventvwr", name: "Event Viewer", icon: "📋", dmg: [8, 12], stress: 6, weaken: true, desc: "Logs reveal the truth" } },
  { rank: 2, ability: { id: "gpo", name: "Group Policy", icon: "📜", dmg: [6, 10], stress: 8, buff: true, desc: "Enforce your will: +25% dmg 3 turns" } },
  { rank: 2, ability: { id: "pwreset", name: "Password Reset", icon: "🔑", dmg: [14, 22], stress: 7, desc: "The classic" } },
  { rank: 3, ability: { id: "backup", name: "Backup Restore", icon: "💾", dmg: [4, 8], stress: 8, heal: 20, desc: "Big heal from last night's job" } },
  { rank: 4, ability: { id: "wireshark", name: "Wireshark", icon: "🦈", dmg: [14, 20], stress: 9, weaken: true, desc: "See every packet's secrets" } },
  { rank: 5, ability: { id: "siem", name: "SIEM Query", icon: "🔎", dmg: [10, 16], stress: 10, crit: true, desc: "25% chance of a 3× critical correlation" } },
  { rank: 5, ability: { id: "vlaniso", name: "VLAN Isolate", icon: "🚧", dmg: [6, 10], stress: 10, stun: true, desc: "Quarantine the threat" } },
  { rank: 6, ability: { id: "zerotrust", name: "Zero Trust", icon: "🛡️", dmg: [8, 12], stress: 12, shield: true, counter: true, desc: "Shield + reflect half the damage back" } },
  { rank: 7, ability: { id: "exec", name: "Executive Order", icon: "👔", dmg: [30, 45], stress: 25, desc: "Ultimate authority. Massive stress." } },
];
// IT-accurate tactics: right tool for the right problem
const ENEMY_TACTICS = {
  printer: { weak: ["swap", "patch"], resist: ["flush"], attacks: ["PC LOAD LETTER", "Spooler Deadlock", "Toner Cloud", "Paper Jam Swarm"], resistNote: "clearing DNS cache doesn't unjam paper." },
  vpn: { weak: ["tracert", "acl"], resist: ["ping"], attacks: ["IKE Phase 1 Failure", "MTU Black Hole", "Cert Expiry", "Split-Tunnel Leak"], resistNote: "ICMP is dropped inside the tunnel — Ping gets no reply." },
  dns: { weak: ["flush", "tracert"], resist: ["ps"], attacks: ["NXDOMAIN Storm", "Cache Poison", "TTL Spiral", "Zone Transfer Flood"], resistNote: "scripts won't help until the bad record is flushed." },
  ad: { weak: ["ps", "sudo", "pwreset"], resist: ["swap"], attacks: ["Kerberos Ticket Expiry", "LDAP Bind Flood", "GPO Loopback Crash", "Tombstone Rise"], resistNote: "new hardware won't unlock an account." },
  malware: { weak: ["contain", "patch"], resist: ["ping"], attacks: ["C2 Beacon", "Ransom Note", "Privilege Escalation", "Lateral Movement"], resistNote: "pinging malware just tells it you're online." },
  email: { weak: ["ps"], resist: ["flush"], attacks: ["Queue Backlog", "Autodiscover Loop", "OST Corruption", "Spam Typhoon"], resistNote: "DNS isn't why the queue is stuck." },
  bsod: { weak: ["swap", "patch"], resist: ["flush"], attacks: ["IRQL_NOT_LESS_OR_EQUAL", "PAGE_FAULT_IN_NONPAGED_AREA", "Faulty Driver", "Kernel Panic"], resistNote: "network commands can't fix a bad driver." },
  plc: { weak: ["ping", "tracert"], resist: ["sudo"], attacks: ["Ladder Logic Fault", "Fieldbus Timeout", "Sensor Drift", "Watchdog Reset"], resistNote: "NEVER sudo random commands on factory equipment." },
  wifi: { weak: ["swap", "tracert"], resist: ["flush"], attacks: ["Channel Congestion", "Hidden SSID", "Interference Spike", "Captive Portal Loop"], resistNote: "DNS is fine — the RF environment is the problem." },
  cert: { weak: ["ps", "acl"], resist: ["swap"], attacks: ["Handshake Failure", "Untrusted Root", "OCSP Staple Misfire", "Date Skew"], resistNote: "new hardware won't renew a certificate." },
  disk: { weak: ["ps", "sudo"], resist: ["swap"], attacks: ["Log Explosion", "Temp File Swarm", "Shadow Copy Overflow", "Pagefile Surge"], resistNote: "more hardware just fills up again." },
  update: { weak: ["patch", "ps"], resist: ["swap"], attacks: ["Rollback Loop", "0x80070002", "Pending Restart Purgatory", "Driver Conflict"], resistNote: "new hardware ships with the same broken update." },
  share: { weak: ["gpo", "ps"], resist: ["flush"], attacks: ["Access Denied", "Inheritance Break", "Orphaned SID", "Share vs NTFS Clash"], resistNote: "this is a permissions problem, not DNS." },
  vlan: { weak: ["acl", "tracert"], resist: ["sudo"], attacks: ["Native VLAN Mismatch", "Trunk Flap", "MAC Flap", "Spanning Tree Loop"], resistNote: "sudo on a Windows box won't fix switch config." },
  backup: { weak: ["patch", "contain"], resist: ["ping"], attacks: ["VSS Timeout", "Corrupt Catalog", "Media Full", "Job Stuck at 99%"], resistNote: "ping the tape library all day, it won't help." },
  slowpc: { weak: ["ps", "patch"], resist: ["swap"], attacks: ["100% Disk Usage", "Memory Leak", "Startup Ambush", "Thermal Throttle"], resistNote: "new hardware just gets the same bloatware." },
  shadow: { weak: ["zerotrust", "contain", "siem"], resist: ["ping", "coffee"], attacks: ["sudo Slam", "rm -rf /home", "chmod 000", "Fork Bomb", "Kernel Injection"], resistNote: "he owns every packet you send." },
};
const ABILITY_CMDS = {
  ping: "ping -n 4 target", ps: "PS> .\\Invoke-Remediation.ps1", flush: "ipconfig /flushdns",
  patch: "PS> Install-WindowsUpdate -AcceptAll", fw: "New-NetFirewallRule -Action Block",
  coffee: "brew --dark-roast --now", swap: "[reseat RAM / swap CMOS battery]", tracert: "tracert -d target",
  contain: "PS> Disable-NetAdapter -Name * -Confirm:$false", sudo: "sudo systemctl restart corrupted.service",
  acl: "access-list 101 deny ip host 10.66.6.6 any", scale: "kubectl scale deploy/helpdesk --replicas=4",
  rdp: "mstsc /v:target-pc", eventvwr: "Get-WinEvent -LogName System -MaxEvents 20",
  gpo: "gpupdate /force", pwreset: "Set-ADAccountPassword -Reset -NewPassword (ConvertTo-SecureString 'Temp123!' -AsPlainText -Force)",
  backup: "Restore-Backup -Latest -Confirm:$false", wireshark: "tshark -i eth0 host 10.0.0.5",
  siem: "index=security action=blocked | stats count by signature", vlaniso: "switchport access vlan 999 (quarantine)",
  zerotrust: "policy set: verify-explicit, deny-all", exec: "memo: FIX IT. NOW. —CEO",
};
const ABILITIES = [
  { id: "ping", name: "Ping", icon: "📡", dmg: [8, 14], stress: 0, desc: "Reliable packet poke" },
  { id: "ps", name: "PowerShell", icon: "💠", dmg: [12, 20], stress: 8, desc: "Scripted strike" },
  { id: "flush", name: "Flush DNS", icon: "🌀", dmg: [10, 16], stress: 6, desc: "Clears corruption, heals 5 HP", heal: 5 },
  { id: "patch", name: "Patch Deploy", icon: "🩹", dmg: [6, 10], stress: 5, desc: "Heals you for 12 HP", heal: 12 },
  { id: "fw", name: "Firewall Rule", icon: "🧱", dmg: [4, 8], stress: 7, desc: "Halves next enemy hit", shield: true },
  { id: "coffee", name: "Chug Coffee", icon: "☕", dmg: [0, 0], stress: -25, desc: "Restores 25 stress", usable: "calm" },
];
const CERT_ABILITIES = {
  aplus: { id: "swap", name: "Hardware Swap", icon: "🔧", dmg: [18, 26], stress: 10 },
  netplus: { id: "tracert", name: "Traceroute", icon: "🛰️", dmg: [10, 14], stress: 6, weaken: true },
  secplus: { id: "contain", name: "Containment", icon: "🔒", dmg: [5, 8], stress: 9, stun: true },
  linux: { id: "sudo", name: "sudo rm -rf /bug", icon: "🐧", dmg: [24, 36], stress: 18 },
  ccna: { id: "acl", name: "ACL Strike", icon: "⚡", dmg: [20, 30], stress: 12 },
  cloud: { id: "scale", name: "Auto-Scale", icon: "☁️", dmg: [8, 12], stress: 6, regen: true },
};
// ---------- evidence-based battles: the enemy is UNCERTAINTY, not just HP ----------
// moves fall into troubleshooting categories; recon tools double as Inspect actions
const INSPECT_IDS = ["ping", "tracert", "eventvwr", "wireshark", "siem"];
const WORKFLOW_ABILITIES = [
  { id: "ask", name: "Ask User", icon: "💬", cat: "ask", dmg: [0, 0], stress: 0, desc: "When did it start? What changed? Free recon." },
  { id: "interview", name: "Guided Interview", icon: "🗣️", cat: "ask", dmg: [0, 0], stress: 6, desc: "Structured multi-part questioning. Big uncertainty drop.", minRank: 3 },
  { id: "verify", name: "Verify Fix", icon: "✔️", cat: "verify", dmg: [0, 0], stress: 4, desc: "User test + log check. Prevents repeat tickets." },
  { id: "document", name: "Document Work", icon: "📝", cat: "document", dmg: [0, 0], stress: 0, desc: "Good notes: +5 XP, -5 stress, audit armor. Once per battle." },
  { id: "randomfix", name: "Try Random Fix", icon: "🎲", cat: "chaos", dmg: [0, 0], stress: 8, desc: "No evidence, pure luck. Builds tech debt when it fails." },
];
// ---------- confidence: every piece of evidence has weight, and some clues lie ----------
const EVIDENCE_TYPES = {
  ask: "testimony", interview: "testimony",
  ping: "network", tracert: "network", wireshark: "network",
  eventvwr: "logs", siem: "logs",
};
const EVIDENCE_WEIGHTS = {
  printer: { testimony: 3, logs: 2, network: 1, config: 2 },
  vpn: { testimony: 2, logs: 3, network: 4, config: 4 },
  dns: { testimony: 1, logs: 2, network: 4, config: 3 },
  ad: { testimony: 2, logs: 4, network: 2, config: 3 },
  malware: { testimony: 2, logs: 4, network: 3, config: 3 },
  email: { testimony: 2, logs: 3, network: 2, config: 4 },
  bsod: { testimony: 2, logs: 4, network: 1, config: 3 },
  plc: { testimony: 2, logs: 3, network: 4, config: 3 },
  wifi: { testimony: 3, logs: 2, network: 4, config: 2 },
  cert: { testimony: 2, logs: 3, network: 3, config: 4 },
  disk: { testimony: 2, logs: 3, network: 1, config: 4 },
  update: { testimony: 2, logs: 4, network: 1, config: 3 },
  share: { testimony: 2, logs: 3, network: 2, config: 4 },
  vlan: { testimony: 2, logs: 3, network: 4, config: 3 },
  backup: { testimony: 2, logs: 4, network: 2, config: 3 },
  slowpc: { testimony: 3, logs: 3, network: 1, config: 3 },
  shadow: { testimony: 1, logs: 4, network: 3, config: 4 },
};
const EVIDENCE_LABEL = { testimony: "User testimony", logs: "System logs", network: "Network data", config: "Configuration state" };
const FALSE_POSITIVES = [
  "Ping failed... but wait — that could just be Windows Firewall blocking ICMP. Misleading.",
  "The error timestamp doesn't line up with the outage. Red herring.",
  "The user's 'it started after the update' — the update was actually yesterday. Weak correlation.",
  "That log entry looks scary but it's from a service that always complains. Noise.",
];
// insight: the investigation critical hit — patterns emerge automatically
const INSIGHTS = {
  networking: "💡 <b>INSIGHT!</b> Every affected user is on the same VLAN. It's not the endpoints — it's the fabric.",
  windows: "💡 <b>INSIGHT!</b> All failing machines received the same software update. That's no coincidence.",
  hardware: "💡 <b>INSIGHT!</b> Three failures started within five minutes of a switch reboot. Sequence matters.",
  security: "💡 <b>INSIGHT!</b> The timestamps cluster around one authentication event. Patient zero located.",
  cloud: "💡 <b>INSIGHT!</b> The failures follow the autoscaler. It's scaling down into the outage.",
  linux: "💡 <b>INSIGHT!</b> Every crash is the same cron job firing. Found the heartbeat of the problem.",
  programming: "💡 <b>INSIGHT!</b> The stack traces all converge on one library call.",
  automation: "💡 <b>INSIGHT!</b> The playbook runs fine manually — the schedule is the bug.",
};
const ASK_LINES = [
  `"When did it start?" — "Right after the update, now that you mention it..."`,
  `"Has anything changed?" — "Well... facilities DID move my desk yesterday."`,
  `"Does anyone else have this?" — "Actually, yes — the whole east row!"`,
  `"Can you show me?" — the user reproduces it on demand. Golden.`,
  `"What were you doing when it broke?" — "Running the quarterly macro..."`,
];
const LOOT_TABLE = [
  { name: "USB Drive", icon: "💾", rarity: "common", stat: "hardware", val: 2 },
  { name: "Cat6 Cable", icon: "🔌", rarity: "common", stat: "networking", val: 2 },
  { name: "RAM Stick", icon: "🟩", rarity: "common", stat: "hardware", val: 3 },
  { name: "Golden Ethernet", icon: "🌟", rarity: "rare", stat: "networking", val: 6 },
  { name: "Fiber Blade", icon: "🗡️", rarity: "rare", stat: "networking", val: 7 },
  { name: "Keyboard of Debugging", icon: "⌨️", rarity: "rare", stat: "programming", val: 6 },
  { name: "Admin Badge", icon: "🪪", rarity: "epic", stat: "security", val: 10 },
  { name: "Quantum Laptop", icon: "💻", rarity: "epic", stat: "cloud", val: 10 },
  { name: "Master Keycard", icon: "🗝️", rarity: "epic", stat: "security", val: 12 },
  { name: "Domain Admin Crown", icon: "👑", rarity: "legendary", stat: "windows", val: 16 },
  { name: "Infinite Coffee Mug", icon: "☕", rarity: "legendary", stat: "stress", val: 20 },
  { name: "Enterprise Laptop", icon: "🖥️", rarity: "legendary", stat: "hardware", val: 15 },
];
// ticket chains: fixing one problem can reveal a deeper one
const CHAINS = { printer: "dns", dns: "vpn", vpn: "ad", ad: "malware", email: "dns", plc: "malware", bsod: "malware" };
const CHAIN_LINES = [
  "Wait... the problem goes deeper.",
  "That fix revealed something worse upstream.",
  "The corruption spread while you worked.",
];
const ACHIEVEMENTS = [
  { id: "first", name: "First Ticket", icon: "🎫", desc: "Close your first ticket" },
  { id: "ten", name: "Seasoned Tech", icon: "🔟", desc: "Close 10 tickets total" },
  { id: "fifty", name: "Ticket Machine", icon: "🏭", desc: "Close 50 tickets total" },
  { id: "printer3", name: "Printer Slayer", icon: "🖨️", desc: "Defeat 3 Printer Goblins" },
  { id: "chain", name: "How Deep Does This Go?", icon: "🕳️", desc: "Trigger a ticket chain" },
  { id: "crit", name: "Crisis Handler", icon: "🚨", desc: "Resolve a critical incident" },
  { id: "backlog0", name: "Zero Backlog", icon: "👑", desc: "Finish a day with every ticket closed" },
  { id: "cert1", name: "Certified", icon: "🎓", desc: "Earn a certification" },
  { id: "legend", name: "Legendary Find", icon: "🌟", desc: "Loot a legendary item" },
  { id: "siteadmin", name: "Keys to the Kingdom", icon: "🗝️", desc: "Reach Site Administrator" },
  { id: "root", name: "Root Access", icon: "🌑", desc: "Defeat palan0, the Shadow Administrator" },
  { id: "oncall", name: "Always On-Call", icon: "🔥", desc: "Defeat palan0 on On-Call difficulty" },
];
const LEARN = {
  printer: { title: "Print Spooler", body: "Real fix: restart the Print Spooler (services.msc → Print Spooler → Restart), clear C:\\Windows\\System32\\spool\\PRINTERS, then resend the job. 'PC LOAD LETTER' just means load letter-size paper." },
  vpn: { title: "VPN Tunnels", body: "Check: can the client reach the gateway (ping, port 443/500/4500)? Are certs valid and unexpired? Is the NAT-T/ESP path blocked? 'Connected but no access' usually means split-tunnel routes are wrong." },
  dns: { title: "DNS Troubleshooting", body: "'WiFi connected, nothing loads' is classic DNS. Compare nslookup against 8.8.8.8 vs your internal resolver. Fix: ipconfig /flushdns and correcting the bad A/CNAME record. It's always DNS." },
  ad: { title: "Account Lockouts", body: "Find the source: Event ID 4740 on the PDC shows the caller machine. Usual suspects: cached phone credentials, mapped drives, stale service accounts. Tools: LockoutStatus, Event Viewer." },
  malware: { title: "Incident Response", body: "Isolate first — pull the network cable, don't power off (memory evidence). Identify patient zero, check lateral movement, eradicate, then recover from known-good backups. Follow your IR plan." },
  email: { title: "Exchange/Outlook", body: "Server side: Get-Queue on Exchange shows stuck mail. Client side: credential prompts usually mean expired passwords or broken Modern Auth tokens. Test OWA in a browser to split client vs server." },
  bsod: { title: "Crash Analysis", body: "Open the dump in WinDbg and run !analyze -v — it names the faulting driver. Common causes: bad RAM (run MemTest86), GPU drivers, and antivirus filter drivers." },
  plc: { title: "OT Segmentation", body: "PLCs live on isolated OT VLANs. Verify the trunk config, the VM's port-group/VLAN tag, and firewall rules between IT and OT segments. Never bridge OT directly to the internet." },
  wifi: { title: "Wireless Site Surveys", body: "Dead zones are physics, not magic. Do a site survey, fix AP placement, and keep 2.4GHz on channels 1/6/11 to avoid overlap. Check for interference from motors and microwaves." },
  cert: { title: "Certificate Chains", body: "An expired cert breaks trust for every visitor. Check the full chain (leaf → intermediate → root), set renewal reminders 30 days out, and use OCSP stapling. Never train users to click through warnings." },
  disk: { title: "Disk Hygiene", body: "Culprits: log files, temp dirs, shadow copies, and one user's 40GB video. Use WinDirStat to visualize, set quotas, and rotate logs. Deleting System32 is not a cleanup strategy." },
  update: { title: "Servicing Stack Repair", body: "Stuck updates: check pending.xml, run DISM /RestoreHealth then sfc /scannow, and clear the SoftwareDistribution folder if needed. Interrupting updates is how you brick machines." },
  share: { title: "Share vs NTFS Permissions", body: "Effective access = the MOST RESTRICTIVE of Share and NTFS permissions. 'Access Denied' while a coworker works? Compare group memberships and check effective access. Domain Admin is never the answer." },
  vlan: { title: "VLAN Assignment", body: "Phone works, laptop doesn't = the port is on the voice VLAN. Check switchport mode/access VLAN and the trunk's allowed VLAN list. VLAN 1 everywhere is a security smell." },
  backup: { title: "Backup Operations", body: "Backups fail silently until you need them. Monitor VSS writers (vssadmin list writers), test restores quarterly, and follow 3-2-1: 3 copies, 2 media types, 1 offsite." },
  slowpc: { title: "Performance Triage", body: "Task Manager → Startup tab and Resource Monitor are your friends. 100% disk usage is usually an AV scan, search indexing, or a failing drive. 'PC optimizer' ads ARE the bloatware." },
};
// ---------- store: books teach moves, lab equipment grants passives ----------
const STORE_STOCK = [
  { id: "book_itil", name: "ITIL Handbook", icon: "📘", cost: 150, type: "book", move: "rdp", blurb: "Teaches: Remote Desktop" },
  { id: "book_phoenix", name: "The Phoenix Project", icon: "📕", cost: 220, type: "book", move: "gpo", blurb: "Teaches: Group Policy (+25% dmg ×3t)" },
  { id: "book_linux", name: "The Linux Bible", icon: "📓", cost: 350, type: "book", move: "sudo", blurb: "Teaches: sudo rm -rf /bug" },
  { id: "book_wire", name: "Wireshark 101", icon: "📗", cost: 400, type: "book", move: "wireshark", blurb: "Teaches: Wireshark" },
  { id: "book_siem", name: "SIEM for Humans", icon: "📙", cost: 500, type: "book", move: "siem", blurb: "Teaches: SIEM Query (25% ×3 crit)" },
  { id: "book_ccna", name: "CCNA in 30 Days", icon: "📔", cost: 600, type: "book", move: "acl", blurb: "Teaches: ACL Strike" },
  { id: "lab_ram", name: "Spare RAM Kit", icon: "🟩", cost: 180, type: "lab", effect: "+10 max HP", key: "ram" },
  { id: "lab_switch", name: "Managed Switch (Lab)", icon: "🔌", cost: 220, type: "lab", effect: "+2 networking", key: "switch" },
  { id: "lab_pi", name: "Raspberry Pi Cluster", icon: "🍓", cost: 260, type: "lab", effect: "+2 automation", key: "pi" },
  { id: "lab_punch", name: "Punch-Down Tool", icon: "🔨", cost: 160, type: "lab", effect: "+2 hardware", key: "punch" },
  { id: "lab_faraday", name: "Faraday Bag", icon: "👝", cost: 240, type: "lab", effect: "+2 security", key: "faraday" },
  { id: "lab_kb", name: "Ergonomic Keyboard", icon: "⌨️", cost: 300, type: "lab", effect: "-15% stress from all sources", key: "kb" },
  { id: "lab_skate", name: "Skateboard", icon: "🛹", cost: 350, type: "lab", effect: "+20% move speed — kick, push, coast between tickets", key: "skate" },
  { id: "lab_tugger", name: "Factory Tugger (Mini Car)", icon: "🛺", cost: 900, type: "lab", effect: "+45% move speed — the little cart that hauls parts across the floor", key: "tugger" },
  { id: "lab_fluke", name: "Fluke Network Tester", icon: "📟", cost: 500, type: "lab", effect: "Network evidence can never be a false positive", key: "fluke", vendor: "procurement" },
  { id: "lab_thermal", name: "Thermal Camera", icon: "🌡️", cost: 400, type: "lab", effect: "Hardware tickets: inspections grant +10 extra confidence", key: "thermal", vendor: "procurement" },
  { id: "lab_monitor2", name: "Second Monitor", icon: "🖥️", cost: 350, type: "lab", effect: "Multitasking: all inspections grant +3 extra confidence", key: "monitor2", vendor: "procurement" },
  { id: "lab_mechkb", name: "Mechanical Keyboard", icon: "⌨️", cost: 250, type: "lab", effect: "Documentation grants double XP", key: "mechkb", vendor: "procurement" },
  { id: "infra_switches", name: "Replace Old Switches", icon: "🔀", cost: 1000, type: "infra", effect: "PERMANENT: retires Wrong-VLAN tickets from the plant", retire: "vlan", vendor: "procurement" },
  { id: "infra_wifi7", name: "Deploy Wi-Fi 7", icon: "📡", cost: 900, type: "infra", effect: "PERMANENT: retires WiFi Dead Zone tickets", retire: "wifi", vendor: "procurement" },
  { id: "infra_ups", name: "New UPS Fleet", icon: "🔋", cost: 800, type: "infra", effect: "PERMANENT: retires Blue Screen tickets (clean power)", retire: "bsod", vendor: "procurement" },
  { id: "lab_autosrv", name: "Automation Server", icon: "🤖", cost: 1200, type: "lab", effect: "Auto-resolves one routine ticket every morning", key: "autosrv", vendor: "innovation" },
  { id: "lab_ai", name: "AI Troubleshooting Copilot", icon: "🧠", cost: 1500, type: "lab", effect: "Highlights the correct hypothesis branch at 60% confidence", key: "ai", vendor: "innovation" },
  { id: "lab_kcenter", name: "Knowledge Center", icon: "🏛️", cost: 700, type: "lab", effect: "Team gets +10% accuracy on documented failure modes (was +5%)", key: "kcenter", vendor: "innovation" },
];
// vendor assignments (default: books=training, lab/infra=procurement, innovation flagged above)
const VENDOR_OF = id => STORE_STOCK.find(x => x.id === id)?.vendor || (id.startsWith("book") ? "training" : "procurement");
function applyLab(key) {
  const s = S;
  if (key === "ram") { s.maxHp += 10; s.hp = Math.min(s.maxHp, s.hp + 10); }
  else if (key === "switch") s.stats.networking += 2;
  else if (key === "pi") s.stats.automation += 2;
  else if (key === "punch") s.stats.hardware += 2;
  else if (key === "faraday") s.stats.security += 2;
  else if (key === "kb") s.stressResist = Math.min(.6, (s.stressResist || 0) + .15);
}
// ---------- workforce: hire technicians who work tickets for you ----------
const STAFF_TIERS = {
  intern: { name: "Intern", cost: 150, acc: .5, xp: 3, blurb: "Cheap, fast, 50% accuracy. Makes honest mistakes." },
  tech: { name: "Technician", cost: 400, acc: .75, xp: 5, blurb: "Solid. Handles everyday tickets, occasional misdiagnosis." },
  eng: { name: "Engineer", cost: 900, acc: .95, xp: 0, blurb: "Expensive, rarely wrong. No XP for you — they did the work." },
};
const STAFF_TRAITS = [
  { id: "lazy", name: "Lazy", desc: "Skips steps. 2× misdiagnosis rate.", accMod: 0, mis: 2 },
  { id: "meticulous", name: "Meticulous", desc: "Slow but never misdiagnoses. +5% accuracy.", accMod: .05, mis: 0 },
  { id: "curious", name: "Curious", desc: "Sometimes uncovers lore or loot while working.", accMod: 0, mis: 1 },
  { id: "overconfident", name: "Overconfident", desc: "Jumps to conclusions. 2.5× misdiagnosis rate.", accMod: 0, mis: 2.5 },
  { id: "quicklearner", name: "Fast Learner", desc: "Gains +2% accuracy every week.", accMod: 0, mis: 1 },
];
const MISDIAG_NOTES = [
  "reinstalled Office without checking licensing — user lost cached email",
  "deleted the OST file and rebooted. Still broken. Also now it's worse",
  "factory-reset the router to fix a DNS issue. It was not the router",
  "replaced the keyboard to fix a software issue",
  "disabled the firewall 'temporarily' three days ago",
];
// ---------- drama: every critical gets a codename; some systems are LEGENDARY ----------
const INCIDENT_NAMES = ["OPERATION BLACKOUT", "THE RED WORM", "GHOST VLAN", "THE SILENT SWITCH", "THE PHANTOM PATCH", "ZERO HOUR", "THE LONG PING", "CASCADE PROTOCOL", "THE MERIDIAN FAULT", "STATIC STORM"];
const LEGACY_SYSTEMS = [
  { code: "THE DINOSAUR", line: `"DC01. Seventeen years old. Never rebooted. Nobody remembers why. Nobody dares try."` },
  { code: "OL' RELIABLE", line: `"The PLC on Line 4 has run since 1998. Every engineer who touched it... transferred."` },
  { code: "PRN-17", line: `"The entire factory prints labels through PRN-17. There is no PRN-16. Do not ask."` },
  { code: "THE UNKNOWN FIBER", line: `"Labeled DO NOT DISCONNECT in 2004. Nobody knows the other end. It hums."` },
  { code: "CORE 2", line: `"Walter built it. Walter retired. The documentation retired with him."` },
];
const RUMORS = [
  `"Don't touch Switch 17. Just... don't."`,
  `"The old server room is haunted. Fans spin up at 3 AM with the power cut."`,
  `"Accounting still has an XP box. It processes payroll. We do not speak of it."`,
  `"Everyone blames DNS. It's never DNS. Except Tuesday. Tuesday it was DNS."`,
  `"There was a fourth core switch once. There is no fourth core switch now."`,
];
const VENDOR_QUOTES = {
  procurement: [`"I found ONE Fluke tester. Do you know what these go for?"`, `"These switches fell off a truck. Kidding. Mostly."`, `"UPS batteries. Fresh stock. The old ones caught fire, so."`],
  training: [`"Network+ books are on sale. Nobody bought Cloud. Again."`, `"The Phoenix Project changed my life. No pressure."`, `"Certification is a journey. The journey costs $250."`],
  innovation: [`"I built something weird. Legal hasn't seen it yet."`, `"The copilot passed its evals. Mostly. Buy it."`, `"This automation server replaced two interns. Metaphorically."`],
};
const NPC_NAMES = ["Dana", "Marcus", "Priya", "Tom", "Yuki", "Carlos", "Wanda", "Earl", "Nadia", "Greg", "Sue", "Vikram", "Betty", "Hank", "Lena", "Otis"];
const STAFF_NAMES = ["Kenji", "Rosa", "Dev", "Amara", "Luis", "Ingrid", "Theo", "Mabel", "Jules", "Ravi", "Nina", "Cole"];
const LORE = ["📀 Old floppy: 'backup_final_v2_REAL.bak — do not delete'", "📓 Admin journal: 'The root account... it changes its own password now.'", "🗄️ Forgotten server: it's been up 3,412 days. Nobody knows what it does.", "📼 VHS tape: 'ORIENTATION 1987 — the building's network predates the building.'", "🖥️ Terminal: a lone process named 'palan0' has been running since boot..."];

// ---------- state ----------
let S = null;
function newState() {
  return {
    day: 1, clock: 9 * 60, xp: 0, budget: 80, stress: 10,
    hp: 40, maxHp: 40,
    certs: [], inv: [], journal: [],
    stats: { networking: 1, windows: 1, linux: 0, cloud: 0, security: 1, programming: 0, hardware: 1, automation: 0 },
    soft: { communication: 1, patience: 1, documentation: 0 },
    rep: Object.fromEntries(DEPTS.map(d => [d, 1])),
    tickets: [], ticketsDone: 0, ticketsTotal: 0, lootToday: 0,
    chaos: null, promoted: false, autoUsed: false,
    meta: { closed: 0, printerKills: 0, chains: 0, crits: 0, legendaries: 0, cmds: 0, lore: [], debt: 0, wrongDiag: 0, recentTypes: [], kb: {}, incidents: 0, mttr: [], hires: 0 },
    ach: [], books: [], lab: [], storeStock: [], stressResist: 0, diff: 1, ngPlus: false, shadowDone: false,
    staff: [], audited: false, infra: [],
    px: 0, py: 0, dir: 1, fx: "down", moving: false,
    npcs: [], portals: [], devices: [], loreSpots: [], coffeeMachines: [],
    map: null, inDialog: false, inBattle: false, gameOver: false, won: false,
  };
}
const save = () => { try { localStorage.setItem("techops_save", JSON.stringify({ day: S.day, clock: S.clock, xp: S.xp, budget: S.budget, stress: S.stress, hp: S.hp, maxHp: S.maxHp, certs: S.certs, inv: S.inv, journal: S.journal, stats: S.stats, soft: S.soft, rep: S.rep, meta: S.meta, ach: S.ach, books: S.books, lab: S.lab, stressResist: S.stressResist, diff: S.diff, ngPlus: S.ngPlus, shadowDone: S.shadowDone, staff: S.staff, audited: S.audited, infra: S.infra })); } catch (e) { } };
const load = () => { try { const d = JSON.parse(localStorage.getItem("techops_save")); if (d && d.meta) { d.meta.debt = d.meta.debt || 0; d.meta.wrongDiag = d.meta.wrongDiag || 0; d.meta.recentTypes = d.meta.recentTypes || []; d.meta.kb = d.meta.kb || {}; d.meta.incidents = d.meta.incidents || 0; d.meta.mttr = d.meta.mttr || []; d.meta.hires = d.meta.hires || 0; } return d; } catch (e) { return null; } };
const rank = () => { let r = RANKS[0]; for (const k of RANKS) if (S.xp >= k.xp) r = k; return r; };
const statBonus = st => S.stats[st] * 2 + S.inv.reduce((a, l) => a + (l.stat === st ? l.val : 0), 0);
const coffeeMug = () => S.inv.some(l => l.stat === "stress");
// rideables: skateboard & factory tugger stack with the coffee mug bonus
const moveSpeed = () => {
  let v = coffeeMug() ? 3.4 : 3.0;
  if (S.lab.includes("skate")) v *= 1.2;
  if (S.lab.includes("tugger")) v *= 1.45;
  return v;
};

// ---------- retro SFX (WebAudio, no assets) ----------
let AC = null;
let sfxMuted = false;
function sfx(kind) {
  if (sfxMuted) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === "suspended") AC.resume();
    const t0 = AC.currentTime;
    const notes = {
      hit: [[220, 0, .08, "square"], [110, .06, .1, "square"]],
      win: [[440, 0, .09, "square"], [554, .09, .09, "square"], [659, .18, .14, "square"]],
      ticket: [[660, 0, .07, "triangle"], [880, .07, .1, "triangle"]],
      loot: [[523, 0, .06, "triangle"], [784, .06, .09, "triangle"]],
      bad: [[196, 0, .15, "sawtooth"], [147, .12, .2, "sawtooth"]],
      promote: [[392, 0, .1, "square"], [523, .1, .1, "square"], [659, .2, .1, "square"], [784, .3, .2, "square"]],
      portal: [[330, 0, .12, "sine"], [494, .1, .15, "sine"]],
      chain: [[294, 0, .1, "sawtooth"], [370, .1, .1, "sawtooth"], [494, .2, .16, "sawtooth"]],
    }[kind] || [];
    for (const [f, d, dur, type] of notes) {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(.06, t0 + d);
      g.gain.exponentialRampToValueAtTime(.001, t0 + d + dur);
      o.connect(g).connect(AC.destination);
      o.start(t0 + d); o.stop(t0 + d + dur);
    }
  } catch (e) { }
}

// ---------- achievements ----------
function unlock(id) {
  const s = S;
  if (s.ach.includes(id)) return;
  const a = ACHIEVEMENTS.find(x => x.id === id);
  if (!a) return;
  s.ach.push(id);
  sfx("loot");
  toast(`${a.icon} ACHIEVEMENT<br><b>${a.name}</b> — ${a.desc}`, 3200);
  s.journal.push({ day: s.day, title: `Achievement: ${a.name}`, body: a.desc });
  save();
}
function checkAch() {
  const m = S.meta;
  if (m.closed >= 1) unlock("first");
  if (m.closed >= 10) unlock("ten");
  if (m.closed >= 50) unlock("fifty");
  if (m.printerKills >= 3) unlock("printer3");
  if (m.chains >= 1) unlock("chain");
  if (m.crits >= 1) unlock("crit");
  if (m.legendaries >= 1) unlock("legend");
  if (S.certs.length >= 1) unlock("cert1");
  if (S.xp >= 300) unlock("siteadmin");
}

// ---------- biomes: distinct departments with their own floors, props & style ----------
const SRV = { x0: MAPW - 13, y0: 2, x1: MAPW - 2, y1: 8 };
const FACTORY_Y = MAPH - 9;
const LOBBY = { x0: (MAPW >> 1) - 5, y0: (MAPH >> 1) - 2, x1: (MAPW >> 1) + 5, y1: (MAPH >> 1) + 2 };
const BIOMES = [
  { id: "exec", name: "EXECUTIVE SUITE", x0: 1, y0: 1, x1: 10, y1: 7, f1: "#5a3a44", f2: "#54353f", line: "#c9a227", props: [18, 19, 4, 9, 17] },
  { id: "finance", name: "FINANCE ROW", x0: 11, y0: 1, x1: 19, y1: 7, f1: "#4a5a48", f2: "#445340", line: "#8ab86a", props: [2, 14, 4, 8] },
  { id: "sales", name: "SALES FLOOR", x0: 20, y0: 1, x1: 27, y1: 7, f1: "#4a5a6a", f2: "#455361", line: "#6ab8d8", props: [17, 2, 20, 8] },
  { id: "eng", name: "ENGINEERING LAB", x0: 1, y0: 8, x1: 10, y1: 13, f1: "#8a8a92", f2: "#82828a", line: "#e8823a", props: [15, 21, 12, 7] },
  { id: "hr", name: "HR CORNER", x0: 20, y0: 8, x1: 27, y1: 13, f1: "#a08060", f2: "#987558", line: "#e8a0b8", props: [16, 4, 4, 8] },
];
const BIOME_OF_DEPT = { Manufacturing: "factory", Finance: "finance", Engineering: "eng", Executives: "exec", HR: "hr", Sales: "sales" };
function biomeAt(x, y) {
  for (const b of BIOMES) if (x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1) return b;
  return null;
}
function zoneAt(x, y) {
  const b = biomeAt(x, y);
  if (b) return b.id;
  if (x >= LOBBY.x0 && x <= LOBBY.x1 && y >= LOBBY.y0 && y <= LOBBY.y1) return "lobby";
  if (x >= SRV.x0 && x <= SRV.x1 && y >= SRV.y0 && y <= SRV.y1) return "server";
  if (y >= FACTORY_Y) return "factory";
  return "office";
}
function spotInBiome(m, bid) {
  const b = BIOMES.find(z => z.id === bid);
  if (bid === "factory") return freeSpot(m, MAPW >> 1, FACTORY_Y + 4);
  if (!b) return freeSpot(m);
  for (let tries = 0; tries < 60; tries++) {
    const x = R(b.x0 + 1, b.x1 - 1), y = R(b.y0 + 1, b.y1 - 1);
    if (m[y] && m[y][x] === 0) return { x, y };
  }
  return freeSpot(m, (b.x0 + b.x1) >> 1, (b.y0 + b.y1) >> 1);
}
function genMap() {
  const m = [];
  for (let y = 0; y < MAPH; y++) { m.push([]); for (let x = 0; x < MAPW; x++) m[y].push(0); }
  // outer walls
  for (let x = 0; x < MAPW; x++) { m[0][x] = 1; m[MAPH - 1][x] = 1; }
  for (let y = 0; y < MAPH; y++) { m[y][0] = 1; m[y][MAPW - 1] = 1; }
  // server room walls + door
  for (let x = SRV.x0; x <= SRV.x1; x++) { m[SRV.y0][x] = 1; m[SRV.y1][x] = 1; }
  for (let y = SRV.y0; y <= SRV.y1; y++) { m[y][SRV.x0] = 1; m[y][SRV.x1] = 1; }
  m[SRV.y1][SRV.x0 + 3] = 0; m[SRV.y1][SRV.x0 + 4] = 0;
  // server racks
  for (let x = SRV.x0 + 2; x < SRV.x1 - 1; x += 2) for (let y = SRV.y0 + 1; y < SRV.y1 - 1; y += 2) m[y][x] = 3;
  // factory: conveyor lines, CNC machines, crates
  for (let y = FACTORY_Y + 2; y < MAPH - 2; y += 3)
    for (let x = 3; x < MAPW - 3; x++) if (Math.random() < .88) m[y][x] = 5;
  for (let i = 0; i < 12; i++) {
    const x = R(2, MAPW - 3), y = R(FACTORY_Y + 1, MAPH - 3);
    if (m[y][x] === 0) m[y][x] = pick([6, 7, 7]);
  }
  // biome props: each department gets its signature furniture
  for (const b of BIOMES) {
    for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) {
      if (m[y][x] === 0 && Math.random() < .22) m[y][x] = pick(b.props);
    }
    // biome doorways: keep a gap open in the middle of each biome
    for (let x = b.x0; x <= b.x1; x++) if (m[b.y0][x] === 1 && Math.random() < .5) m[b.y0][x] = 0;
  }
  // remaining generic office: cubicle desks, plants, water coolers
  for (let i = 0; i < 40; i++) {
    const x = R(2, MAPW - 3), y = R(2, FACTORY_Y - 1);
    if (m[y][x] === 0 && zoneAt(x, y) === "office") m[y][x] = pick([2, 2, 2, 4, 8]);
  }
  // office partition walls with doorways
  const wallLines = R(2, 4);
  for (let i = 0; i < wallLines; i++) {
    const horiz = Math.random() < .5;
    const pos = R(4, FACTORY_Y - 4);
    const from = R(2, 6), len = R(6, 14);
    const door = R(from, from + len - 1);
    for (let j = from; j < from + len; j++) {
      if (j === door || j === door + 1) continue;
      const x = horiz ? j : pos, y = horiz ? pos : j;
      if (x > 0 && x < MAPW - 1 && y > 0 && y < FACTORY_Y - 1 && zoneAt(x, y) === "office") m[y][x] = 1;
    }
  }
  // wall decorations: posters & whiteboards on office walls
  let decorated = 0;
  for (let y = 1; y < FACTORY_Y - 1 && decorated < 14; y++) for (let x = 1; x < MAPW - 1 && decorated < 14; x++) {
    if (m[y][x] === 1 && zoneAt(x, y) === "office" && (m[y + 1][x] === 0 || m[y - 1][x] === 0) && Math.random() < .12) {
      m[y][x] = pick([11, 12]); decorated++;
    }
  }
  // lobby: reception area at spawn
  for (let y = LOBBY.y0; y <= LOBBY.y1; y++) for (let x = LOBBY.x0; x <= LOBBY.x1; x++) m[y][x] = 0;
  for (let x = LOBBY.x0 + 1; x <= LOBBY.x0 + 4; x++) m[LOBBY.y0][x] = 9; // reception counter
  m[LOBBY.y1][LOBBY.x1 - 2] = 10; m[LOBBY.y1][LOBBY.x1 - 3] = 10; // sofas
  m[LOBBY.y1][LOBBY.x0] = 4; m[LOBBY.y0][LOBBY.x1] = 4; // plants
  return m;
}
function freeSpot(m, nearX, nearY) {
  for (let tries = 0; tries < 200; tries++) {
    const x = nearX !== undefined ? clamp(nearX + R(-4, 4), 1, MAPW - 2) : R(1, MAPW - 2);
    const y = nearY !== undefined ? clamp(nearY + R(-4, 4), 1, MAPH - 2) : R(1, MAPH - 2);
    if (m[y] && m[y][x] === 0) return { x, y };
  }
  return { x: 1, y: 1 };
}

// ---------- day setup ----------
function setupDay() {
  const s = S;
  s.map = genMap();
  const start = freeSpot(s.map, MAPW >> 1, MAPH >> 1);
  s.px = start.x; s.py = start.y;
  s.npcs = []; s.portals = []; s.devices = []; s.loreSpots = []; s.coffeeMachines = [];
  s.tickets = []; s.ticketsDone = 0; s.lootToday = 0; s.autoUsed = false; s.hp = s.maxHp;
  s.clock = 9 * 60;

  // chaos event
  s.chaos = Math.random() < .75 ? pick(CHAOS) : null;

  // ticket count
  let n = R(4, 6);
  if (s.chaos?.id === "patch") n += 2;
  if (s.chaos?.id === "calm") n -= 2;
  if (s.diff > 1) n += 1; // On-Call: more tickets
  n = clamp(n, 2, 8);
  s.ticketsTotal = n;

  // the palan0 arc: full lore set awakens the Shadow Administrator
  if (s.meta.lore.length >= 5 && !s.shadowDone) {
    const sp = freeSpot(s.map);
    const shadowNpc = { id: 900, name: "??? (root terminal)", dept: "Infrastructure", type: TICKET_TYPES.find(t => t.id === "shadow"), x: sp.x, y: sp.y, face: "🖥️", done: false, interviewed: false, diagnosed: false, correctDiag: false, critical: true, pv: 1 };
    s.npcs.push(shadowNpc); s.tickets.push(shadowNpc);
    s.ticketsTotal++;
    setTimeout(() => toast("🕳️ A terminal wakes by itself. <b>palan0 has noticed you.</b>", 4000), 1500);
  }

  // spawn NPCs with tickets — each in their department's biome
  for (let i = 0; i < n; i++) {
    let type = pick(TICKET_TYPES.filter(t => t.id !== "shadow" && !(s.infra || []).includes(t.id)));
    if (s.chaos?.id === "drill") type = TICKET_TYPES.find(t => t.id === "malware");
    if (s.chaos?.id === "outage" && Math.random() < .5) type = pick(TICKET_TYPES.filter(t => t.stat === "networking" && t.id !== "shadow" && !(s.infra || []).includes(t.id)));
    const dept = pick(DEPTS);
    const pos = spotInBiome(s.map, BIOME_OF_DEPT[dept]);
    const npc = {
      id: i, name: pick(NPC_NAMES), dept, type,
      x: pos.x, y: pos.y, face: "🧑‍💼",
      done: false, interviewed: false, diagnosed: false, correctDiag: false,
      critical: Math.random() < .12, pv: R(0, PAL_NPCS.length - 1),
    };
    // ticket personalities: not every ticket behaves the same
    npc.personality =
      ["malware", "cert"].includes(type.id) ? "security" :
      dept === "Executives" ? "executive" :
      type.id === "plc" ? "manufacturing" :
      Math.random() < .15 ? "problem" : "routine";
    if (npc.critical) npc.codename = pick(INCIDENT_NAMES);
    s.npcs.push(npc); s.tickets.push(npc);
    // a broken device + portal appear near the NPC after diagnosis
  }
  // LEGACY SYSTEMS: legendary infrastructure nobody understands — mini-bosses with names
  const legacyCount = Math.random() < .35 ? 2 : 1;
  const legacyCandidates = s.tickets.filter(t => !t.critical && t.type.id !== "shadow");
  for (let li = 0; li < Math.min(legacyCount, legacyCandidates.length); li++) {
    const victim = legacyCandidates[li];
    const leg = pick(LEGACY_SYSTEMS.filter(l => !s.tickets.some(t => t.legacy === l.code)));
    if (!leg) break;
    victim.legacy = leg.code; victim.legacyLine = leg.line;
    victim.critical = true; victim.codename = leg.code;
    s.meta.kb = s.meta.kb || {};
  }
  // tech debt consequence: sloppy past fixes resurface as repeat tickets
  const repeats = s.meta.recentTypes || [];
  if (s.meta.debt >= 5 && repeats.length && Math.random() < Math.min(.65, (s.meta.debt - 3) * .12)) {
    const rt = TICKET_TYPES.find(t => t.id === pick(repeats));
    if (rt) {
      const dept = pick(DEPTS);
      const pos = spotInBiome(s.map, BIOME_OF_DEPT[dept]);
      const npc = {
        id: 500 + s.day, name: pick(NPC_NAMES), dept, type: rt,
        x: pos.x, y: pos.y, face: "🧑‍💼",
        done: false, interviewed: false, diagnosed: false, correctDiag: false,
        critical: false, repeat: true, trustHurt: true, pv: R(0, PAL_NPCS.length - 1),
      };
      s.npcs.push(npc); s.tickets.push(npc); s.ticketsTotal++;
      setTimeout(() => toast(`🔁 REPEAT TICKET — a past ${rt.label} fix didn't hold. Tech debt collects interest.`, 3600), 2200);
    }
  }
  // ambient NPCs wander their own departments
  for (let i = 0; i < R(4, 7); i++) {
    const dept = pick(DEPTS);
    const pos = spotInBiome(s.map, BIOME_OF_DEPT[dept]);
    s.npcs.push({ id: 100 + i, name: pick(NPC_NAMES), dept, x: pos.x, y: pos.y, face: "🧍", ambient: true, pv: R(0, PAL_NPCS.length - 1) });
  }
  // lore spots (unique pieces of the palan0 mystery)
  const loreIds = [0, 1, 2, 3, 4].sort(() => Math.random() - .5).slice(0, R(2, 3));
  for (const lid of loreIds) { const p = freeSpot(s.map); s.loreSpots.push({ x: p.x, y: p.y, text: LORE[lid], lid, found: false }); }
  // coffee machines
  const nc = s.chaos?.id === "heat" ? 4 : 2;
  for (let i = 0; i < nc; i++) { const p = freeSpot(s.map); s.coffeeMachines.push({ x: p.x, y: p.y, used: false }); }
  // daily store stock rotation
  const stockPool = STORE_STOCK.filter(it => !s.books.includes(it.id)
    && !(it.type === "lab" && s.lab.filter(k => k === it.key).length >= (it.key === "kb" ? 2 : 1))
    && !(it.type === "infra" && (s.infra || []).includes(it.retire)));
  s.storeStock = [...stockPool].sort(() => Math.random() - .5).slice(0, 4).map(it => it.id);

  // automation server: scripts chew through one routine ticket overnight
  if (s.lab.includes("autosrv")) {
    const t = s.tickets.find(t => !t.done && !t.critical && t.type.id !== "shadow");
    if (t) {
      t.done = true; s.ticketsDone++; s.meta.closed++;
      s.rep[t.dept] = clamp(s.rep[t.dept] + 1, 0, 5);
      s.journal.push({ day: s.day, title: `${t.type.label} — automated`, body: "The Automation Server resolved it overnight from your documented runbooks." });
      setTimeout(() => toast(`🤖 AUTOMATION SERVER<br><small>Overnight runbook resolved: ${t.type.label} (${t.dept})</small>`, 3800), 2800);
    }
  }
  toast(s.chaos ? `DAY ${s.day} — ${s.chaos.name}<br><small>${s.chaos.desc}</small>` : `DAY ${s.day} begins`);
  updateHUD();
  save();
}

// ---------- rendering ----------
const cv = $("game"), ctx = cv.getContext("2d");
let camX = 0, camY = 0;
function resize() {
  const ar = innerWidth / innerHeight;
  cv.height = Math.min(720, innerHeight);
  cv.width = Math.round(cv.height * ar);
  if (cv.width > innerWidth) { cv.width = innerWidth; cv.height = Math.round(cv.width / ar); }
}
addEventListener("resize", resize); resize();

// ---------- pixel art ----------
function px(c, X, Y, w, h) { ctx.fillStyle = c; ctx.fillRect(X, Y, w, h); }
function drawTile(t, x, y, tm) {
  const X = x * TILE, Y = y * TILE, z = zoneAt(x, y);
  const b = biomeAt(x, y);
  // floors by biome / zone
  if (b) {
    px((x + y) % 2 ? b.f1 : b.f2, X, Y, TILE, TILE);
    // biome trim: accent line on the edges of the biome
    if (y === b.y0) px(b.line, X, Y, TILE, 2);
    if (x === b.x0) px(b.line, X, Y, 2, TILE);
    if (y === b.y1) px(b.line, X, Y + TILE - 2, TILE, 2);
    if (x === b.x1) px(b.line, X + TILE - 2, Y, 2, TILE);
  } else if (z === "factory") {
    px((x + y) % 2 ? "#b0b0a8" : "#a8a89e", X, Y, TILE, TILE);
    px("#98988e", X, Y, TILE, 1); px("#98988e", X, Y, 1, TILE);
    if (y === FACTORY_Y) for (let i = 0; i < 4; i++) { px(i % 2 ? "#1a1a1a" : "#e8c82a", X + i * 8, Y, 8, 4); px(i % 2 ? "#e8c82a" : "#1a1a1a", X + i * 8, Y + TILE - 4, 8, 4); }
  } else if (z === "lobby") {
    // blue carpet
    px((x + y) % 2 ? "#5a7a9a" : "#54718f", X, Y, TILE, TILE);
    px("#46617c", X, Y, TILE, 1); px("#46617c", X, Y, 1, TILE);
  } else if (z === "server") {
    px((x + y) % 2 ? "#3a4a6a" : "#34435f", X, Y, TILE, TILE);
    px("#28344e", X, Y, TILE, 1); px("#28344e", X, Y, 1, TILE);
  } else {
    // warm wooden planks
    px((x + y) % 2 ? "#d9a05e" : "#d49a58", X, Y, TILE, TILE);
    px("#c08a4a", X, Y, TILE, 1);
    px("#c08a4a", X + ((y % 2) ? 10 : 22), Y, 1, TILE);
  }
  if (t === 0) return;
  switch (t) {
    case 1: // white wall with baseboard
      px("#e8e8e4", X, Y, TILE, TILE); px("#f6f6f2", X, Y, TILE, 10);
      px("#c8c8c0", X, Y + TILE - 7, TILE, 7);
      px("#8a6a4a", X, Y + TILE - 2, TILE, 2); break;
    case 2: // light-wood desk with monitor
      px("#c89858", X + 2, Y + 16, 28, 12); px("#dab87a", X + 2, Y + 16, 28, 3);
      px("#8a6a3a", X + 4, Y + 28, 4, 3); px("#8a6a3a", X + 24, Y + 28, 4, 3);
      px("#f0f0f0", X + 9, Y + 3, 14, 10);
      px(Math.floor(tm / 900) % 2 ? "#3a5a8a" : "#2e4a76", X + 11, Y + 5, 10, 6);
      px("#888", X + 14, Y + 13, 4, 3); break;
    case 3: // server rack with blinking LEDs
      px("#202838", X + 4, Y + 1, 24, 30); px("#2c3850", X + 6, Y + 3, 20, 26);
      for (let r = 0; r < 5; r++) {
        px("#18202e", X + 7, Y + 5 + r * 5, 18, 3);
        const on = (Math.floor(tm / 400) + r + x) % 3;
        px(on ? (r % 2 ? "#3f6" : "#3af") : "#142", X + 21, Y + 5 + r * 5, 3, 3);
      } break;
    case 4: // big leafy plant
      px("#b06038", X + 11, Y + 22, 10, 8); px("#8a4828", X + 11, Y + 22, 10, 2);
      px("#3f8a3a", X + 6, Y + 6, 20, 16); px("#5aa84a", X + 9, Y + 3, 14, 10);
      px("#2f6a2a", X + 13, Y + 10, 6, 6); break;
    case 5: { // conveyor with animated rollers — HALTED while a PLC ticket is open
      const halted = S.npcs && S.npcs.some(n => n.type && n.type.id === "plc" && !n.done);
      px("#8a8a96", X, Y + 4, TILE, 24); px("#6a6a76", X, Y + 6, TILE, 20);
      const off = halted ? 0 : Math.floor(tm / 120) % 8;
      for (let i = -1; i < 6; i++) px("#9a9aae", X + ((i * 8 + off + 40) % 40) - 4, Y + 8, 2, 16);
      px("#aaa", X, Y + 4, TILE, 2); px("#aaa", X, Y + 26, TILE, 2);
      if (halted) {
        // smoke puffs from the stalled line
        const pu = Math.floor(tm / 350) % 3;
        ctx.globalAlpha = .35 + pu * .15;
        px("#888", X + 12 + pu * 3, Y + 2 - pu * 2, 5, 5);
        ctx.globalAlpha = 1;
      }
      break;
    }
    case 6: // CNC machine
      px("#9aaeb8", X + 2, Y + 4, 28, 26); px("#b8ccd6", X + 2, Y + 4, 28, 3);
      px("#28404e", X + 6, Y + 8, 20, 10);
      px("#3af", X + 8, Y + 10, 6, 3);
      px("#3f6", X + 24, Y + 14, 4, 4); px("#c33", X + 24, Y + 20, 4, 4); break;
    case 7: // crate / pallet
      px("#c89a5a", X + 3, Y + 8, 26, 22); px("#a87c42", X + 3, Y + 8, 26, 3);
      px("#a87c42", X + 14, Y + 8, 3, 22); px("#a87c42", X + 3, Y + 27, 26, 3); break;
    case 8: // water cooler
      px("#9ad", X + 11, Y + 4, 10, 10); px("#e8e8f0", X + 9, Y + 14, 14, 16);
      px("#356", X + 12, Y + 18, 8, 4); break;
    case 9: // reception counter
      px("#c89858", X, Y + 10, TILE, 18); px("#dab87a", X, Y + 10, TILE, 4);
      px("#f0f0f0", X + 18, Y + 4, 10, 8);
      px("#c33", X + 5, Y + 6, 5, 6);
      px("#8a6a3a", X, Y + 28, TILE, 2); break;
    case 10: // sofa
      px("#6a7a9a", X + 2, Y + 8, 28, 20); px("#8494b4", X + 2, Y + 8, 28, 6);
      px("#5a6a8a", X + 2, Y + 18, 13, 8); px("#5a6a8a", X + 17, Y + 18, 13, 8);
      px("#4a3a28", X + 4, Y + 28, 3, 3); px("#4a3a28", X + 25, Y + 28, 3, 3); break;
    case 11: // wall poster
      px("#e8e8e4", X, Y, TILE, TILE); px("#f6f6f2", X, Y, TILE, 10);
      px("#c8c8c0", X, Y + TILE - 7, TILE, 7); px("#8a6a4a", X, Y + TILE - 2, TILE, 2);
      px("#3a5a8a", X + 7, Y + 5, 18, 14); px("#f0f0f0", X + 9, Y + 7, 14, 3);
      px("#ffd24a", X + 9, Y + 12, 8, 5); break;
    case 12: // whiteboard
      px("#e8e8e4", X, Y, TILE, TILE); px("#f6f6f2", X, Y, TILE, 10);
      px("#c8c8c0", X, Y + TILE - 7, TILE, 7); px("#8a6a4a", X, Y + TILE - 2, TILE, 2);
      px("#f8f8f8", X + 3, Y + 4, 26, 16); px("#999", X + 3, Y + 4, 26, 2);
      px("#3a5a8a", X + 6, Y + 9, 12, 1); px("#c33", X + 6, Y + 12, 16, 1);
      px("#3f6", X + 6, Y + 15, 9, 1); break;
    case 13: // mahogany desk (executive)
      px("#5a2a1a", X + 1, Y + 12, 30, 16); px("#7a3a24", X + 1, Y + 12, 30, 4);
      px("#f0e0c0", X + 20, Y + 4, 8, 10); px("#c9a227", X + 4, Y + 6, 6, 4);
      px("#3a1a10", X + 3, Y + 26, 4, 4); px("#3a1a10", X + 25, Y + 26, 4, 4); break;
    case 14: // filing cabinet
      px("#8a929a", X + 7, Y + 2, 18, 28); px("#aab2ba", X + 7, Y + 2, 18, 3);
      px("#6a727a", X + 9, Y + 7, 14, 5); px("#6a727a", X + 9, Y + 14, 14, 5); px("#6a727a", X + 9, Y + 21, 14, 5);
      px("#444", X + 14, Y + 9, 4, 2); px("#444", X + 14, Y + 16, 4, 2); px("#444", X + 14, Y + 23, 4, 2); break;
    case 15: // engineering workbench
      px("#7a6a4a", X + 1, Y + 18, 30, 10); px("#9a8a6a", X + 1, Y + 18, 30, 3);
      px("#4a4a55", X + 3, Y + 4, 8, 8); px("#3af", X + 5, Y + 6, 4, 4);
      px("#c9a227", X + 14, Y + 6, 10, 3); px("#555", X + 14, Y + 10, 8, 3);
      px("#666", X + 26, Y + 5, 4, 12); px("#c33", X + 27, Y + 4, 2, 2); break;
    case 16: // round meeting table (HR)
      px("#8a6a4a", X + 4, Y + 8, 24, 16); px("#a8875e", X + 6, Y + 6, 20, 20);
      px("#f0f0f0", X + 12, Y + 10, 4, 4); px("#f0f0f0", X + 20, Y + 14, 4, 4); px("#f0f0f0", X + 8, Y + 16, 4, 4);
      px("#b06038", X + 14, Y + 20, 4, 5); break;
    case 17: // phone pod (sales)
      px("#5a6a8a", X + 4, Y + 4, 24, 24); px("#7080a0", X + 4, Y + 4, 24, 3);
      px("#1a1a22", X + 10, Y + 10, 12, 8); px("#3f6", X + 12, Y + 12, 8, 3);
      px("#c9a227", X + 6, Y + 20, 6, 5); px("#f0f0f0", X + 20, Y + 20, 7, 5); break;
    case 18: // executive corner desk
      px("#4a2a20", X + 2, Y + 10, 28, 18); px("#6a3a28", X + 2, Y + 10, 28, 4);
      px("#101014", X + 12, Y + 2, 12, 9); px("#3a5a8a", X + 14, Y + 4, 8, 5);
      px("#c9a227", X + 4, Y + 4, 5, 6); px("#f0f0f0", X + 24, Y + 14, 5, 7); break;
    case 19: // trophy shelf
      px("#6a4a2a", X + 2, Y + 4, 28, 24); px("#8a6a3a", X + 2, Y + 4, 28, 3);
      px("#c9a227", X + 5, Y + 9, 5, 7); px("#ffd24a", X + 6, Y + 8, 3, 3);
      px("#c9a227", X + 14, Y + 9, 5, 7); px("#c0c0c0", X + 23, Y + 9, 5, 7);
      px("#5a3a1a", X + 3, Y + 18, 26, 3); break;
    case 20: // sales leaderboard
      px("#2a3a5a", X + 3, Y + 2, 26, 26); px("#4a5a7a", X + 3, Y + 2, 26, 3);
      px("#ffd24a", X + 6, Y + 8, 20, 3); px("#8ab86a", X + 6, Y + 13, 14, 3);
      px("#6ab8d8", X + 6, Y + 18, 17, 3); px("#e8e8e8", X + 6, Y + 23, 9, 3); break;
    case 21: { // robot arm (engineering)
      px("#555", X + 13, Y + 22, 6, 8); px("#e8823a", X + 14, Y + 8, 4, 14);
      px("#555", X + 8, Y + 5, 12, 4); px("#e8823a", X + 6, Y + 3, 5, 5);
      const j = Math.floor(tm / 500) % 2;
      px(j ? "#3f6" : "#c33", X + 15, Y + 25, 3, 3);
      px("#888", X + 4, Y + 26, 24, 3); break;
    }
  }
}
// chibi pixel sprites (16px grid, '.' = transparent, k = outline) — used for NPCs
const SPR_NPC = [
  "....kkkkkkkk....",
  "...khhhhhhhhk...",
  "..khhhhhhhhhhk..",
  "..khhhhhhhhhhk..",
  "..kssssssssssk..",
  "..ksekkssekssk..",
  "..kssssssssssk..",
  "...kksssssskk...",
  "...kbbbbbbbbk...",
  "..kbkbwwwwbkbk..",
  "..kbsbwwwwbsbk..",
  "..kskbbbbbbksk..",
  "...kbbbbbbbbk...",
  "...kkkbkkbbkk...",
  "...kffk..kffk...",
  "...kkk....kkk...",
];
const PAL_NPCS = [
  { k: "#1a1a22", h: "#6a4a2a", s: "#f0c8a0", e: "#1a1a22", b: "#3a5fcd", w: "#f0f0f0", f: "#6a4a2a" },
  { k: "#1a1a22", h: "#22222a", s: "#e8b88a", e: "#1a1a22", b: "#5a5f6a", w: "#e8e8e8", f: "#3a3a3a" },
  { k: "#1a1a22", h: "#c9a227", s: "#f0d0b0", e: "#1a1a22", b: "#8a4a6a", w: "#f0f0f0", f: "#4a3a2a" },
  { k: "#1a1a22", h: "#a84a2a", s: "#d8a880", e: "#1a1a22", b: "#3a6a4a", w: "#e8e8e8", f: "#2a2a2a" },
];
// department uniforms: each biome has its own NPC look
const DEPT_PAL = {
  Executives: { k: "#1a1a22", h: "#2a2a2a", s: "#f0c8a0", e: "#1a1a22", b: "#1a1a2a", w: "#f0f0f0", f: "#3a3a3a" },
  Finance: { k: "#1a1a22", h: "#6a4a2a", s: "#f0c8a0", e: "#1a1a22", b: "#2a5a3a", w: "#e8f0e0", f: "#4a3a2a" },
  Sales: { k: "#1a1a22", h: "#6a5a2a", s: "#f0d0b0", e: "#1a1a22", b: "#2a4a7a", w: "#f0f0f0", f: "#2a2a2a" },
  Engineering: { k: "#1a1a22", h: "#3a3a3a", s: "#e8b88a", e: "#1a1a22", b: "#c96a1a", w: "#f0f0f0", f: "#3a3a3a" },
  HR: { k: "#1a1a22", h: "#4a2a1a", s: "#f0d0b0", e: "#1a1a22", b: "#a04a6a", w: "#f8e8ee", f: "#5a3a3a" },
  Manufacturing: { k: "#1a1a22", h: "#c9a227", s: "#e8b88a", e: "#1a1a22", b: "#5a5f6a", w: "#e8e8e8", f: "#2a2a2a" },
};
// custom player sprite (atlas-based, directional facing)
const playerImg = new Image();
if (typeof PLAYER_ATLAS !== "undefined") playerImg.src = PLAYER_ATLAS.src;
function drawPlayer(s, tm) {
  const fx = s.fx || "down";
  const now = performance.now();
  let key;
  if (s.partyUntil && now < s.partyUntil) key = "party";
  else if (s.thumbsUntil && now < s.thumbsUntil) key = "thumbs";
  else if (s.inDialog) key = "laptop";
  else if (s.moving) key = `${fx}${1 + Math.floor(tm / 160) % 2}`;
  else key = `${fx}0`;
  if (!(key in PLAYER_ATLAS.frames)) key = "down0";
  const [cx, cy] = PLAYER_ATLAS.frames[key];
  const C = PLAYER_ATLAS.cell;
  const dw = 46, dh = 46;
  const bob = s.moving ? Math.sin(tm / 90) * 1.5 : 0;
  const dx = s.px * TILE + (TILE - dw) / 2, dy = s.py * TILE + TILE - dh + 3 + bob;
  ctx.save();
  if (fx === "left") {
    ctx.translate(dx + dw, 0); ctx.scale(-1, 1);
    ctx.drawImage(playerImg, cx * C, cy * C, C, C, 0, dy, dw, dh);
  } else {
    ctx.drawImage(playerImg, cx * C, cy * C, C, C, dx, dy, dw, dh);
  }
  ctx.restore();
  // rideable drawn under the player
  const ride = s.lab.includes("tugger") ? "🛺" : s.lab.includes("skate") ? "🛹" : null;
  if (ride) {
    ctx.font = "22px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(ride, dx + dw / 2, dy + dh - 2);
  }
}
function drawSpr(rows, pal, tx, ty, flip) {
  const w = Math.max(...rows.map(r => r.length)), h = rows.length;
  const ps = TILE / 16;
  const ox = tx * TILE + (TILE - w * ps) / 2, oy = ty * TILE + (TILE - h * ps) / 2;
  for (let j = 0; j < h; j++) {
    const r = rows[j];
    for (let i = 0; i < r.length; i++) {
      const ch = flip ? r[r.length - 1 - i] : r[i];
      const c = pal[ch]; if (!c) continue;
      ctx.fillStyle = c;
      ctx.fillRect(Math.round(ox + i * ps), Math.round(oy + j * ps), Math.ceil(ps), Math.ceil(ps));
    }
  }
}

function draw() {
  const s = S; if (!s || !s.map) return;
  const tm = performance.now();
  const ts = cv.height / 14; // tiles visible vertically
  ctx.fillStyle = "#dfe3e8"; ctx.fillRect(0, 0, cv.width, cv.height);
  camX = clamp(s.px * TILE + TILE / 2 - cv.width / 2, 0, MAPW * TILE - cv.width);
  camY = clamp(s.py * TILE + TILE / 2 - cv.height / 2, 0, MAPH * TILE - cv.height);
  const sc = ts / TILE;
  ctx.save(); ctx.scale(sc, sc); ctx.translate(-camX, -camY);
  const x0 = Math.max(0, Math.floor(camX / TILE)), x1 = Math.min(MAPW - 1, Math.ceil((camX + cv.width / sc) / TILE));
  const y0 = Math.max(0, Math.floor(camY / TILE)), y1 = Math.min(MAPH - 1, Math.ceil((camY + cv.height / sc) / TILE));
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  for (let y = y0; y <= y1; y++) { const row = s.map[y]; if (!row) continue; for (let x = x0; x <= x1; x++) drawTile(row[x] || 0, x, y, tm); }
  // biome floor labels
  ctx.font = "bold 9px monospace"; ctx.globalAlpha = .55;
  for (const b of BIOMES) {
    const lx = ((b.x0 + b.x1 + 1) / 2) * TILE, ly = (b.y0 + .7) * TILE;
    ctx.fillStyle = "#0008";
    ctx.fillText(b.name, lx + 1, ly + 1);
    ctx.fillStyle = "#fffc";
    ctx.fillText(b.name, lx, ly);
  }
  ctx.globalAlpha = 1;
  // coffee machines
  for (const c of s.coffeeMachines) { ctx.font = "24px serif"; ctx.globalAlpha = c.used ? .35 : 1; ctx.fillText("☕", c.x * TILE + 16, c.y * TILE + 17); ctx.globalAlpha = 1; }
  // lore
  for (const l of s.loreSpots) if (!l.found) { ctx.font = "20px serif"; ctx.fillText("❓", l.x * TILE + 16, l.y * TILE + 16); }
  // devices (broken)
  for (const d of s.devices) {
    ctx.font = "24px serif"; ctx.fillText(d.type.icon, d.x * TILE + 16, d.y * TILE + 17);
    if (!d.fixed) { ctx.font = "14px serif"; ctx.fillText("⚠️", d.x * TILE + 24, d.y * TILE + 8); }
  }
  // portals
  const t = performance.now() / 300;
  for (const p of s.portals) {
    ctx.font = "26px serif";
    ctx.fillStyle = "#a6f"; ctx.globalAlpha = .5 + Math.sin(t + p.x) * .3;
    ctx.beginPath(); ctx.arc(p.x * TILE + 16, p.y * TILE + 16, 12 + Math.sin(t) * 2, 0, 7); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillText("🌀", p.x * TILE + 16, p.y * TILE + 17);
  }
  // NPCs (department uniforms)
  for (const n of s.npcs) {
    drawSpr(SPR_NPC, DEPT_PAL[n.dept] || PAL_NPCS[n.pv ?? 0], n.x, n.y);
    if (!n.ambient && !n.done) {
      ctx.font = "13px serif";
      ctx.fillText(n.critical ? "🚨" : "🎫", n.x * TILE + 24, n.y * TILE + 7);
    } else if (!n.ambient && n.done) { ctx.font = "12px serif"; ctx.fillText("✅", n.x * TILE + 24, n.y * TILE + 7); }
  }
  // player — custom atlas sprite with directional facing
  drawPlayer(s, tm);
  // ---------- DIGITAL TWIN: the living network ----------
  if (s.twin) {
    const cx = (SRV.x0 + SRV.x1 + 1) / 2 * TILE, cy = (SRV.y0 + SRV.y1 + 1) / 2 * TILE;
    const pulse = (tm / 600) % 1;
    ctx.save();
    // traffic lines: every open ticket links back to the data center
    for (const n of s.npcs) {
      if (n.ambient || n.done || !n.type) continue;
      const nx = n.x * TILE + 16, ny = n.y * TILE + 16;
      const broken = n.critical || n.mishandled;
      const col = broken ? "#ff4444" : n.critical ? "#ff4444" : (Math.floor(tm / 500) % 2 ? "#ffd24a" : "#ff9d2a");
      // packet flow line with animated offset
      ctx.strokeStyle = broken ? "#f448" : "#4af5";
      ctx.lineWidth = broken ? 2.5 : 1.5;
      ctx.setLineDash([6, 6]);
      ctx.lineDashOffset = -tm / (broken ? 30 : 60);
      ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(cx, cy); ctx.stroke();
      ctx.setLineDash([]);
      // travelling pulse
      const px2 = nx + (cx - nx) * pulse, py2 = ny + (cy - ny) * pulse;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(px2, py2, broken ? 4 : 3, 0, 7); ctx.fill();
      // broken nodes blink red
      if (broken && Math.floor(tm / 300) % 2) {
        ctx.fillStyle = "#f44";
        ctx.beginPath(); ctx.arc(nx, ny - 14, 5, 0, 7); ctx.fill();
      }
      // holographic label
      ctx.font = "bold 8px monospace";
      ctx.fillStyle = "#000a";
      const label = `${n.type.icon} ${n.type.label}${n.age >= 120 ? " 🔥" : ""}`;
      const lw = ctx.measureText(label).width + 8;
      ctx.fillRect(nx - lw / 2, ny - 30, lw, 12);
      ctx.fillStyle = broken ? "#ff8888" : "#7fd4ff";
      ctx.fillText(label, nx, ny - 24);
    }
    // devices get holo tags too
    for (const d of s.devices) {
      if (d.fixed) continue;
      const dx2 = d.x * TILE + 16, dy2 = d.y * TILE + 16;
      ctx.strokeStyle = "#f446"; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
      ctx.lineDashOffset = -tm / 40;
      ctx.beginPath(); ctx.moveTo(dx2, dy2); ctx.lineTo(cx, cy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = "bold 7px monospace"; ctx.fillStyle = "#ffb347";
      ctx.fillText("FAULT", dx2, dy2 - 12);
    }
    // data center core beacon
    const br = 10 + Math.sin(tm / 200) * 3;
    ctx.strokeStyle = "#4af8"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, br + 6, 0, 7); ctx.stroke();
    ctx.fillStyle = "#4af";
    ctx.beginPath(); ctx.arc(cx, cy, br / 2, 0, 7); ctx.fill();
    ctx.font = "bold 9px monospace"; ctx.fillStyle = "#7fd4ff";
    ctx.fillText("CORE", cx, cy - br - 10);
    ctx.restore();
  }
  ctx.restore();
  // minimap (screen-space, bottom right)
  const mm = 2, mw = MAPW * mm, mh = MAPH * mm;
  const mx0 = Math.max(190, cv.width - mw - 92), my0 = cv.height - mh - 12;
  const ZONE_COLORS = { factory: "#b0b0a8", server: "#3a4a6a", lobby: "#5a7a9a", office: "#d9a05e", exec: "#5a3a44", finance: "#4a5a48", sales: "#4a5a6a", eng: "#8a8a92", hr: "#a08060" };
  ctx.fillStyle = "#000a"; ctx.fillRect(mx0 - 3, my0 - 3, mw + 6, mh + 6);
  for (let y = 0; y < MAPH; y++) for (let x = 0; x < MAPW; x++) {
    const t = s.map[y][x];
    ctx.fillStyle = t === 1 ? "#8a8a96" : ZONE_COLORS[zoneAt(x, y)] || "#d9a05e";
    ctx.fillRect(mx0 + x * mm, my0 + y * mm, mm, mm);
  }
  for (const p of s.portals) { ctx.fillStyle = "#a6f"; ctx.fillRect(mx0 + p.x * mm - 1, my0 + p.y * mm - 1, 3, 3); }
  for (const n of s.npcs) {
    ctx.fillStyle = n.ambient ? "#fff8" : n.done ? "#4f4" : n.critical ? "#f44" : "#fa4";
    ctx.fillRect(mx0 + n.x * mm - 1, my0 + n.y * mm - 1, 3, 3);
  }
  const blink = Math.floor(tm / 400) % 2;
  ctx.fillStyle = blink ? "#fff" : "#4af";
  ctx.fillRect(mx0 + s.px * mm - 1, my0 + s.py * mm - 1, 3, 3);
  ctx.strokeStyle = "#fff6"; ctx.strokeRect(mx0 - 3, my0 - 3, mw + 6, mh + 6);
}

// ---------- movement & input ----------
const keys = {};
addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  if (["e", "enter", " "].includes(e.key.toLowerCase())) interact();
  if (e.key.toLowerCase() === "m") openPanel();
  if (e.key.toLowerCase() === "v") toggleTwin();
});
addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// D-pad: hold-to-move directional buttons
let joy = { x: 0, y: 0 };
const held = new Set();
function dpadUpdate() {
  let x = 0, y = 0;
  for (const b of held) { x += +b.dataset.dx; y += +b.dataset.dy; }
  joy.x = x; joy.y = y;
}
document.querySelectorAll(".dbtn").forEach(b => {
  const press = e => { e.preventDefault(); held.add(b); b.classList.add("held"); dpadUpdate(); };
  const release = e => { e.preventDefault(); held.delete(b); b.classList.remove("held"); dpadUpdate(); };
  b.addEventListener("touchstart", press, { passive: false });
  b.addEventListener("touchend", release, { passive: false });
  b.addEventListener("touchcancel", release, { passive: false });
  b.addEventListener("mousedown", press);
  b.addEventListener("mouseup", release);
  b.addEventListener("mouseleave", release);
});
$("tb-interact").addEventListener("touchstart", e => { e.preventDefault(); interact(); });
$("tb-menu").addEventListener("touchstart", e => { e.preventDefault(); openPanel(); });
$("btn-menu").addEventListener("click", openPanel);
// digital twin: network vision overlay (button or V key)
function toggleTwin() {
  if (!S) return;
  S.twin = !S.twin;
  $("btn-twin").style.background = S.twin ? "#24a" : "";
  toast(S.twin ? "🛰️ DIGITAL TWIN ONLINE — the living network made visible. Press 🛰️ or V to exit." : "🛰️ Digital twin offline.");
}
$("btn-twin").addEventListener("click", toggleTwin);

let moveAcc = 0;
function step(dt) {
  const s = S; if (!s || !s.map || s.inDialog || s.inBattle || s.gameOver || panelOpen || eodOpen) return;
  // ambient NPCs wander the office
  if (Math.random() < .008) {
    const amb = s.npcs.filter(n => n.ambient);
    if (amb.length) {
      const n = pick(amb), [wdx, wdy] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
      const wx = n.x + wdx, wy = n.y + wdy;
      if (s.map[wy] && s.map[wy][wx] === 0 && !npcAt(wx, wy) && !(wx === s.px && wy === s.py)) { n.x = wx; n.y = wy; }
    }
  }
  let dx = (keys.a || keys.arrowleft ? -1 : 0) + (keys.d || keys.arrowright ? 1 : 0) + joy.x;
  let dy = (keys.w || keys.arrowup ? -1 : 0) + (keys.s || keys.arrowdown ? 1 : 0) + joy.y;
  const mag = Math.hypot(dx, dy);
  s.moving = mag > .3;
  if (!s.moving) return;
  if (mag > 1) { dx /= mag; dy /= mag; }
  if (Math.abs(dx) > .1) s.dir = dx > 0 ? 1 : -1;
  if (Math.abs(dx) > Math.abs(dy)) s.fx = dx > 0 ? "right" : "left";
  else if (Math.abs(dy) > .1) s.fx = dy > 0 ? "down" : "up";
  moveAcc += dt * moveSpeed(); // tiles per second
  if (moveAcc < 1) return;
  moveAcc = 0;
  const nx = clamp(Math.round(s.px + (Math.abs(dx) > Math.abs(dy) ? Math.sign(dx) : 0)), 1, MAPW - 2);
  const ny = clamp(Math.round(s.py + (Math.abs(dy) >= Math.abs(dx) ? Math.sign(dy) : 0)), 1, MAPH - 2);
  if (s.map[ny][nx] === 0 && !npcAt(nx, ny)) { s.px = nx; s.py = ny; }
  else if (s.map[s.py][nx] === 0 && !npcAt(nx, s.py)) s.px = nx;
  else if (s.map[ny][s.px] === 0 && !npcAt(s.px, ny)) s.py = ny;
}
function npcAt(x, y) { return S.npcs.find(n => n.x === x && n.y === y); }
function adjacent(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 1; }

// ---------- game loop ----------
let last = 0;
function loop(t) {
  const dt = Math.min(.1, (t - last) / 1000); last = t;
  step(dt);
  draw();
  requestAnimationFrame(loop);
}

// ---------- interaction ----------
function interact() {
  const s = S; if (!s || s.inBattle || panelOpen || eodOpen) return;
  if (s.inDialog) return;
  const p = { x: s.px, y: s.py };
  // NPC?
  const npc = s.npcs.find(n => adjacent(p, n));
  if (npc) return npc.ambient ? ambientTalk(npc) : ticketFlow(npc);
  // portal?
  const portal = s.portals.find(po => adjacent(p, po));
  if (portal) return startBattle(portal);
  // device?
  const dev = s.devices.find(d => adjacent(p, d) && !d.fixed);
  if (dev) return fixDevice(dev);
  // coffee?
  const cof = s.coffeeMachines.find(c => adjacent(p, c) && !c.used);
  if (cof) { cof.used = true; addStress(-25); toast("☕ +25 calm. The dark roast hits."); return; }
  // lore?
  const lore = s.loreSpots.find(l => adjacent(p, l) && !l.found);
  if (lore) {
    lore.found = true; addXP(5);
    if (lore.lid !== undefined && !s.meta.lore.includes(lore.lid)) s.meta.lore.push(lore.lid);
    s.journal.push({ day: s.day, title: "Office Lore", body: lore.text });
    dlg("📜 Discovery", `${lore.text}<br><br><small>palan0 fragments: ${s.meta.lore.length}/5</small>`, [{ t: "Fascinating. (+5 XP)", f: closeDlg }]);
    save();
    return;
  }
}

function dlg(name, text, options) {
  S.inDialog = true;
  $("dialogue").classList.remove("hidden");
  $("dlg-name").textContent = name;
  $("dlg-text").innerHTML = text;
  const box = $("dlg-options"); box.innerHTML = "";
  for (const o of options) {
    const b = document.createElement("button");
    b.innerHTML = o.t; b.onclick = o.f;
    box.appendChild(b);
  }
}
function closeDlg() { S.inDialog = false; $("dialogue").classList.add("hidden"); flushPromo(); }

function ambientTalk(n) {
  const deptLines = {
    Executives: ["We're watching the Q3 numbers very closely.", "My calendar is sacred. Fix it fast."],
    Finance: ["Payroll runs Thursday. Nothing can break Thursday.", "These spreadsheets reconcile themselves, said no one ever."],
    Sales: ["I'm two deals from quota — don't let my phone die.", "The leaderboard doesn't lie, friend."],
    Engineering: ["The prototype arm draws 40 amps. Don't ask why.", "We measure everything twice here."],
    HR: ["Someone microwaved fish again. We're investigating.", "Remember: the ergonomic survey is mandatory."],
    Manufacturing: ["Line 2's conveyor sings when it runs dry. Music to my ears.", "Watch the yellow lines out there."],
  };
  const trustLines = [
    `"Please don't restart it — last time we lost two hours of work."`,
    `"You're the one who 'fixed' it last time, right? ...It's doing it again."`,
    `"My files came back last time, but my faith in IT didn't."`,
  ];
  const legacyHere = S.tickets.find(t => t.legacy && !t.done);
  const lines = [
    ...(n.trustHurt ? trustLines : []),
    ...(deptLines[n.dept] || []),
    pick(RUMORS),
    ...(legacyHere ? [legacyHere.legacyLine] : []),
    ...(S.legendLine && Math.random() < .25 ? [S.legendLine] : []),
    `Heard the ${pick(["server room", "MDF", "fiber vault"])} hums at night. Creepy.`,
    `Word is the old root account is still active somewhere...`,
  ];
  dlg(`${n.name} — ${n.dept}`, pick(lines), [{ t: "Back to work.", f: closeDlg }]);
}

// ---------- ticket flow: interview → diagnose → device → portal/battle → close ----------
function ticketFlow(n) {
  const s = S, t = n.type;
  if (n.done) return dlg(`${n.name} — ${n.dept}`, "Thanks again for the fix! ⭐", [{ t: "Anytime.", f: closeDlg }]);
  if (!n.interviewed) {
    n.interviewed = true; advanceClock(10);
    const symptoms = {
      printer: `"It just says 'PC LOAD LETTER' and makes a screaming noise."`,
      vpn: `"I click connect and it spins forever. I have a meeting in 10 minutes!"`,
      dns: `"The WiFi is connected but NOTHING loads. Is the internet down?"`,
      ad: `"I typed my password ONE time wrong and now I'm locked out. Also maybe 9 times."`,
      malware: `"A pop-up said I won a cruise, so I clicked it. Why does my screen have... friends?"`,
      email: `"My inbox is empty. EMPTY. Where did 14,000 emails go?"`,
      bsod: `"It blue screens every time I open the spreadsheet. THE spreadsheet."`,
      plc: `"Line 3 is down. The PLC won't talk to anything. Production is staring at me."`,
      wifi: `"The WiFi just dies in the east stairwell. My calls drop every single time."`,
      cert: `"The site says 'Your connection is not private' with a big red warning. Clients are calling."`,
      disk: `"It says C: is full. 0 bytes free. I only saved ONE 40GB video of the Christmas party."`,
      update: `"It's been 'Working on updates, 27%' for three hours. Don't turn it off, right?"`,
      share: `"It says Access Denied on the Q: drive, but Dave in accounting can open it just fine."`,
      vlan: `"My desk phone works but my laptop gets no IP. IT plugged me into the wrong port, didn't they?"`,
      backup: `"The nightly backup has failed 4 days in a row. Nobody noticed until Legal asked for a restore."`,
      slowpc: `"It takes 12 minutes to boot. I time it. I have a spreadsheet of the boot times."`,
      shadow: `"ACCESS GRANTED... — the terminal is typing by itself: 'i remember this building. i remember YOU.'`,
    };
    dlg(`${n.name} — ${n.dept} ${n.critical ? "🚨" : ""}`,
      `${n.legacy ? `<span style="color:#ffd24a">🏛️ <b>LEGACY SYSTEM: ${n.legacy}</b></span><br><i>${n.legacyLine}</i><br><br>` : ""}<b>${t.icon} ${t.label}</b>${n.repeat ? ' <span style="color:#ffb347">🔁 REPEAT</span>' : ""}<br>${symptoms[t.id]}${n.trustHurt ? '<br><i>"...and please don’t just restart it — last time we lost two hours."</i>' : ""}<br><small>Interview the user, then form a hypothesis.</small>`,
      [{ t: "🔍 Form a diagnosis", f: () => diagnose(n) }]);
    return;
  }
  if (!n.diagnosed) return diagnose(n);
  dlg(`${n.name} — ${n.dept}`, n.fixedReady ? "The portal is open by the device. Good luck in there... 🌀" : "Find the broken device nearby (look for ⚠️).", [{ t: "On it.", f: closeDlg }]);
}

function diagnose(n) {
  const s = S, t = n.type;
  // build a shuffled option set: best + okay + 2 plausible-but-wrong
  const wrongs = [...t.diag.wrong].sort(() => Math.random() - .5).slice(0, 2);
  const pool = [
    { text: t.diag.best, kind: "best" },
    { text: t.diag.okay, kind: "okay" },
    ...wrongs.map(w => ({ text: w, kind: "wrong" })),
  ].sort(() => Math.random() - .5);
  const opts = pool.map((o, i) => ({
    t: `${["🅰", "🅱", "🅲", "🅳"][i]} ${o.text}`,
    f: () => {
      n.diagnosed = true; n.correctDiag = o.kind === "best";
      advanceClock(15);
      // spawn broken device near npc
      const dp = freeSpot(s.map, n.x, n.y);
      s.devices.push({ ...dp, type: t, fixed: false, npc: n.id });
      const pp = freeSpot(s.map, dp.x, dp.y);
      if (o.kind === "best") {
        addXP(8); toast("🎯 Correct diagnosis! (+8 XP)");
        // good diagnosis = easier dungeon: portal appears, enemy weakened
        s.portals.push({ ...pp, npc: n.id, weak: true });
      } else if (o.kind === "okay") {
        addXP(4);
        toast(`🤔 Reasonable — that helps some, but it's not the root cause. (+4 XP)<br><small>Best move: ${t.diag.best}</small>`, 3400);
        // partial credit: normal-strength enemy, no stress
        s.portals.push({ ...pp, npc: n.id, weak: false, partial: true });
      } else {
        addStress(10); n.trustHurt = true;
        toast(`❌ Wrong hypothesis... the problem is worse than it looked. (+10 stress)<br><small>Best move: ${t.diag.best}</small>`, 3400);
        s.portals.push({ ...pp, npc: n.id, weak: false });
      }
      n.fixedReady = true;
      closeDlg(); updateHUD();
    }
  }));
  dlg("🧠 Diagnosis", `<b>${t.label}</b><br>What's the most likely root cause?`, opts);
}

function fixDevice(d) {
  const s = S;
  if (!s.portals.some(p => p.npc === d.npc && !p.cleared)) {
    // portal already cleared → physical repair completes it
    d.fixed = true;
    resolveTicket(s.npcs.find(n => n.id === d.npc));
    return;
  }
  dlg("🔧 Device", `The ${d.type.label.toLowerCase()} hardware looks physically fine... the corruption runs deeper. Enter the 🌀 portal to fight the manifestation.`, [{ t: "OK", f: closeDlg }]);
}

// ---------- battle ----------
let B = null;
const BOSS_NAMES = { malware: "RANSOMWARE QUEEN", bsod: "BLUE SCREEN TITAN", dns: "DNS HYDRA PRIME", ad: "ARCHLICH OF IDENTITIES", vpn: "TUNNEL DEVOURER", printer: "PRINTER KING", email: "PHANTOM POSTMASTER", plc: "THE LINE STOPPER", wifi: "THE DEAD ZONE", cert: "EXPIRED ROOT", disk: "THE HOARDER", update: "ETERNAL 27%", share: "LORD ACCESS DENIED", vlan: "THE MISPATCH", backup: "THE FAILED JOB", slowpc: "BLOATLORD", shadow: "THE SHADOW ADMINISTRATOR" };
function startBattle(portal) {
  const s = S, npc = s.npcs.find(n => n.id === portal.npc), t = npc.type;
  const lv = 1 + Math.floor(s.day / 2) + (npc.critical ? 2 : 0);
  let hp = 22 + lv * 10;
  if (portal.weak) hp = Math.round(hp * .7);
  if (s.chaos?.id === "outage" && t.stat === "networking") hp = Math.round(hp * 1.3);
  const boss = !!npc.critical;
  if (boss) hp = Math.round(hp * (t.id === "shadow" ? 1.9 : s.diff > 1 ? 2.0 : 1.8));
  hp = Math.round(hp * (s.ngPlus ? 1.25 : 1));
  // neglected problems harden: aged tickets make tougher enemies
  const ageMin = npc.age || 0;
  if (ageMin >= 60) hp = Math.round(hp * (1 + Math.min(ageMin, 240) / 60 * .05));
  const SIGS = { malware: ["enclock", "ransom"], dns: ["spawn", "poison"], bsod: ["crash", "freeze"] };
  B = { portal, npc, t, hp, maxHp: hp, shield: false, stunned: false, weakened: false, regen: false, log: [], boss, enraged: false, turns: 0, locks: {}, revealed: false, dmgBuff: 0, counter: false, sig: pick(SIGS[t.id] || ["overload", "wipe"]), forkBomb: false,
    uncertainty: boss ? 90 : 70, evidence: 0, hyp: false, hypFailed: false, hypChoice: false, verified: false, documented: false, seq: [],
    confidence: 10, personality: npc.personality || "routine" };
  // dynamic root-cause tree: the true cause hides among plausible branches
  B.branches = [{ text: t.diag.best, correct: true, dead: false },
    ...[...t.diag.wrong].sort(() => Math.random() - .5).slice(0, 2).map(w => ({ text: w, correct: false, dead: false }))
  ].sort(() => Math.random() - .5);
  if (B.personality === "problem") { B.uncertainty = clamp(B.uncertainty + 15, 0, 100); B.xpMult = 1.2; }
  s.inBattle = true;
  sfx("portal");
  $("battle").classList.remove("hidden");
  $("enemy-sprite").textContent = t.eicon;
  $("enemy-sprite").style.fontSize = boss ? "96px" : "72px";
  $("enemy-sprite").style.filter = boss ? "drop-shadow(0 0 20px #f44)" : "drop-shadow(0 0 12px #a0f)";
  $("enemy-name").textContent = boss ? `👹 ${BOSS_NAMES[t.id] || "BOSS: " + t.enemy} 👹` : `${t.enemy} — ${t.world}`;
  blog(boss
    ? `<span class="sys">⚠️ ${npc.codename ? `<b>«${npc.codename}»</b> — ` : ""}The corruption is MASSIVE here. <b>${BOSS_NAMES[t.id] || t.enemy}</b> rises from the ${t.world}. This is a BOSS fight — watch for phase changes!</span>`
    : `<span class="sys">You step through the portal into the <b>${t.world}</b>. A ${t.enemy} manifests!</span>`);
  if (B.personality && B.personality !== "routine") blog(`<span class="sys">🎭 <b>${B.personality.toUpperCase()} ticket</b> — ${{ security: "evidence decays over time! Uncertainty regrows each turn.", problem: "hidden systemic cause. Deeper uncertainty, richer rewards.", executive: "an exec is watching. Every turn costs composure (+stress).", manufacturing: "every turn burns production money." }[B.personality] || ""}</span>`);
  blog(`<span class="sys">🔍 <b>Troubleshoot it:</b> 💬 Ask and Inspect (Ping, Event Viewer, Wireshark...) to burn down <b>UNCERTAINTY</b> — fixes executed blind are weak and can backfire. Form a hypothesis at ≤50%, Execute, then ✔️ Verify before closing.</span>`);
  renderBattle();
}
function blog(h) { B.log.push(h); $("battle-log").innerHTML = B.log.slice(-30).join("<br>"); $("battle-log").scrollTop = 1e6; }
function battleAbilities() {
  let list = [...ABILITIES];
  const ri = RANKS.indexOf(rank());
  for (const m of MOVE_LEVELS) if (ri >= m.rank) list.push(m.ability);
  for (const c of S.certs) if (CERT_ABILITIES[c]) list.push(CERT_ABILITIES[c]);
  // books teach moves early
  for (const bid of S.books) {
    const stock = STORE_STOCK.find(x => x.id === bid);
    if (!stock) continue;
    const mv = MOVE_LEVELS.find(m => m.ability.id === stock.move)?.ability || CERT_ABILITIES[stock.move];
    if (mv && !list.some(a => a.id === mv.id)) list.push(mv);
  }
  // categorize: recon tools are Inspect, everything else with damage is Execute
  list = list.map(a => ({ ...a, cat: INSPECT_IDS.includes(a.id) ? "inspect" : "execute" }));
  // workflow actions
  for (const w of WORKFLOW_ABILITIES) {
    if (w.minRank && ri < w.minRank) continue;
    if (w.id === "verify" || w.id === "document" || w.id === "randomfix" || w.cat === "ask") list.push({ ...w });
  }
  // hypothesis unlocks at 60% confidence — evidence earns the right to commit
  if (B && !B.hyp && !B.hypFailed && B.confidence >= 60) list.push({ id: "hypothesize", name: "Form Hypothesis", icon: "🧠", cat: "hyp", dmg: [0, 0], stress: 5, desc: "Commit to a root cause: +50% fix damage if right." });
  return list;
}
function renderBattle() {
  const s = S;
  $("enemy-hp").style.width = clamp(B.hp / B.maxHp * 100, 0, 100) + "%";
  const uncEl = $("enemy-unc");
  if (uncEl) {
    uncEl.style.width = clamp(B.uncertainty, 0, 100) + "%";
    $("enemy-unc-text").textContent = B.hyp ? `HYPOTHESIS LOCKED — ${B.t.diag.best.toUpperCase()}` : `UNCERTAINTY ${Math.round(B.uncertainty)}% · EVIDENCE ${B.evidence}`;
  }
  const confEl = $("enemy-conf");
  if (confEl) {
    confEl.style.width = clamp(B.confidence, 0, 100) + "%";
    const alive = B.branches ? B.branches.filter(b => !b.dead).length : 3;
    $("enemy-conf-text").textContent = B.hyp ? "ROOT CAUSE CONFIRMED" : `CONFIDENCE ${Math.round(B.confidence)}%${B.confidence >= 60 ? " — READY TO HYPOTHESIZE" : ""} · ${alive} BRANCH${alive === 1 ? "" : "ES"}`;
  }
  $("player-hp").style.width = clamp(s.hp / s.maxHp * 100, 0, 100) + "%";
  $("player-hp-text").textContent = `HP ${s.hp}/${s.maxHp} · Stress ${s.stress}/100`;
  const box = $("battle-actions"); box.innerHTML = "";
  // hypothesis sub-choice: pick the root cause from evidence
  if (B.hypChoice) {
    const opts = B.hypChoice.map(c => {
      const b = document.createElement("button");
      b.className = "hyp-btn";
      const aiTag = c.correct && s.lab.includes("ai") ? " 🤖 <b>AI SUGGESTS</b>" : "";
      b.innerHTML = `${c.correct ? "🧠" : "❓"} ${c.text}${aiTag}`;
      b.onclick = () => resolveHypothesis(c.correct);
      box.appendChild(b);
    });
    return;
  }
  for (const a of battleAbilities()) {
    const b = document.createElement("button");
    const locked = B.locks[a.id] > 0;
    let cost = locked ? `🔐 encrypted ${B.locks[a.id]}t` : a.stress > 0 ? "+" + a.stress + " stress" : a.stress < 0 ? a.stress + " stress" : "free";
    // telegraph risk: blind executes are weak
    if (a.cat === "execute" && a.dmg[1] > 0 && B.uncertainty > 60) cost += " ⚠️ blind";
    if (a.cat === "verify" && B.hp > B.maxHp * .4) cost = "🔒 fix first";
    b.innerHTML = `${a.icon} ${a.name}<span class="cost">${cost}</span>`;
    b.disabled = locked || s.stress + a.stress > 100 ||
      (a.cat === "verify" && B.hp > B.maxHp * .4) ||
      (a.cat === "document" && B.documented) ||
      (a.cat === "verify" && B.verified);
    b.onclick = () => doAbility(a);
    box.appendChild(b);
  }
}
function doAbility(a) {
  const s = S;
  if (!B || B.over) return;
  if (a.cat && a.cat !== "execute") return workflowAction(a);
  B.seq.push("execute");
  addStress(a.stress);
  s.meta.cmds++;
  let dmg = 0;
  if (a.dmg[1] > 0) {
    // blind fix backfire: executing with >60% uncertainty can make things WORSE
    if (B.uncertainty > 60 && Math.random() < .35) {
      B.uncertainty = clamp(B.uncertainty + 8, 0, 100);
      s.meta.debt++; B.npc.trustHurt = true;
      addStress(6);
      sfx("bad");
      blog(`<span class="sys">💥 <b>BLIND FIX BACKFIRED!</b> You changed settings without evidence — the problem mutates and the user watched you do it. (+1 tech debt)</span>`);
      enemyPhase();
      if (!B || B.over) return;
      renderBattle(); updateHUD();
      return;
    }
    const bonus = statBonus(B.t.stat);
    dmg = R(a.dmg[0], a.dmg[1]) + Math.round(bonus / 2);
    // evidence multiplier: fixes land at full strength only when uncertainty is low
    dmg = Math.max(1, Math.round(dmg * (1 - B.uncertainty / 220)));
    // confidence sharpens the fix further
    dmg = Math.max(1, Math.round(dmg * (1 + B.confidence / 300)));
    if (B.hyp) dmg = Math.round(dmg * 1.5);
    if (B.weakened) dmg = Math.round(dmg * 1.25);
    // IT-accurate effectiveness: right tool for the right problem
    const tac = ENEMY_TACTICS[B.t.id];
    let note = "";
    if (tac?.weak.includes(a.id)) { dmg = Math.round(dmg * 1.6); note = " ✅ <b>Right tool for the job — super effective!</b>"; }
    else if (tac?.resist.includes(a.id)) { dmg = Math.max(1, Math.round(dmg * .35)); note = ` ⚠️ <b>Barely effective</b> — ${tac.resistNote}`; }
    if (B.dmgBuff > 0) { dmg = Math.round(dmg * 1.25); note += " 📜 <i>GPO enforced</i>"; }
    if (a.crit && Math.random() < .25) { dmg = dmg * 3; note += " 🔎 <b>CORRELATED — CRITICAL HIT!</b>"; }
    B.hp -= dmg;
    sfx("hit");
    blog(`<span class="sys">C:\\&gt; ${ABILITY_CMDS[a.id] || a.name}</span>`);
    blog(`<span class="dmg">${a.icon} ${a.name} hits for <b>${dmg}</b>!${note}</span>`);
  }
  if (a.heal) { s.hp = clamp(s.hp + a.heal, 0, s.maxHp); blog(`<span class="heal">+${a.heal} HP</span>`); }
  if (a.shield) { B.shield = true; blog(`<span class="sys">🧱 Firewall up — next hit halved.</span>`); }
  if (a.stun) { B.stunned = true; blog(`<span class="sys">🔒 Enemy contained! It loses a turn.</span>`); }
  if (a.weaken) { B.weakened = true; blog(`<span class="sys">🛰️ Weakness found: take +25% damage.</span>`); }
  if (a.regen) { B.regen = true; blog(`<span class="sys">☁️ Auto-scaling: +3 HP per turn.</span>`); }
  if (a.buff) { B.dmgBuff = 3; blog(`<span class="sys">📜 Group Policy enforced — +25% damage for 3 turns.</span>`); }
  if (a.counter) { B.counter = true; blog(`<span class="sys">🛡️ Zero Trust active — half of the next hit reflects back.</span>`); }
  if (B.dmgBuff > 0 && a.dmg[1] > 0) B.dmgBuff--;
  if (a.usable === "calm") blog(`<span class="heal">☕ You feel human again.</span>`);
  if (B.hp <= 0) return winBattle();
  // boss phase change at 50%
  if (B.boss && !B.enraged && B.hp <= B.maxHp / 2) {
    B.enraged = true;
    sfx("chain");
    blog(B.t.id === "shadow"
      ? `<span class="sys">🌑 <b>palan0 escalates to root.</b> He begins DELETING your moves one by one!</span>`
      : `<span class="sys">👹 <b>PHASE 2</b> — ${BOSS_NAMES[B.t.id] || B.t.enemy} ENRAGES! Its attacks intensify and it unleashes signature moves!</span>`);
  }
  // shadow final phase: fork bomb
  if (B.t.id === "shadow" && !B.forkBomb && B.hp <= B.maxHp * .2) {
    B.forkBomb = true;
    sfx("bad");
    blog(`<span class="sys">☠️ <b>FORK BOMB</b> — palan0 replicates uncontrollably (+8 HP/turn). KILL HIM BEFORE HE OVERFLOWS THE NETWORK!</span>`);
  }
  enemyPhase();
  if (!B || B.over) return;
  renderBattle(); updateHUD();
}
function enemyPhase() {
  const s = S;
  // enemy turn
  B.turns++;
  if (B.stunned) { B.stunned = false; }
  else if (B.boss && B.enraged && B.turns % 3 === 0) {
    // boss signature move every 3rd turn while enraged (2 variants per boss type)
    if (B.t.id === "shadow") {
      // palan0 DELETES your strongest remaining move (temporary, never below 2 tools)
      const pool = battleAbilities().filter(a => a.dmg[1] > 0 && !B.locks[a.id]).sort((x, y) => y.dmg[1] - x.dmg[1]);
      if (pool.length > 2) { const victim = pool[0]; B.locks[victim.id] = 4; blog(`🗑️ <b>palan0 DELETES your ${victim.name}!</b> Gone for 4 turns — improvise!`); }
      else { const ed = R(14, 20); s.hp -= ed; blog(`🌑 Root overflow — you take ${ed}.`); }
    }
    else if (B.sig === "enclock") {
      const pool = battleAbilities().filter(a => a.dmg[1] > 0 && !B.locks[a.id]);
      if (pool.length) { const victim = pick(pool); B.locks[victim.id] = 2; blog(`🔐 <b>ENCRYPTION LOCK!</b> Your ${victim.name} is encrypted for 2 turns!`); }
      else { const ed = R(10, 16); s.hp -= ed; blog(`🔐 Encryption blast — you take ${ed}.`); }
    }
    else if (B.sig === "ransom") {
      const fee = Math.min(s.budget, 30);
      s.budget -= fee;
      let ed = fee >= 30 ? 4 : 12; if (B.shield) { ed = Math.ceil(ed / 2); B.shield = false; }
      s.hp -= ed; addStress(6);
      blog(`💰 <b>RANSOM DEMAND!</b> You pay $${fee} to decrypt — you take ${ed}.`);
    }
    else if (B.sig === "spawn") {
      const heal = R(8, 14); B.hp = Math.min(B.maxHp, B.hp + heal);
      blog(`🐍 <b>SPAWN HEAD!</b> The Hydra regrows a head — it recovers ${heal} HP!`);
    }
    else if (B.sig === "poison") {
      B.poison = 3; addStress(8);
      blog(`☠️ <b>CACHE POISON!</b> Corrupted records burn you for 3 turns!`);
    }
    else if (B.sig === "crash") {
      let ed = R(12, 18); if (B.shield) { ed = Math.ceil(ed / 2); B.shield = false; }
      s.hp -= ed; addStress(8);
      blog(`💙 <b>CRASH WAVE!</b> A wall of blue slams you for ${ed} — logs scatter everywhere!`);
    }
    else if (B.sig === "freeze") {
      B.frozen = true; addStress(5);
      blog(`🧊 <b>SYSTEM FREEZE!</b> Your next action is lost to a hard hang!`);
    }
    else if (B.sig === "wipe") {
      const pool = battleAbilities().filter(a => a.dmg[1] > 0 && !B.locks[a.id]).sort((x, y) => x.dmg[1] - y.dmg[1]);
      if (pool.length) { const victim = pool[0]; B.locks[victim.id] = 2; blog(`🗑️ <b>CORRUPTION WIPE!</b> Your weakest tool, ${victim.name}, is corrupted for 2 turns!`); }
      else { const ed = R(9, 15); s.hp -= ed; blog(`👹 Corruption surge — you take ${ed}.`); }
    }
    else {
      let ed = R(9, 15); if (B.shield) { ed = Math.ceil(ed / 2); B.shield = false; }
      s.hp -= ed; addStress(6);
      blog(`👹 <b>CRITICAL OVERLOAD!</b> Raw corruption hits you for ${ed}!`);
    }
  }
  else if (B.frozen) {
    B.frozen = false;
    blog(`🧊 You are frozen solid — turn lost!`);
  }
  else {
    const atk = pick(ENEMY_TACTICS[B.t.id]?.attacks || ["Packet Flood", "Corruption Wave"]);
    let ed = Math.round((R(5, 10) + Math.floor(s.day * .75) + (B.enraged ? 2 : 0)) * (s.diff || 1));
    if (B.shield) { ed = Math.ceil(ed / 2); B.shield = false; }
    s.hp -= ed; addStress(4);
    blog(`💥 ${B.t.enemy} uses <b>${atk}</b> — you take ${ed}.`);
    if (B.counter) { B.counter = false; const ref = Math.ceil(ed / 2); B.hp -= ref; blog(`🛡️ <b>Zero Trust reflects ${ref} back!</b>`); }
  }
  // ticket personalities reshape the battlefield each turn
  if (B.personality === "security") {
    B.uncertainty = clamp(B.uncertainty + 2, 0, 100);
    if (B.turns % 2 === 0) blog(`<span class="sys">🕵️ Logs are being wiped — uncertainty regrows (+2%).</span>`);
  } else if (B.personality === "executive") {
    addStress(1);
  } else if (B.personality === "manufacturing") {
    if (B.turns % 3 === 0) blog(`<span class="sys">🏭 The line idles... every turn burns production budget.</span>`);
  }
  // tick down encryption locks
  for (const k of Object.keys(B.locks)) if (--B.locks[k] <= 0) { delete B.locks[k]; blog(`<span class="sys">🔓 Decryption complete — ability restored.</span>`); }
  if (B.regen) s.hp = clamp(s.hp + 3, 0, s.maxHp);
  if (B.poison > 0) { B.poison--; s.hp -= 4; blog(`☠️ Cache poison burns you for 4.`); }
  if (B.forkBomb) { B.hp = Math.min(B.maxHp, B.hp + 8); blog(`☠️ palan0 replicates... <b>+8 HP</b>`); }
  if (s.hp <= 0) return loseBattle();
}

// ---------- troubleshooting workflow actions (ask / inspect / hypothesize / verify / document) ----------
function workflowAction(a) {
  const s = S;
  addStress(a.stress);
  const tac = ENEMY_TACTICS[B.t.id];
  if (a.cat === "ask") {
    B.seq.push("ask");
    const red = a.id === "interview" ? R(18, 26) : R(8, 14);
    B.uncertainty = clamp(B.uncertainty - red, 0, 100);
    B.evidence += a.id === "interview" ? 2 : 1;
    blog(`<span class="sys">💬 ${pick(ASK_LINES)}</span>`);
    const w = (EVIDENCE_WEIGHTS[B.t.id] || {}).testimony || 2;
    const cg = Math.round(w * R(4, 7) * (a.id === "interview" ? 1.6 : 1));
    B.confidence = clamp(B.confidence + cg, 0, 100);
    blog(`<span class="heal">Evidence gathered — uncertainty -${red}%, <b>${EVIDENCE_LABEL.testimony}</b> +${cg} confidence (now ${Math.round(B.confidence)}%).${w >= 3 ? " Testimony really matters for this one." : ""}</span>`);
    if (a.id === "interview") blog(`<span class="sys">🗣️ Guided interview: the user walks you through the whole failure timeline.</span>`);
    pruneBranches();
  } else if (a.cat === "inspect") {
    B.seq.push("inspect");
    let red, note;
    if (tac?.weak.includes(a.id)) { red = R(20, 30); B.evidence += 2; note = " ✅ <b>the right diagnostic</b> — the telemetry is damning!"; }
    else if (tac?.resist.includes(a.id)) { red = R(4, 8); B.evidence += 0; note = ` ⚠️ <b>wrong tool</b> — ${tac.resistNote}`; }
    else { red = R(12, 18); B.evidence += 1; note = ""; }
    B.uncertainty = clamp(B.uncertainty - red, 0, 100);
    blog(`<span class="sys">C:\\&gt; ${ABILITY_CMDS[a.id] || a.name}</span>`);
    blog(`<span class="heal">🔍 ${a.name} reveals new evidence — uncertainty -${red}% (now ${Math.round(B.uncertainty)}%).${note}</span>`);
    // weighted evidence → confidence; but some clues are FALSE POSITIVES
    const etype = EVIDENCE_TYPES[a.id] || "config";
    const fpImmune = etype === "network" && s.lab.includes("fluke");
    if (!fpImmune && Math.random() < .15) {
      B.confidence = clamp(B.confidence - 8, 0, 100);
      blog(`<span class="sys">🎭 <b>FALSE POSITIVE:</b> ${pick(FALSE_POSITIVES)} (-8 confidence)</span>`);
    } else {
      const w2 = (EVIDENCE_WEIGHTS[B.t.id] || {})[etype] || 2;
      let cg2 = Math.round(w2 * R(4, 7) * (tac?.weak.includes(a.id) ? 1.4 : 1));
      if (s.lab.includes("monitor2")) cg2 += 3;
      if (s.lab.includes("thermal") && B.t.stat === "hardware") cg2 += 10;
      B.confidence = clamp(B.confidence + cg2, 0, 100);
      blog(`<span class="heal"><b>${EVIDENCE_LABEL[etype]}</b> +${cg2} confidence (now ${Math.round(B.confidence)}%).${w2 >= 4 ? " This is exactly the evidence that matters here." : w2 <= 1 ? " ...not the most relevant clue for this problem." : ""}</span>`);
    }
    pruneBranches();
    // recon still reveals the weakness profile
    if (!B.revealed && tac) {
      B.revealed = true;
      const names = id => (ABILITIES.concat(Object.values(CERT_ABILITIES), MOVE_LEVELS.map(m => m.ability)).find(x => x.id === id) || {}).name || id;
      blog(`<span class="sys">📋 Analysis: weak to <b>${tac.weak.map(names).join(", ")}</b>; resists <b>${tac.resist.map(names).join(", ")}</b>.</span>`);
    }
  } else if (a.cat === "hyp") {
    // commit to a root cause from the surviving branches of the investigation tree
    B.hypChoice = B.branches.filter(b => !b.dead).map(b => ({ text: b.text, correct: b.correct }));
    if (B.hypChoice.length === 1) {
      // the tree collapsed to a single branch — that's the answer
      return resolveHypothesis(B.hypChoice[0].correct);
    }
    blog(`<span class="sys">🧠 The investigation tree has ${B.hypChoice.length} live branches. <b>What's the root cause?</b></span>`);
    renderBattle();
    return;
  } else if (a.cat === "verify") {
    B.seq.push("verify");
    B.verified = true;
    blog(`<span class="heal">✔️ <b>Verified:</b> user confirms the fix holds, logs are clean, monitoring shows green. This one won't bounce back.</span>`);
  } else if (a.cat === "document") {
    B.documented = true;
    s.meta.kb = s.meta.kb || {};
    s.meta.kb[B.t.id] = true; // knowledge graph: your org learns this failure mode
    addXP(s.lab.includes("mechkb") ? 10 : 5); addStress(-5);
    s.journal.push({ day: s.day, title: `${B.t.label} — field notes`, body: `Symptoms observed, hypothesis formed, tests run. Root cause: ${B.hyp ? B.t.diag.best : "(still under investigation)"}. Good documentation trains the whole team.` });
    blog(`<span class="heal">📝 Documented: +5 XP, -5 stress. Future techs thank you — including your hires.</span>`);
  } else if (a.cat === "chaos") {
    B.seq.push("chaos");
    if (Math.random() < .3) {
      const dmg = R(15, 25);
      B.hp -= dmg;
      blog(`<span class="dmg">🎲 Random fix... <b>it worked?!</b> ${dmg} complexity removed. Nobody will ever know why. (Least of all you.)</span>`);
      if (B.hp <= 0) return winBattle();
    } else {
      s.meta.debt++;
      B.uncertainty = clamp(B.uncertainty + 10, 0, 100);
      B.npc.trustHurt = true;
      sfx("bad");
      blog(`<span class="sys">🎲 Random fix failed — you knocked something else loose. <b>+1 tech debt</b>, uncertainty +10%.</span>`);
    }
  }
  enemyPhase();
  if (!B || B.over) return;
  renderBattle(); updateHUD();
}
// insight: crossing 75% confidence reveals a hidden connection
function checkInsight() {
  if (B.insightUsed || B.confidence < 75) return;
  B.insightUsed = true;
  sfx("win");
  blog(`<span class="heal">${INSIGHTS[B.t.stat] || INSIGHTS.windows}</span>`);
  // an insight prunes a wrong branch instantly and steadies your hands
  const wrong = B.branches.find(b => !b.dead && !b.correct);
  if (wrong) { wrong.dead = true; blog(`<span class="sys">🌳 Insight eliminates: <s>${wrong.text}</s></span>`); }
  B.confidence = clamp(B.confidence + 10, 0, 100);
  const left = B.branches.filter(b => !b.dead);
  if (left.length === 1) blog(`<span class="heal">🌳 Only one branch remains: <b>${left[0].text}</b>. The tree has spoken.</span>`);
}
// every 3 evidence prunes one wrong branch from the root-cause tree
function pruneBranches() {
  if (!B.branches) return;
  const alive = B.branches.filter(b => !b.dead && !b.correct);
  const target = Math.floor(B.evidence / 3);
  const deadCount = B.branches.filter(b => b.dead).length;
  if (alive.length && deadCount < Math.min(target, B.branches.length - 1)) {
    const victim = alive[0];
    victim.dead = true;
    blog(`<span class="sys">🌳 Evidence eliminates a branch: <s>${victim.text}</s> — ruled out.</span>`);
    const left = B.branches.filter(b => !b.dead);
    if (left.length === 1) blog(`<span class="heal">🌳 Only one branch remains: <b>${left[0].text}</b>. The tree has spoken.</span>`);
  }
  checkInsight();
}
function resolveHypothesis(correct) {
  const s = S;
  B.hypChoice = false;
  if (correct) {
    B.hyp = true;
    B.uncertainty = clamp(B.uncertainty - 15, 0, 100);
    blog(`<span class="heal">🎯 <b>HYPOTHESIS CONFIRMED:</b> ${B.t.diag.best}. Fixes now hit +50% — execute with confidence!</span>`);
    sfx("win");
  } else {
    B.hypFailed = true;
    B.uncertainty = clamp(B.uncertainty + 10, 0, 100);
    addStress(8);
    blog(`<span class="sys">❌ Wrong call — the evidence doesn't support it. Uncertainty +10%. (The root cause was: ${B.t.diag.best}.)</span>`);
    enemyPhase();
    if (!B || B.over) return;
  }
  renderBattle(); updateHUD();
}

function winBattle() {
  const s = S, n = B.npc, t = B.t;
  B.over = true;
  sfx("win");
  if (t.id === "printer") s.meta.printerKills++;
  const isShadow = t.id === "shadow";
  if (isShadow) { s.shadowDone = true; unlock("root"); if (s.diff > 1) unlock("oncall"); }
  let xp = B.boss ? 70 + s.day * 2 : 20 + (n.critical ? 30 : 0);
  if (B.xpMult) xp = Math.round(xp * B.xpMult);
  if (s.chaos?.id === "patch") xp = Math.round(xp * 1.5);
  addXP(xp);
  blog(`<span class="sys">🏆 ${t.enemy} defeated! +${xp} XP</span>`);
  // loot
  const roll = Math.random();
  let drops = [];
  if (roll < .5) drops.push(rollLoot("common"));
  else if (roll < .8) drops.push(rollLoot("rare"));
  else if (roll < .95) drops.push(rollLoot("epic"));
  else drops.push(rollLoot("legendary"));
  if (n.critical) drops.push(rollLoot("epic"));
  if (B.boss && Math.random() < .35) drops.push(rollLoot("legendary"));
  if (isShadow) { drops.push(rollLoot("legendary"), rollLoot("legendary")); }
  for (const l of drops) {
    s.inv.push(l); s.lootToday++;
    if (l.rarity === "legendary") s.meta.legendaries++;
    blog(`<span class="heal">Loot: ${l.icon} <b>${l.name}</b> (${l.rarity})</span>`);
  }
  if (drops.length) sfx("loot");
  checkAch();
  const cash = R(15, 40) * (s.chaos?.id === "audit" ? 2 : 1);
  s.budget += cash; blog(`<span class="heal">💰 +$${cash} budget</span>`);
  // verification & method bonuses (evidence-based troubleshooting pays off)
  if (B.verified) {
    n.verifiedFix = true;
    addXP(10);
    s.rep[n.dept] = clamp(s.rep[n.dept] + 1, 0, 5);
    blog(`<span class="heal">✔️ Verified resolution — the fix will hold. +10 XP, +1 ${n.dept} rep.</span>`);
  } else if (Math.random() < .4) {
    // skipped verification: the ticket may bounce back as a repeat
    n.pendingRepeat = true;
    blog(`<span class="sys">⚠️ You closed it without verifying... hope it stays fixed.</span>`);
  }
  // Perfect Investigation: rate the whole troubleshooting arc
  const firstExec = B.seq.indexOf("execute");
  const didRecon = B.seq.some(c => c === "ask" || c === "inspect");
  let stars = 1;
  if (didRecon && (firstExec === -1 || B.seq.findIndex(c => c === "ask" || c === "inspect") < firstExec)) stars++; // recon before fixes
  if (B.hyp) stars++;           // correct hypothesis
  if (B.verified) stars++;      // verified before closing
  if (B.documented) stars++;    // documented the work
  B.stars = stars;
  blog(`<span class="heal">${"★".repeat(stars)}${"☆".repeat(5 - stars)} <b>INVESTIGATION RATING</b></span>`);
  if (stars >= 5) {
    addXP(25);
    s.rep[n.dept] = clamp(s.rep[n.dept] + 1, 0, 5);
    s.meta.kb = s.meta.kb || {}; s.meta.kb[t.id] = true;
    blog(`<span class="heal">🔬 <b>PERFECT INVESTIGATION</b> — observe → hypothesize → execute → verify → document. +25 XP, +1 ${n.dept} rep, knowledge captured.</span>`);
  } else if (didRecon && (firstExec === -1 || B.seq.findIndex(c => c === "ask" || c === "inspect") < firstExec) && B.verified) {
    addXP(15);
    blog(`<span class="heal">🔬 <b>SCIENTIFIC METHOD BONUS</b> — observe, hypothesize, test, verify. +15 XP.</span>`);
  }
  B.portal.cleared = true;
  setTimeout(() => {
    $("battle").classList.add("hidden");
    s.inBattle = false;
    // remove portal
    s.portals = s.portals.filter(p => p !== B.portal);
    // journal
    s.journal.push({ day: s.day, title: `${t.label} — resolved`, body: `Root cause traced in the ${t.world}. Solution: ${t.diag.best}. Prevention: monitoring + documentation.` });
    // now fix the physical device
    const dev = s.devices.find(d => d.npc === n.id);
    if (dev) { dev.fixed = true; }
    resolveTicket(n);
    B = null;
    updateHUD();
    flushPromo();
    if (isShadow) { setTimeout(() => showEnding(true), 800); return; }
    // optional real-world debrief
    const lm = LEARN[t.id];
    if (lm && !eodOpen) {
      dlg(`✅ ${t.label} — CLOSED`, `Ticket documented in your journal.`, [
        { t: `📖 Learn More — ${lm.title}`, f: () => dlg(`📖 ${lm.title}`, lm.body, [{ t: "Got it.", f: closeDlg }]) },
        { t: "Back to work.", f: closeDlg },
      ]);
    }
  }, 900);
}
function loseBattle() {
  const s = S;
  sfx("bad");
  // losing a boss fight ends the run — you're hospitalized
  if (B.boss) {
    const t = B.t;
    s.portals = s.portals.filter(p => p !== B.portal);
    s.journal.push({ day: s.day, title: `${t.label} — RUN ENDED`, body: `${BOSS_NAMES[t.id] || t.enemy} put you in the hospital. The network wins this time.` });
    $("battle").classList.add("hidden"); s.inBattle = false; B = null;
    save();
    setTimeout(() => showEnding(false), 800);
    return;
  }
  addStress(20); s.hp = Math.round(s.maxHp / 2);
  s.portals = s.portals.filter(p => p !== B.portal);
  const dev = s.devices.find(d => d.npc === B.npc.id); if (dev) dev.fixed = true;
  s.rep[B.npc.dept] = Math.max(0, s.rep[B.npc.dept] - 1);
  const n = B.npc; n.done = true; s.ticketsDone++;
  toast("💀 The manifestation overwhelmed you. The ticket got escalated... (-1 rep, +20 stress)");
  s.journal.push({ day: s.day, title: `${n.type.label} — FAILED`, body: `Lesson: ${n.type.diag.best}. You won't make that mistake twice.` });
  $("battle").classList.add("hidden"); s.inBattle = false; B = null;
  updateHUD(); flushPromo(); checkDayEnd();
}
function rollLoot(minRarity) {
  const order = ["common", "rare", "epic", "legendary"];
  const pool = LOOT_TABLE.filter(l => order.indexOf(l.rarity) >= order.indexOf(minRarity) - 1);
  const weights = pool.map(l => l.rarity === "common" ? 40 : l.rarity === "rare" ? 30 : l.rarity === "epic" ? 20 : 10);
  let tot = weights.reduce((a, b) => a + b), r = Math.random() * tot;
  for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) return { ...pool[i] }; }
  return { ...pool[0] };
}
function resolveTicket(n) {
  const s = S;
  n.done = true; s.ticketsDone++;
  s.meta.recentTypes = s.meta.recentTypes || [];
  if (!n.correctDiag || n.pendingRepeat) s.meta.recentTypes.push(n.type.id);
  while (s.meta.recentTypes.length > 6) s.meta.recentTypes.shift();
  sfx("ticket");
  s.thumbsUntil = performance.now() + 1200;
  s.meta.closed++;
  if (n.critical) s.meta.crits++;
  checkAch();
  // escalation: the problem may go deeper
  const nextId = CHAINS[n.type.id];
  const depth = n.chainDepth || 0;
  if (nextId && depth < 3 && Math.random() < .3) {
    const nt = TICKET_TYPES.find(t => t.id === nextId);
    n.type = nt; n.chainDepth = depth + 1;
    n.done = false; n.interviewed = false; n.diagnosed = false; n.fixedReady = false;
    n.critical = n.critical || depth + 1 >= 2;
    s.ticketsDone--;
    s.meta.chains++;
    sfx("chain");
    // clean up the old broken device — the problem moved deeper
    s.devices = s.devices.filter(d => d.npc !== n.id);
    setTimeout(() => toast(`⛓️ ESCALATION — ${pick(CHAIN_LINES)}<br><b>${nt.icon} ${nt.label}</b> (${n.dept})`, 3500), 2700);
  }
  // incident closure: log the MTTR — the factory remembers how fast you were
  if (n.incidentDeclared) {
    const mttr = Math.max(1, s.clock - (n.incidentStart || s.clock));
    s.meta.mttr.push(mttr);
    s.journal.push({ day: s.day, title: `INCIDENT CLOSED — «${n.codename || "CRISIS"}»`, body: `Resolved in ${mttr} minutes from declaration. Post-incident review scheduled. ${n.verifiedFix ? "Fix verified — clean closure." : "⚠️ Closed WITHOUT verification."}` });
    toast(`✅ INCIDENT CLOSED — «${n.codename}»<br><small>MTTR: ${mttr} min. The war room stands down.</small>`, 3800);
  }
  let repGain = 1;
  if (s.chaos?.id === "ceo" && n.dept === "Executives") repGain = 2;
  // the environment remembers: the dept's biome flashes gold when you save it
  s.flashBiome = BIOME_OF_DEPT[n.dept];
  s.flashUntil = performance.now() + 1500;
  s.rep[n.dept] = clamp(s.rep[n.dept] + repGain, 0, 5);
  addXP(10);
  toast(`✅ Ticket closed — ${n.type.label}<br>${n.dept} rep +${repGain} ${"⭐".repeat(s.rep[n.dept])}`);
  advanceClock(20);
  updateHUD();
  checkDayEnd();
}

// ---------- PowerShell Sweep (Automation Mastery cert) ----------
function updateSweep() {
  const el = $("btn-sweep"); if (!el || !S) return;
  el.classList.toggle("hidden", !(S.certs.includes("auto") && !S.autoUsed && S.tickets.some(t => !t.done)));
}
$("btn-sweep").addEventListener("click", () => {
  const s = S;
  const t = s.tickets.find(t => !t.done && !t.critical) || s.tickets.find(t => !t.done);
  if (!t || s.autoUsed) return;
  s.autoUsed = true;
  const dev = s.devices.find(d => d.npc === t.id); if (dev) dev.fixed = true;
  s.portals = s.portals.filter(p => p.npc !== t.id);
  sfx("win");
  toast(`⚡ POWERSHELL SWEEP<br><small>Script auto-resolved: ${t.type.label}</small>`);
  s.journal.push({ day: s.day, title: `${t.type.label} — automated`, body: "Resolved by PowerShell Sweep. Automation is a superpower." });
  resolveTicket(t);
  updateSweep();
});

// ---------- HUD / clock / progression ----------
let toastT = null;
function toast(html, ms = 2600) {
  const t = $("toast"); t.innerHTML = html; t.classList.remove("hidden");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.add("hidden"), ms);
}
function addXP(n) {
  const s = S, before = rank().name;
  s.xp += n;
  const after = rank().name;
  if (after !== before) {
    if (s.inBattle || s.inDialog) s.pendingPromo = after;
    else setTimeout(() => promotion(after), 600);
  }
  updateHUD();
}
function flushPromo() {
  const s = S;
  if (s.pendingPromo && !s.inBattle && !s.inDialog && !eodOpen) {
    const p = s.pendingPromo; s.pendingPromo = null;
    promotion(p);
  }
}
function addStress(n) {
  const s = S;
  let mult = s.chaos?.id === "heat" && n > 0 ? 1.5 : 1;
  if (n > 0) mult *= (1 - (s.stressResist || 0));
  s.stress = clamp(Math.round(s.stress + n * mult), 0, 100);
  if (s.stress >= 100) { s.stress = 70; s.hp = Math.max(1, s.hp - 10); toast("🔥 BURNOUT! You snap at a user and hide in the IDF. (-10 HP)"); }
  updateHUD();
}
function promotion(newRank) {
  const s = S;
  s.maxHp += 10; s.hp = s.maxHp;
  const perk = {
    "Senior Technician": "Perk: +10 max HP. Users trust you more.",
    "Site Administrator": "Perk: Master keycard! 🗝️ All doors open. +10 max HP.",
    "Systems Administrator": "Perk: Group Policy buffs. +10 max HP.",
    "Infrastructure Engineer": "Perk: You can feel packet flows. +10 max HP.",
    "Security Engineer": "Perk: Proactive threat sense. +10 max HP.",
    "Security Architect": "Perk: The corruption fears you. +10 max HP.",
    "CIO": "👑 You run the whole digital world now. You WIN... but the tickets never end. (Endless mode unlocked)",
  }[newRank] || "+10 max HP";
  if (newRank === "CIO") s.won = true;
  sfx("promote");
  s.partyUntil = performance.now() + 1600;
  const ri = RANKS.findIndex(r => r.name === newRank);
  const newMoves = MOVE_LEVELS.filter(m => m.rank === ri).map(m => `${m.ability.icon} <b>${m.ability.name}</b> — ${m.ability.desc}`).join("<br>");
  dlg("🎉 PROMOTION!", `You've been promoted to <b>${newRank}</b>!<br>${perk}${newMoves ? `<br><br>🆕 New move learned:<br>${newMoves}` : ""}`, [{ t: "Let's go.", f: () => { closeDlg(); save(); } }]);
  toast(`🎉 PROMOTED: ${newRank}`, 4000);
}
function advanceClock(min) {
  const s = S;
  s.clock += min;
  // live network: open tickets age and get worse
  for (const n of s.tickets) {
    if (n.done) continue;
    n.age = (n.age || 0) + min;
    // departments lose patience with neglected issues
    if (n.age >= 120 && !n.agedWarn) {
      n.agedWarn = true;
      s.rep[n.dept] = Math.max(0, s.rep[n.dept] - 1);
      toast(`😠 <b>${n.dept}</b> is losing patience over "${n.type.label}"... (-1 rep)`, 3000);
    }
    // MAJOR INCIDENT: a neglected critical becomes a plant-wide emergency
    if (n.critical && n.age >= 90 && !n.incidentDeclared) {
      n.incidentDeclared = true; n.incidentStart = s.clock;
      s.meta.incidents++;
      sfx("bad");
      s.flashBiome = "exec"; s.flashUntil = performance.now() + 2500;
      toast(`🚨 <b>MAJOR INCIDENT DECLARED</b><br><b>«${n.codename || "UNNAMED CRISIS"}»</b> — ${n.type.label} (${n.dept})<br><small>Executives are in the war room. Clock is running.</small>`, 5000);
      s.journal.push({ day: s.day, title: `MAJOR INCIDENT — «${n.codename || "CRISIS"}»`, body: `Declared at ${fmtClock(s.clock)} after ${n.age} minutes unresolved. War room opened. MTTR clock running.` });
    }
    // problems SPREAD to other departments if ignored too long
    if (n.age >= 180 && !n.cascaded && CHAINS[n.type.id] && !s.cascadeUsed) {
      n.cascaded = true; s.cascadeUsed = true;
      const nt = TICKET_TYPES.find(t => t.id === CHAINS[n.type.id]);
      const otherDepts = DEPTS.filter(d => d !== n.dept);
      const nd = pick(otherDepts);
      const pos = spotInBiome(s.map, BIOME_OF_DEPT[nd]);
      const npc = {
        id: 500 + Math.floor(Math.random() * 400), name: pick(NPC_NAMES), dept: nd, type: nt,
        x: pos.x, y: pos.y, face: "🧑‍💼", done: false, interviewed: false, diagnosed: false, correctDiag: false,
        critical: Math.random() < .3, pv: R(0, PAL_NPCS.length - 1), age: 0,
      };
      s.npcs.push(npc); s.tickets.push(npc); s.ticketsTotal++;
      sfx("chain");
      toast(`⚠️ <b>OUTBREAK!</b> The ignored "${n.type.label}" spread to <b>${nd}</b> as "${nt.label}"!`, 4000);
      updateHUD();
    }
  }
  if (s.clock >= 17 * 60 && s.ticketsDone < s.ticketsTotal) {
    // day force-ends when you run out of time
    toast("🕔 It's 5 PM. Remaining tickets roll to the backlog...");
    checkDayEnd(true);
  }
  updateHUD();
}
function fmtClock(c) { const h = Math.floor(c / 60), m = c % 60; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`; }
function updateHUD() {
  const s = S; if (!s) return;
  $("hud-day").textContent = `DAY ${s.day}`;
  $("hud-title").textContent = rank().name;
  $("hud-clock").textContent = fmtClock(s.clock) + (s.chaos ? " · " + s.chaos.name : "");
  const cur = rank(), ni = RANKS.indexOf(cur);
  const next = RANKS[ni + 1];
  $("bar-xp").style.width = next ? clamp((s.xp - cur.xp) / (next.xp - cur.xp) * 100, 0, 100) + "%" : "100%";
  $("bar-stress").style.width = s.stress + "%";
  $("hud-budget").textContent = "$" + s.budget;
  $("hud-tickets").textContent = `🎫 ${s.ticketsDone}/${s.ticketsTotal}`;
  // digital twin: plant production rate dips while a line is down
  const lineDown = s.npcs && s.npcs.some(nn => nn.type && nn.type.id === "plc" && !nn.done);
  const prodEl = $("hud-prod");
  if (prodEl) {
    prodEl.textContent = lineDown ? "🏭 $6,800/min ⚠️" : "🏭 $14,200/min";
    prodEl.style.color = lineDown ? "#ff6b6b" : "#7dd87d";
  }
  $("chaos-banner").classList.add("hidden"); // chaos now lives on the clock line
  const open = s.tickets.filter(t => !t.done);
  $("quest-tracker").innerHTML =
    s.tickets.filter(t => t.done).map(t => `<div class="done">✅ ${t.type.label} (${t.dept})</div>`).join("") +
    open.map(t => `<div>${t.critical ? "🚨" : "🎫"} ${t.type.label}${t.codename ? ` <span style="color:#ff9d4a">«${t.codename}»</span>` : ""} — ${t.name}, ${t.dept}${t.diagnosed ? " · find 🌀" : ""}${t.mishandled ? " ⚠️ botched" : (t.age || 0) >= 120 ? " 🔥" : (t.age || 0) >= 60 ? " ⏳" : ""}</div>`).join("");
  updateSweep();
}

// ---------- career report: the factory scores you ----------
function careerReport() {
  const s = S, m = s.meta;
  const kbCount = Object.keys(m.kb || {}).length;
  const avgMttr = m.mttr.length ? Math.round(m.mttr.reduce((a, b) => a + b, 0) / m.mttr.length) : null;
  const prodSaved = (m.closed * 42000 / 1e6).toFixed(1);
  const score = m.closed * 2 + kbCount * 10 + (s.infra || []).length * 15 + (m.hires || 0) * 12 + m.incidents * 10 - m.debt * 8 + s.ach.length * 5;
  const legacy = score >= 250 ? "🌟 LEGENDARY" : score >= 120 ? "🎖️ VETERAN" : score >= 50 ? "🔧 STEADY HAND" : "🌱 PROMISING";
  // procedural war stories: pull the most dramatic moments from the journal
  const war = [];
  const esc = s.journal.find(j => j.title.includes("ESCALATED"));
  if (esc) war.push(`<b>Closest call:</b> "${esc.title}" — the intern's ${esc.body.split(".")[0].toLowerCase()}.`);
  const inc = s.journal.find(j => j.title.includes("MAJOR INCIDENT"));
  if (inc) war.push(`<b>War story:</b> ${inc.title} — declared ${inc.body.split("after ")[1] || ""}.`);
  const funny = s.journal.find(j => j.title.includes("Printer"));
  if (funny) war.push(`<b>Funniest ticket:</b> "${funny.title}." It was the spooler. It's always the spooler.`);
  return `<br><br>📋 <b>CAREER REPORT</b><br>` +
    `<div style="text-align:left;display:inline-block">` +
    `🎫 Incidents resolved: <b>${m.closed}</b> (production saved ≈ <b>$${prodSaved}M</b>)<br>` +
    `🚨 Major incidents: <b>${m.incidents}</b>${avgMttr !== null ? ` · avg MTTR <b>${avgMttr} min</b>` : ""}<br>` +
    `🧑‍🔧 People mentored: <b>${m.hires || 0}</b> · 🤖 Automation built: <b>${s.lab.includes("autosrv") ? "YES — runs without you" : "none"}</b><br>` +
    `📝 Knowledge articles: <b>${kbCount}</b> · 🏗️ Systems modernized: <b>${(s.infra || []).length}</b> · ⚠️ Tech debt left: <b>${m.debt}</b><br>` +
    `🏅 Achievements: <b>${s.ach.length}/${ACHIEVEMENTS.length}</b> · 🎖️ Rank: <b>${rank().name}</b><br>` +
    (war.length ? `<br>${war.join("<br>")}<br>` : "") +
    `<br>LEGACY RATING: <b style="color:#ffd24a">${legacy}</b>` +
    `</div><br><br><i>"A great technician solves problems.<br>A great engineer prevents them.<br>A great leader builds a team that no longer needs them."</i><br><br><small>You leave the badge on the desk. A new hand will pick it up.<br>Everything comes full circle.</small>`;
}

// ---------- ending / game over ----------
function showEnding(win) {
  const s = S;
  const stats =
    `📅 Days survived: <b>${s.day}</b><br>` +
    `🎫 Tickets closed: <b>${s.meta.closed}</b> (${s.meta.chains} chain escalations)<br>` +
    `🚨 Critical incidents won: <b>${s.meta.crits}</b><br>` +
    `⌨️ Commands run: <b>${s.meta.cmds}</b><br>` +
    `🌟 Legendaries found: <b>${s.meta.legendaries}</b><br>` +
    `🏆 Achievements: <b>${s.ach.length}/${ACHIEVEMENTS.length}</b><br>` +
    `🎖️ Final rank: <b>${rank().name}</b>`;
  if (win) {
    $("eod-title").textContent = "👑 ROOT ACCESS GRANTED";
    $("eod-summary").innerHTML =
      `palan0 — the first admin, uploaded into Building 7's network in 1987 — is finally at rest.<br>` +
      `The tickets will continue. They always do. But today, the network answers to <b>you</b>.<br><br>${stats}${careerReport()}`;
    $("eod").querySelector("h3").textContent = "Choose your legacy:";
    const box = $("eod-rewards"); box.innerHTML = "";
    const ng = document.createElement("button");
    ng.innerHTML = `<span class="rw-icon">🔄</span><b>NEW GAME+</b><br>Keep certs, books, achievements. Enemies +25% HP.`;
    ng.onclick = () => {
      const keep = { certs: s.certs, books: s.books, ach: s.ach, meta: s.meta, journal: s.journal, lab: s.lab, stressResist: s.stressResist, inv: s.inv, rep: s.rep, stats: s.stats, soft: s.soft };
      // your previous career becomes someone else's legend
      const closed = s.meta.closed, kbCount = Object.keys(s.meta.kb || {}).length, auto = s.lab.includes("autosrv");
      S = newState(); Object.assign(S, keep); S.ngPlus = true; S.meta.lore = []; S.shadowDone = false;
      S.legendLine = auto
        ? `"I heard about an engineer at AstraDyne who automated everything. ${closed} tickets. Just... gone."`
        : kbCount > 3
          ? `"My old mentor taught me never to skip verification. Their documentation saved my career once."`
          : `"There was an engineer here once. Closed ${closed} tickets. They're a legend in the NOC now."`;
      $("eod").classList.add("hidden");
      startRun();
      toast("🔄 NEW GAME+ — the corruption returns stronger. palan0 left backups...");
    };
    const end = document.createElement("button");
    end.innerHTML = `<span class="rw-icon">🌅</span><b>RETIRE A LEGEND</b><br>End the run here. Roll credits.`;
    end.onclick = () => { $("eod").classList.add("hidden"); showCredits(stats); };
    box.append(ng, end);
    $("eod").classList.remove("hidden");
  } else {
    $("eod-title").textContent = "🏥 RUN TERMINATED";
    $("eod-summary").innerHTML = `The manifestation put you in the hospital. HR sends flowers.<br><br>${stats}${careerReport()}`;
    $("eod").querySelector("h3").textContent = "The queue never clears itself...";
    const box = $("eod-rewards"); box.innerHTML = "";
    const again = document.createElement("button");
    again.innerHTML = `<span class="rw-icon">▶</span><b>CLOCK BACK IN</b><br>Fresh run, day 1.`;
    again.onclick = () => { $("eod").classList.add("hidden"); localStorage.removeItem("techops_save"); location.reload(); };
    box.appendChild(again);
    $("eod").classList.remove("hidden");
  }
  save();
}
function showCredits(stats) {
  $("eod-title").textContent = "🌅 TECHOPS HERO";
  $("eod-summary").innerHTML = `You retire as the legend of Building 7.<br><br>${stats}${careerReport()}<br><br><small>Thanks for playing. A Kimi × ninja-ops-guy production.</small>`;
  $("eod").querySelector("h3").textContent = "";
  const box = $("eod-rewards"); box.innerHTML = "";
  const again = document.createElement("button");
  again.innerHTML = `<span class="rw-icon">▶</span><b>PLAY AGAIN</b><br>`;
  again.onclick = () => { localStorage.removeItem("techops_save"); location.reload(); };
  box.appendChild(again);
}

// ---------- end of day ----------
let eodOpen = false;
function checkDayEnd(force) {
  const s = S;
  if (s.inBattle) return;
  if ((s.ticketsDone >= s.ticketsTotal || force) && !eodOpen) endOfDay();
}
// ---------- workforce: your team works the leftover queue ----------
function staffWork() {
  const s = S;
  const report = [];
  for (const m of s.staff) {
    const tier = STAFF_TIERS[m.tier];
    if (m.burnout >= 4) { report.push(`😴 ${m.name} is burned out — rested today.`); continue; }
    const open = s.tickets.find(t => !t.done && !t.mishandled);
    if (!open) { report.push(`✨ ${m.name} had a quiet day.`); continue; }
    m.uses++;
    // fast learners improve weekly
    if (m.trait === "quicklearner") m.accBonus = (m.accBonus || 0) + .02;
    const trait = STAFF_TRAITS.find(t => t.id === m.trait);
    const kbHit = s.meta.kb && s.meta.kb[open.type.id] ? (s.lab.includes("kcenter") ? .10 : .05) : 0; // documented solutions get reused
    const acc = clamp(tier.acc + (trait?.accMod || 0) + (m.accBonus || 0) + kbHit - m.burnout * .06, .1, .98);
    const roll = Math.random();
    const misChance = (1 - acc) * (trait?.mis || 1) * .6;
    if (roll < acc - misChance) {
      // clean solve
      open.done = true; s.ticketsDone++;
      s.rep[open.dept] = clamp(s.rep[open.dept] + 1, 0, 5);
      addXP(tier.xp);
      s.meta.closed++;
      m.burnout++;
      report.push(`✅ ${m.name} resolved "${open.type.label}" (${open.dept}) cleanly.`);
      s.journal.push({ day: s.day, title: `${open.type.label} — resolved by ${m.name}`, body: `${m.name} (${tier.name}, ${STAFF_TRAITS.find(t => t.id === m.trait)?.name}) handled it solo. Diagnosis: ${open.type.diag.best}.` });
      if (m.trait === "curious" && Math.random() < .2) {
        const l = rollLoot("rare");
        s.inv.push(l);
        report.push(`🔍 ${m.name}'s curiosity uncovered ${l.icon} ${l.name}!`);
      }
    } else if (roll < acc) {
      // misdiagnosis: ticket gets WORSE for you
      open.mishandled = true; open.trustHurt = true;
      open.critical = true; // escalated
      m.burnout += 2;
      const note = pick(MISDIAG_NOTES);
      report.push(`⚠️ ${m.name} escalated "${open.type.label}" — ${note}. It's a 🚨 now.`);
      s.meta.debt++;
      s.journal.push({ day: s.day, title: `${open.type.label} — ESCALATED by ${m.name}`, body: `${m.name} ${note}. You'll inherit a harder fight.` });
    } else {
      // honest fail: no progress, mild stress for the tech
      m.burnout++;
      report.push(`🤷 ${m.name} couldn't crack "${open.type.label}". Still yours.`);
    }
  }
  return report;
}

// ---------- end of day ----------
function endOfDay() {
  const s = S; eodOpen = true;
  // your team works the leftover queue before review
  const staffReport = s.staff.length ? staffWork() : [];
  // tech debt consequences: entropy breeds repeat work and audits
  const debtNotes = [];
  if (s.meta.debt >= 10 && !s.audited) {
    s.audited = true;
    if (s.journal.length >= s.meta.debt) {
      debtNotes.push(`📋 <b>INTERNAL AUDIT PASSED</b> — your documentation saved you. (${s.journal.length} journal entries)`);
      s.meta.debt = Math.max(0, s.meta.debt - 5);
    } else {
      const fine = Math.min(s.budget, 150);
      s.budget -= fine;
      debtNotes.push(`📋 <b>INTERNAL AUDIT FINDING</b> — undocumented changes found. Corrective action: -$${fine}. Document your work!`);
    }
  }
  if (s.meta.debt >= 5) debtNotes.push(`⚠️ Tech debt is high (${s.meta.debt}) — repeat tickets are becoming more likely.`);
  let stressRec = s.chaos?.id === "calm" ? 30 : 15;
  s.stress = clamp(s.stress - stressRec, 0, 100);
  const missed = s.ticketsTotal - s.ticketsDone;
  if (missed > 0) for (const t of s.tickets.filter(t => !t.done)) s.rep[t.dept] = Math.max(0, s.rep[t.dept] - 1);
  if (missed === 0 && s.ticketsTotal > 0) unlock("backlog0");
  $("eod-title").textContent = `DAY ${s.day} COMPLETE`;
  $("eod-summary").innerHTML =
    `🎫 Tickets: ${s.ticketsDone}/${s.ticketsTotal}${missed ? ` <span style="color:#f88">(${missed} rolled over, -rep)</span>` : " — <b>ZERO BACKLOG!</b> 👑"}<br>` +
    `✨ Total XP: ${s.xp} · 💰 Budget: $${s.budget}<br>` +
    `😌 Stress recovered: -${stressRec} · Rank: <b>${rank().name}</b>` +
    (staffReport.length ? `<br><br><b>🧑‍🔧 Team report:</b><br><small>${staffReport.join("<br>")}</small>` : "") +
    (debtNotes.length ? `<br><br>${debtNotes.join("<br>")}` : "");
  $("eod").querySelector("h3").textContent = "Choose one reward:";
  const rewards = [
    { icon: "💻", t: "New Hardware", d: "+1 random stat", f: () => { const k = pick(Object.keys(s.stats)); s.stats[k]++; toast(`📈 ${k} +1`); } },
    { icon: "📜", t: "Automation Script", d: "+2 automation", f: () => { s.stats.automation += 2; toast("📈 automation +2"); } },
    { icon: "☕", t: "Coffee Perk", d: "-20 stress tomorrow", f: () => { s.stress = clamp(s.stress - 20, 0, 100); toast("☕ deeply relaxed"); } },
    { icon: "🎓", t: "Cert Study", d: "-$100 next cert", f: () => { s.certDiscount = (s.certDiscount || 0) + 100; toast("🎓 cert discount $100"); } },
    { icon: "💰", t: "Budget Bump", d: "+$60", f: () => { s.budget += 60; toast("💰 +$60"); } },
    { icon: "🧘", t: "Vacation Half-day", d: "+10 max HP", f: () => { s.maxHp += 10; s.hp = s.maxHp; toast("❤️ max HP +10"); } },
  ];
  const shown = [...rewards].sort(() => Math.random() - .5).slice(0, 3);
  const box = $("eod-rewards"); box.innerHTML = "";
  for (const r of shown) {
    const b = document.createElement("button");
    b.innerHTML = `<span class="rw-icon">${r.icon}</span><b>${r.t}</b><br>${r.d}`;
    b.onclick = () => { r.f(); $("eod").classList.add("hidden"); eodOpen = false; s.day++; setupDay(); };
    box.appendChild(b);
  }
  $("eod").classList.remove("hidden");
  save();
}

// ---------- panel (character / inventory / store / certs / journal / reputation / achievements) ----------
let panelOpen = false;
function openPanel(tab = "Character") {
  if (S.inBattle) return;
  panelOpen = true;
  $("panel").classList.remove("hidden");
  const tabs = ["Character", "Team", "Inventory", "Store", "Certifications", "Journal", "Reputation", "Achievements"];
  $("panel-title").textContent = "🧑‍🔧 TECHOPS HERO";
  $("panel-tabs").innerHTML = "";
  for (const t of tabs) {
    const b = document.createElement("button");
    b.textContent = t; if (t === tab) b.classList.add("active");
    b.onclick = () => openPanel(t);
    $("panel-tabs").appendChild(b);
  }
  renderTab(tab);
}
function closePanel() { panelOpen = false; $("panel").classList.add("hidden"); }
$("panel-close").addEventListener("click", closePanel);

function renderTab(tab) {
  const s = S, el = $("panel-body");
  if (tab === "Character") {
    el.innerHTML =
      `<h3>${rank().name} — Day ${s.day}</h3>` +
      `<div class="stat-row"><span>XP</span><span>${s.xp}</span></div>` +
      `<div class="stat-row"><span>HP</span><span>${s.hp}/${s.maxHp}</span></div>` +
      `<div class="stat-row"><span>Stress</span><span>${s.stress}/100</span></div>` +
      `<div class="stat-row"><span>Budget</span><span>$${s.budget}</span></div><br><h4>Technical Skills</h4>` +
      Object.entries(s.stats).map(([k, v]) => `<div class="stat-row"><span>${k}</span><span>${"▮".repeat(Math.min(v, 20))} ${v + Math.round(S.inv.reduce((a, l) => a + (l.stat === k ? l.val : 0), 0) / 3)}</span></div>`).join("") +
      `<br><h4>Soft Skills</h4>` +
      Object.entries(s.soft).map(([k, v]) => `<div class="stat-row"><span>${k}</span><span>${"▮".repeat(v)} ${v}</span></div>`).join("") +
      `<br><h4>Career Ladder</h4>` + RANKS.map(r => `<div class="stat-row"><span>${s.xp >= r.xp ? "✅" : "⬜"} ${r.name}</span><span>${r.xp} XP</span></div>`).join("");
  } else if (tab === "Team") {
    el.innerHTML = `<i>Your team works the leftover queue at end of day. Accuracy matters — a botched fix becomes a critical ticket and adds tech debt.</i><br><br>`;
    if (s.staff.length) {
      el.innerHTML += `<h4>Roster (${s.staff.length}/4)</h4>`;
      for (const m of s.staff) {
        const tier = STAFF_TIERS[m.tier], trait = STAFF_TRAITS.find(t => t.id === m.trait);
        const acc = Math.round(clamp(tier.acc + (trait?.accMod || 0) + (m.accBonus || 0) - m.burnout * .06, .1, .98) * 100);
        el.innerHTML += `<div class="loot-item">🧑‍🔧 <b>${m.name}</b> — ${tier.name} <small>(${trait?.name || "—"})</small><br><small>Accuracy ${acc}% · Burnout ${"🔥".repeat(m.burnout) || "none"} · Tickets worked: ${m.uses}</small> <button data-rest="${m.id}" ${m.burnout ? "" : "disabled"} style="float:right;background:#334;border:1px solid #88f;color:#bbf;border-radius:5px;padding:3px 10px;font-family:inherit">REST</button></div>`;
      }
    } else {
      el.innerHTML += "<i>No staff yet. Hire help below — delegation is how one tech becomes a department.</i><br><br>";
    }
    if (s.staff.length < 4) {
      el.innerHTML += `<br><h4>Available Hires</h4>`;
      for (const [tid, tier] of Object.entries(STAFF_TIERS)) {
        const afford = s.budget >= tier.cost;
        el.innerHTML += `<div class="loot-item">💼 <b>${tier.name}</b> <span style="color:#8f8">$${tier.cost}/hire</span><br><small>${tier.blurb}</small> <button data-hire="${tid}" ${afford ? "" : "disabled"} style="float:right;background:#153;border:1px solid #4f4;color:#8f8;border-radius:5px;padding:3px 10px;font-family:inherit">HIRE</button></div>`;
      }
    } else {
      el.innerHTML += `<br><i>Team is full (4 max).</i>`;
    }
    el.querySelectorAll("button[data-hire]").forEach(b => b.onclick = () => {
      const tier = STAFF_TIERS[b.dataset.hire];
      if (s.budget < tier.cost) return toast("Not enough budget!");
      s.budget -= tier.cost;
      const trait = pick(STAFF_TRAITS);
      const name = pick(STAFF_NAMES.filter(n => !s.staff.some(m => m.name === n)));
      s.staff.push({ id: Date.now() % 100000 + R(0, 99), tier: b.dataset.hire, name, trait: trait.id, burnout: 0, uses: 0, accBonus: 0 });
      s.meta.hires = (s.meta.hires || 0) + 1;
      sfx("loot");
      toast(`🤝 ${name} the ${trait.name} ${tier.name} joins the team! They'll work leftover tickets at end of day.`);
      renderTab("Team"); updateHUD(); save();
    });
    el.querySelectorAll("button[data-rest]").forEach(b => b.onclick = () => {
      const m = s.staff.find(x => String(x.id) === b.dataset.rest);
      if (m) { m.burnout = Math.max(0, m.burnout - 2); toast(`😴 ${m.name} takes a breather. Burnout: ${m.burnout}`); }
      renderTab("Team"); save();
    });
  } else if (tab === "Inventory") {
    el.innerHTML = s.inv.length ? "" : "<i>No loot yet. Close tickets and clear dungeons!</i>";
    for (const l of s.inv) el.innerHTML += `<div class="loot-item">${l.icon} <span class="rarity-${l.rarity}"><b>${l.name}</b> (${l.rarity})</span><br><small>${l.stat === "stress" ? "Passive: move faster, stress resist" : `+${l.val} ${l.stat}`}</small></div>`;
  } else if (tab === "Store") {
    el.innerHTML = `<i>Invest in your IT department. Budget: <b>$${s.budget}</b></i><br><br>`;
    if (!s.storeStock.length) el.innerHTML += "<i>Sold out for today. Come back tomorrow.</i>";
    const VENDORS = [
      ["procurement", "📦 PROCUREMENT — hardware & infrastructure"],
      ["training", "🎓 TRAINING DEPARTMENT — books & knowledge"],
      ["innovation", "💡 INNOVATION LAB — experimental technology"],
    ];
    for (const [v, header] of VENDORS) {
      const items = s.storeStock.filter(id => VENDOR_OF(id) === v);
      if (!items.length) continue;
      el.innerHTML += `<h4 style="color:#7fd4ff;margin:10px 0 6px">${header}</h4><small style="color:#9a9"><i>${pick(VENDOR_QUOTES[v])}</i></small><br>`;
      for (const id of items) {
        const it = STORE_STOCK.find(x => x.id === id);
        const afford = s.budget >= it.cost;
        el.innerHTML += `<div class="loot-item">${it.icon} <b>${it.name}</b> <span style="color:#8f8">$${it.cost}</span><br><small>${it.type === "book" ? it.blurb : it.effect}</small> <button data-buy="${it.id}" data-cost="${it.cost}" ${afford ? "" : "disabled"} style="float:right;background:#153;border:1px solid #4f4;color:#8f8;border-radius:5px;padding:3px 10px;font-family:inherit">BUY</button></div>`;
      }
    }
    const ownedInfra = (s.infra || []).map(r => TICKET_TYPES.find(t => t.id === r)?.label).filter(Boolean);
    el.innerHTML += `<br><small>Owned: ${[...s.books.map(b => STORE_STOCK.find(x => x.id === b)?.name), ...s.lab.map(k => STORE_STOCK.find(x => x.key === k)?.name)].filter(Boolean).join(", ") || "nothing yet"}</small>`;
    if (ownedInfra.length) el.innerHTML += `<br><small>🏗️ Infrastructure: ${ownedInfra.join(", ")} — those tickets are retired for good.</small>`;
    el.querySelectorAll("button[data-buy]").forEach(b => b.onclick = () => {
      const it = STORE_STOCK.find(x => x.id === b.dataset.buy);
      if (s.budget < it.cost) return toast("Not enough budget!");
      s.budget -= it.cost;
      if (it.type === "book") { s.books.push(it.id); toast(`📖 Learned a new move: ${it.blurb.replace("Teaches: ", "")}!`); }
      else if (it.type === "infra") { s.infra.push(it.retire); toast(`🏗️ ${it.name} deployed — no more "${TICKET_TYPES.find(t => t.id === it.retire).label}" tickets. Ever.`, 4000); }
      else { s.lab.push(it.key); applyLab(it.key); toast(`🔧 ${it.name} installed: ${it.effect}`); }
      s.storeStock = s.storeStock.filter(x => x !== it.id);
      sfx("loot");
      renderTab("Store"); updateHUD(); save();
    });
  } else if (tab === "Certifications") {
    el.innerHTML = "<i>Certs unlock new battle abilities. Study with your budget.</i><br><br>";
    for (const c of CERTS) {
      const owned = s.certs.includes(c.id);
      const cost = Math.max(0, c.cost - (s.certDiscount || 0));
      el.innerHTML += `<div class="cert-node ${owned ? "owned" : s.budget < cost ? "locked" : ""}"><b>${c.name}</b> ${owned ? "✅" : `<button data-cert="${c.id}" data-cost="${cost}">$${cost}</button>`}<br><small>${c.desc}</small></div>`;
    }
    el.querySelectorAll("button[data-cert]").forEach(b => b.onclick = () => {
      const cost = +b.dataset.cost;
      if (s.budget < cost) return toast("Not enough budget!");
      s.budget -= cost; s.certDiscount = 0;
      s.certs.push(b.dataset.cert); addXP(30); checkAch();
      toast(`🎓 Certified! New ability unlocked in battle.`);
      renderTab("Certifications"); save();
    });
  } else if (tab === "Journal") {
    el.innerHTML = s.journal.length ? "" : "<i>Your troubleshooting journal is empty. Solve tickets to fill it.</i>";
    for (const j of [...s.journal].reverse()) el.innerHTML += `<div class="journal-entry"><b>Day ${j.day} — ${j.title}</b><br><small>${j.body}</small></div>`;
  } else if (tab === "Reputation") {
    el.innerHTML = "<i>Departments remember you.</i><br><br>";
    for (const d of DEPTS) {
      const v = s.rep[d];
      el.innerHTML += `<div class="rep-row"><span>${d}</span><span class="stars">${"★".repeat(v)}${"☆".repeat(5 - v)}</span></div>`;
    }
    el.innerHTML += `<br><small>Higher rep → better budget rewards & friendlier users. Missed tickets lower rep.</small>`;
  } else if (tab === "Achievements") {
    el.innerHTML = `<i>${s.ach.length}/${ACHIEVEMENTS.length} unlocked</i><br><br>`;
    for (const a of ACHIEVEMENTS) {
      const got = s.ach.includes(a.id);
      el.innerHTML += `<div class="loot-item" style="opacity:${got ? 1 : .4}">${a.icon} <b>${a.name}</b> ${got ? "✅" : ""}<br><small>${a.desc}</small></div>`;
    }
  }
}

// ---------- music (SoundCloud widget) ----------
let scWidget = null, musicOn = false;
function initMusic() {
  if (scWidget || typeof SC === "undefined") return;
  try {
    scWidget = SC.Widget($("sc-widget"));
    scWidget.bind(SC.Widget.Events.READY, () => setMusic(true));
  } catch (e) { }
}
function setMusic(on) {
  musicOn = on;
  sfxMuted = !on; // one toggle rules all audio
  $("btn-music").textContent = on ? "🔊" : "🔇";
  if (!scWidget) return;
  try { on ? scWidget.play() : scWidget.pause(); } catch (e) { }
}
$("btn-music").addEventListener("click", () => { initMusic(); if (scWidget) setMusic(!musicOn); });

// ---------- boot ----------
function showTouchUI() {
  if (matchMedia("(pointer:coarse)").matches) $("touch-ui").classList.remove("hidden");
}
$("btn-start").addEventListener("click", () => {
  localStorage.removeItem("techops_save");
  S = newState();
  // difficulty select first
  $("title-screen").classList.add("hidden");
  $("hud").classList.remove("hidden");
  showTouchUI();
  S.inDialog = true;
  dlg("🎮 SELECT SHIFT DIFFICULTY", `How hard do you want today to hurt?<br><br><b>🌱 Intern</b> — 0.7× enemy HP & damage. Learn the ropes.<br><b>🧰 Standard</b> — the intended experience.<br><b>🔥 On-Call</b> — 1.3× damage, +1 ticket/day, bosses at 2.0× HP. Achievement for beating the final boss.`, [
    { t: "🌱 Intern", f: () => { S.diff = .7; closeDlg(); startRun(); } },
    { t: "🧰 Standard", f: () => { S.diff = 1; closeDlg(); startRun(); } },
    { t: "🔥 On-Call", f: () => { S.diff = 1.3; closeDlg(); startRun(); } },
  ]);
});
function startRun() {
  setupDay();
  $("title-screen").classList.add("hidden");
  $("hud").classList.remove("hidden");
  showTouchUI();
  initMusic();
  dlg("📟 CIO Dispatch", `Welcome to <b>AeroTech Manufacturing</b>, ${rank().name}.<br><br>Users have tickets. Devices have... <i>manifestations</i>. Interview users, diagnose root causes, enter the portals, and keep this factory running.<br><br>Clock out strong. Good luck.`, [{ t: "Clock in ▶", f: closeDlg }]);
}
$("btn-continue").addEventListener("click", () => {
  const d = load(); if (!d) return;
  S = newState(); Object.assign(S, d);
  setupDay(); S.day = d.day; // setupDay regenerates the run for the day
  updateHUD();
  $("title-screen").classList.add("hidden");
  $("hud").classList.remove("hidden");
  showTouchUI();
  initMusic();
  toast(`↻ Welcome back, ${rank().name}. Day ${S.day} begins.`);
});
if (load()) $("btn-continue").classList.remove("hidden");
requestAnimationFrame(loop);
