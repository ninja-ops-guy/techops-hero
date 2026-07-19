/* ============================================================
   TECHOPS HERO v3.0 — roguelite IT RPG (single-file web app)
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
const TICKET_TYPES = [
  { id: "printer", label: "Printer Offline", icon: "🖨️", enemy: "Printer Goblin", eicon: "👺", world: "Paper Dimension", wbg: "#3a2e18", diag: ["Restart the print spooler", "Blame the user", "Buy a new printer"], correct: 0, stat: "hardware" },
  { id: "vpn", label: "VPN Won't Connect", icon: "🚇", enemy: "VPN Ghost", eicon: "👻", world: "Tunnel Caverns", wbg: "#14202e", diag: ["Check tunnel certs & gateway", "Reinstall Windows", "Yell at the ISP"], correct: 0, stat: "networking" },
  { id: "dns", label: "Internet 'Broken'", icon: "📖", enemy: "DNS Hydra", eicon: "🐍", world: "Labyrinth of Names", wbg: "#1e1430", diag: ["Trace the bad DNS record", "Factory reset the router", "Sacrifice a keyboard"], correct: 0, stat: "networking" },
  { id: "ad", label: "Account Locked Out", icon: "⛪", enemy: "AD Lich", eicon: "💀", world: "Identity Cathedral", wbg: "#241a2e", diag: ["Review lockout events in AD", "Delete the user", "Wait until tomorrow"], correct: 0, stat: "windows" },
  { id: "malware", label: "Suspicious Pop-ups", icon: "☣️", enemy: "Malware Swarm", eicon: "🦠", world: "Corrupted Network", wbg: "#2e1414", diag: ["Isolate host, then scan", "Click the pop-up", "Format everything"], correct: 0, stat: "security" },
  { id: "email", label: "Email Not Syncing", icon: "📬", enemy: "Email Phantom", eicon: "🕊️", world: "Mail Kingdom", wbg: "#142428", diag: ["Check Exchange queue & creds", "Send a test fax", "Blame Outlook"], correct: 0, stat: "windows" },
  { id: "bsod", label: "Blue Screen Crash", icon: "💙", enemy: "Blue Screen Titan", eicon: "🗿", world: "Kernel Forest", wbg: "#101c34", diag: ["Analyze the dump file", "Hit it harder", "Blame cosmic rays"], correct: 0, stat: "hardware" },
  { id: "plc", label: "PLC Offline (Factory)", icon: "🏭", enemy: "Rust Golem", eicon: "🤖", world: "Motherboard Desert", wbg: "#2e2410", diag: ["Check the VLAN segment", "Pour water on it", "Kick the conveyor"], correct: 0, stat: "networking" },
  { id: "wifi", label: "WiFi Dead Zone", icon: "📶", enemy: "WiFi Sprite", eicon: "🧚", world: "RF Shadow Realm", wbg: "#1a2a1e", diag: ["Survey AP placement & channel overlap", "Blame the router brand", "Ban all phones"], correct: 0, stat: "networking" },
  { id: "cert", label: "SSL Certificate Expired", icon: "📜", enemy: "Certificate Beast", eicon: "🐗", world: "Chain of Trust", wbg: "#2a2010", diag: ["Renew the cert & fix the chain", "Tell users to click 'Advanced → Proceed'", "Turn off HTTPS"], correct: 0, stat: "security" },
  { id: "disk", label: "Disk Space Critical", icon: "💽", enemy: "Data Hoarder", eicon: "🐲", world: "Sector Wastes", wbg: "#241a10", diag: ["Purge logs, temps & set quotas", "Delete System32", "Buy everyone new laptops"], correct: 0, stat: "windows" },
  { id: "update", label: "Stuck Windows Update", icon: "🔄", enemy: "Patch Gremlin", eicon: "😈", world: "Servicing Stack", wbg: "#1e1a2e", diag: ["Repair the servicing stack & pending ops", "Unplug mid-update", "Hide all updates forever"], correct: 0, stat: "windows" },
  { id: "share", label: "File Share Access Denied", icon: "📁", enemy: "Permission Troll", eicon: "🧌", world: "ACL Abyss", wbg: "#201428", diag: ["Compare Share vs NTFS effective access", "Give everyone Domain Admin", "Disable the firewall"], correct: 0, stat: "windows" },
  { id: "vlan", label: "Wrong VLAN Assignment", icon: "🔀", enemy: "Trunk Ogre", eicon: "👹", world: "Switching Maze", wbg: "#10242a", diag: ["Fix the access port VLAN & trunk allow-list", "Set every port to VLAN 1", "Disable spanning tree"], correct: 0, stat: "networking" },
  { id: "backup", label: "Backup Job Failed", icon: "🗃️", enemy: "Archive Wraith", eicon: "👻", world: "Tape Catacombs", wbg: "#1a1426", diag: ["Check VSS writers & job logs, then rerun", "Delete the backup job", "Pray to the tape gods"], correct: 0, stat: "windows" },
  { id: "slowpc", label: "PC Running Slow", icon: "🐌", enemy: "Bloatware Blob", eicon: "🦠", world: "Startup Swamp", wbg: "#14201a", diag: ["Audit startup items & resource hogs", "Download a 'PC optimizer' ad", "Just reboot forever"], correct: 0, stat: "hardware" },
  { id: "shadow", label: "UNKNOWN ROOT PROCESS", icon: "🕳️", enemy: "THE SHADOW ADMINISTRATOR", eicon: "🌑", world: "The Root Directory", wbg: "#0a0a12", diag: ["Confront palan0 at the root terminal", "Run. Just run.", "Unplug the building"], correct: 0, stat: "security" },
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
];
function applyLab(key) {
  const s = S;
  if (key === "ram") { s.maxHp += 10; s.hp = Math.min(s.maxHp, s.hp + 10); }
  else if (key === "switch") s.stats.networking += 2;
  else if (key === "pi") s.stats.automation += 2;
  else if (key === "punch") s.stats.hardware += 2;
  else if (key === "faraday") s.stats.security += 2;
  else if (key === "kb") s.stressResist = Math.min(.6, (s.stressResist || 0) + .15);
}
const NPC_NAMES = ["Dana", "Marcus", "Priya", "Tom", "Yuki", "Carlos", "Wanda", "Earl", "Nadia", "Greg", "Sue", "Vikram", "Betty", "Hank", "Lena", "Otis"];
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
    meta: { closed: 0, printerKills: 0, chains: 0, crits: 0, legendaries: 0, cmds: 0, lore: [] },
    ach: [], books: [], lab: [], storeStock: [], stressResist: 0, diff: 1, ngPlus: false, shadowDone: false,
    px: 0, py: 0, dir: 1, fx: "down", moving: false,
    npcs: [], portals: [], devices: [], loreSpots: [], coffeeMachines: [],
    map: null, inDialog: false, inBattle: false, gameOver: false, won: false,
  };
}
const save = () => { try { localStorage.setItem("techops_save", JSON.stringify({ day: S.day, clock: S.clock, xp: S.xp, budget: S.budget, stress: S.stress, hp: S.hp, maxHp: S.maxHp, certs: S.certs, inv: S.inv, journal: S.journal, stats: S.stats, soft: S.soft, rep: S.rep, meta: S.meta, ach: S.ach, books: S.books, lab: S.lab, stressResist: S.stressResist, diff: S.diff, ngPlus: S.ngPlus, shadowDone: S.shadowDone })); } catch (e) { } };
const load = () => { try { const d = JSON.parse(localStorage.getItem("techops_save")); return d; } catch (e) { return null; } };
const rank = () => { let r = RANKS[0]; for (const k of RANKS) if (S.xp >= k.xp) r = k; return r; };
const statBonus = st => S.stats[st] * 2 + S.inv.reduce((a, l) => a + (l.stat === st ? l.val : 0), 0);
const coffeeMug = () => S.inv.some(l => l.stat === "stress");

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

// ---------- map generation ----------
// zones: lobby (center), office (top), factory floor (bottom strip), server room (top-right)
const SRV = { x0: MAPW - 13, y0: 2, x1: MAPW - 2, y1: 8 };
const FACTORY_Y = MAPH - 9;
const LOBBY = { x0: (MAPW >> 1) - 5, y0: (MAPH >> 1) - 2, x1: (MAPW >> 1) + 5, y1: (MAPH >> 1) + 2 };
function zoneAt(x, y) {
  if (x >= LOBBY.x0 && x <= LOBBY.x1 && y >= LOBBY.y0 && y <= LOBBY.y1) return "lobby";
  if (x >= SRV.x0 && x <= SRV.x1 && y >= SRV.y0 && y <= SRV.y1) return "server";
  if (y >= FACTORY_Y) return "factory";
  return "office";
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
  // office: cubicle desks, plants, water coolers
  for (let i = 0; i < 65; i++) {
    const x = R(2, MAPW - 3), y = R(2, FACTORY_Y - 1);
    if (m[y][x] === 0 && zoneAt(x, y) === "office") m[y][x] = pick([2, 2, 2, 2, 4, 8]);
  }
  // office partition walls with doorways
  const wallLines = R(3, 5);
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

  // spawn NPCs with tickets
  for (let i = 0; i < n; i++) {
    let type = pick(TICKET_TYPES.filter(t => t.id !== "shadow"));
    if (s.chaos?.id === "drill") type = TICKET_TYPES.find(t => t.id === "malware");
    if (s.chaos?.id === "outage" && Math.random() < .5) type = pick(TICKET_TYPES.filter(t => t.stat === "networking" && t.id !== "shadow"));
    const dept = pick(DEPTS);
    const pos = freeSpot(s.map);
    const npc = {
      id: i, name: pick(NPC_NAMES), dept, type,
      x: pos.x, y: pos.y, face: "🧑‍💼",
      done: false, interviewed: false, diagnosed: false, correctDiag: false,
      critical: Math.random() < .12, pv: R(0, PAL_NPCS.length - 1),
    };
    s.npcs.push(npc); s.tickets.push(npc);
    // a broken device + portal appear near the NPC after diagnosis
  }
  // ambient NPCs
  for (let i = 0; i < R(3, 6); i++) {
    const pos = freeSpot(s.map);
    s.npcs.push({ id: 100 + i, name: pick(NPC_NAMES), dept: pick(DEPTS), x: pos.x, y: pos.y, face: "🧍", ambient: true, pv: R(0, PAL_NPCS.length - 1) });
  }
  // lore spots (unique pieces of the palan0 mystery)
  const loreIds = [0, 1, 2, 3, 4].sort(() => Math.random() - .5).slice(0, R(2, 3));
  for (const lid of loreIds) { const p = freeSpot(s.map); s.loreSpots.push({ x: p.x, y: p.y, text: LORE[lid], lid, found: false }); }
  // coffee machines
  const nc = s.chaos?.id === "heat" ? 4 : 2;
  for (let i = 0; i < nc; i++) { const p = freeSpot(s.map); s.coffeeMachines.push({ x: p.x, y: p.y, used: false }); }
  // daily store stock rotation
  const stockPool = STORE_STOCK.filter(it => !s.books.includes(it.id) && !(it.type === "lab" && s.lab.filter(k => k === it.key).length >= (it.key === "kb" ? 2 : 1)));
  s.storeStock = [...stockPool].sort(() => Math.random() - .5).slice(0, 3).map(it => it.id);

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
  // floors by zone — bright modern-interior style
  if (z === "factory") {
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
    case 5: { // conveyor with animated rollers
      px("#8a8a96", X, Y + 4, TILE, 24); px("#6a6a76", X, Y + 6, TILE, 20);
      const off = Math.floor(tm / 120) % 8;
      for (let i = -1; i < 6; i++) px("#9a9aae", X + ((i * 8 + off + 40) % 40) - 4, Y + 8, 2, 16);
      px("#aaa", X, Y + 4, TILE, 2); px("#aaa", X, Y + 26, TILE, 2); break;
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
  // NPCs
  for (const n of s.npcs) {
    drawSpr(SPR_NPC, PAL_NPCS[n.pv ?? 0], n.x, n.y);
    if (!n.ambient && !n.done) {
      ctx.font = "13px serif";
      ctx.fillText(n.critical ? "🚨" : "🎫", n.x * TILE + 24, n.y * TILE + 7);
    } else if (!n.ambient && n.done) { ctx.font = "12px serif"; ctx.fillText("✅", n.x * TILE + 24, n.y * TILE + 7); }
  }
  // player — custom atlas sprite with directional facing
  drawPlayer(s, tm);
  ctx.restore();
  // minimap (screen-space, bottom right)
  const mm = 2, mw = MAPW * mm, mh = MAPH * mm;
  const mx0 = Math.max(190, cv.width - mw - 92), my0 = cv.height - mh - 12;
  ctx.fillStyle = "#000a"; ctx.fillRect(mx0 - 3, my0 - 3, mw + 6, mh + 6);
  for (let y = 0; y < MAPH; y++) for (let x = 0; x < MAPW; x++) {
    const z = zoneAt(x, y), t = s.map[y][x];
    ctx.fillStyle = t === 1 ? "#8a8a96" : z === "factory" ? "#b0b0a8" : z === "server" ? "#3a4a6a" : z === "lobby" ? "#5a7a9a" : "#d9a05e";
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
  moveAcc += dt * (coffeeMug() ? 3.4 : 3.0); // tiles per second
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
  const lines = [
    `Heard the ${pick(["server room", "MDF", "fiber vault"])} hums at night. Creepy.`,
    `You're ${rank().name}, right? ${S.rep[n.dept] >= 3 ? n.dept + " speaks highly of you." : "We haven't had much to fix in " + n.dept + " lately."}`,
    `Day ${S.day} already? Time flies when the network's up.`,
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
      `<b>${t.icon} ${t.label}</b><br>${symptoms[t.id]}<br><small>Interview the user, then form a hypothesis.</small>`,
      [{ t: "🔍 Form a diagnosis", f: () => diagnose(n) }]);
    return;
  }
  if (!n.diagnosed) return diagnose(n);
  dlg(`${n.name} — ${n.dept}`, n.fixedReady ? "The portal is open by the device. Good luck in there... 🌀" : "Find the broken device nearby (look for ⚠️).", [{ t: "On it.", f: closeDlg }]);
}

function diagnose(n) {
  const s = S, t = n.type;
  const opts = t.diag.map((d, i) => ({
    t: `${["🅰", "🅱", "🅲"][i]} ${d}`,
    f: () => {
      n.diagnosed = true; n.correctDiag = i === t.correct;
      advanceClock(15);
      // spawn broken device near npc
      const dp = freeSpot(s.map, n.x, n.y);
      s.devices.push({ ...dp, type: t, fixed: false, npc: n.id });
      if (n.correctDiag) {
        addXP(8); toast("🎯 Correct diagnosis! (+8 XP)");
        // good diagnosis = easier dungeon: portal appears, enemy weakened
        const pp = freeSpot(s.map, dp.x, dp.y);
        s.portals.push({ ...pp, npc: n.id, weak: true });
      } else {
        addStress(10);
        toast("❌ Wrong hypothesis... the problem is worse than it looked. (+10 stress)");
        const pp = freeSpot(s.map, dp.x, dp.y);
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
  const SIGS = { malware: ["enclock", "ransom"], dns: ["spawn", "poison"], bsod: ["crash", "freeze"] };
  B = { portal, npc, t, hp, maxHp: hp, shield: false, stunned: false, weakened: false, regen: false, log: [], boss, enraged: false, turns: 0, locks: {}, revealed: false, dmgBuff: 0, counter: false, sig: pick(SIGS[t.id] || ["overload", "wipe"]), forkBomb: false };
  s.inBattle = true;
  sfx("portal");
  $("battle").classList.remove("hidden");
  $("enemy-sprite").textContent = t.eicon;
  $("enemy-sprite").style.fontSize = boss ? "96px" : "72px";
  $("enemy-sprite").style.filter = boss ? "drop-shadow(0 0 20px #f44)" : "drop-shadow(0 0 12px #a0f)";
  $("enemy-name").textContent = boss ? `👹 ${BOSS_NAMES[t.id] || "BOSS: " + t.enemy} 👹` : `${t.enemy} — ${t.world}`;
  blog(boss
    ? `<span class="sys">⚠️ The corruption is MASSIVE here. <b>${BOSS_NAMES[t.id] || t.enemy}</b> rises from the ${t.world}. This is a BOSS fight — watch for phase changes!</span>`
    : `<span class="sys">You step through the portal into the <b>${t.world}</b>. A ${t.enemy} manifests!</span>`);
  blog(`<span class="sys">Tip: use 📡 Ping to recon the enemy's weaknesses.</span>`);
  renderBattle();
}
function blog(h) { B.log.push(h); $("battle-log").innerHTML = B.log.slice(-30).join("<br>"); $("battle-log").scrollTop = 1e6; }
function battleAbilities() {
  const list = [...ABILITIES];
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
  return list;
}
function renderBattle() {
  const s = S;
  $("enemy-hp").style.width = clamp(B.hp / B.maxHp * 100, 0, 100) + "%";
  $("player-hp").style.width = clamp(s.hp / s.maxHp * 100, 0, 100) + "%";
  $("player-hp-text").textContent = `HP ${s.hp}/${s.maxHp} · Stress ${s.stress}/100`;
  const box = $("battle-actions"); box.innerHTML = "";
  for (const a of battleAbilities()) {
    const b = document.createElement("button");
    const locked = B.locks[a.id] > 0;
    b.innerHTML = `${a.icon} ${a.name}<span class="cost">${locked ? `🔐 encrypted ${B.locks[a.id]}t` : a.stress > 0 ? "+" + a.stress + " stress" : a.stress < 0 ? a.stress + " stress" : "free"}</span>`;
    b.disabled = locked || s.stress + a.stress > 100;
    b.onclick = () => doAbility(a);
    box.appendChild(b);
  }
}
function doAbility(a) {
  const s = S;
  if (!B || B.over) return;
  addStress(a.stress);
  s.meta.cmds++;
  let dmg = 0;
  if (a.dmg[1] > 0) {
    const bonus = statBonus(B.t.stat);
    dmg = R(a.dmg[0], a.dmg[1]) + Math.round(bonus / 2);
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
    // Ping doubles as recon: reveals the enemy's weakness profile
    if (a.id === "ping" && !B.revealed && tac) {
      B.revealed = true;
      const names = id => (ABILITIES.concat(Object.values(CERT_ABILITIES), MOVE_LEVELS.map(m => m.ability)).find(x => x.id === id) || {}).name || id;
      blog(`<span class="sys">📡 Recon complete — replies from target. Analysis: weak to <b>${tac.weak.map(names).join(", ")}</b>; resists <b>${tac.resist.map(names).join(", ")}</b>.</span>`);
    }
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
  // tick down encryption locks
  for (const k of Object.keys(B.locks)) if (--B.locks[k] <= 0) { delete B.locks[k]; blog(`<span class="sys">🔓 Decryption complete — ability restored.</span>`); }
  if (B.regen) s.hp = clamp(s.hp + 3, 0, s.maxHp);
  if (B.poison > 0) { B.poison--; s.hp -= 4; blog(`☠️ Cache poison burns you for 4.`); }
  if (B.forkBomb) { B.hp = Math.min(B.maxHp, B.hp + 8); blog(`☠️ palan0 replicates... <b>+8 HP</b>`); }
  if (s.hp <= 0) return loseBattle();
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
  B.portal.cleared = true;
  setTimeout(() => {
    $("battle").classList.add("hidden");
    s.inBattle = false;
    // remove portal
    s.portals = s.portals.filter(p => p !== B.portal);
    // journal
    s.journal.push({ day: s.day, title: `${t.label} — resolved`, body: `Root cause traced in the ${t.world}. Solution: ${t.diag[t.correct]}. Prevention: monitoring + documentation.` });
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
  s.journal.push({ day: s.day, title: `${n.type.label} — FAILED`, body: `Lesson: ${n.type.diag[n.type.correct]}. You won't make that mistake twice.` });
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
  let repGain = 1;
  if (s.chaos?.id === "ceo" && n.dept === "Executives") repGain = 2;
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
  $("chaos-banner").classList.add("hidden"); // chaos now lives on the clock line
  const open = s.tickets.filter(t => !t.done);
  $("quest-tracker").innerHTML =
    s.tickets.filter(t => t.done).map(t => `<div class="done">✅ ${t.type.label} (${t.dept})</div>`).join("") +
    open.map(t => `<div>${t.critical ? "🚨" : "🎫"} ${t.type.label} — ${t.name}, ${t.dept}${t.diagnosed ? " · find 🌀" : ""}</div>`).join("");
  updateSweep();
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
      `The tickets will continue. They always do. But today, the network answers to <b>you</b>.<br><br>${stats}`;
    $("eod").querySelector("h3").textContent = "Choose your legacy:";
    const box = $("eod-rewards"); box.innerHTML = "";
    const ng = document.createElement("button");
    ng.innerHTML = `<span class="rw-icon">🔄</span><b>NEW GAME+</b><br>Keep certs, books, achievements. Enemies +25% HP.`;
    ng.onclick = () => {
      const keep = { certs: s.certs, books: s.books, ach: s.ach, meta: s.meta, journal: s.journal, lab: s.lab, stressResist: s.stressResist, inv: s.inv, rep: s.rep, stats: s.stats, soft: s.soft };
      S = newState(); Object.assign(S, keep); S.ngPlus = true; S.meta.lore = []; S.shadowDone = false;
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
    $("eod-summary").innerHTML = `The manifestation put you in the hospital. HR sends flowers.<br><br>${stats}`;
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
  $("eod-summary").innerHTML = `You retire as the legend of Building 7.<br><br>${stats}<br><br><small>Thanks for playing. A Kimi × ninja-ops-guy production.</small>`;
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
function endOfDay() {
  const s = S; eodOpen = true;
  let stressRec = s.chaos?.id === "calm" ? 30 : 15;
  s.stress = clamp(s.stress - stressRec, 0, 100);
  const missed = s.ticketsTotal - s.ticketsDone;
  if (missed > 0) for (const t of s.tickets.filter(t => !t.done)) s.rep[t.dept] = Math.max(0, s.rep[t.dept] - 1);
  if (missed === 0 && s.ticketsTotal > 0) unlock("backlog0");
  $("eod-title").textContent = `DAY ${s.day} COMPLETE`;
  $("eod-summary").innerHTML =
    `🎫 Tickets: ${s.ticketsDone}/${s.ticketsTotal}${missed ? ` <span style="color:#f88">(${missed} rolled over, -rep)</span>` : " — <b>ZERO BACKLOG!</b> 👑"}<br>` +
    `✨ Total XP: ${s.xp} · 💰 Budget: $${s.budget}<br>` +
    `😌 Stress recovered: -${stressRec} · Rank: <b>${rank().name}</b>`;
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
  const tabs = ["Character", "Inventory", "Store", "Certifications", "Journal", "Reputation", "Achievements"];
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
  } else if (tab === "Inventory") {
    el.innerHTML = s.inv.length ? "" : "<i>No loot yet. Close tickets and clear dungeons!</i>";
    for (const l of s.inv) el.innerHTML += `<div class="loot-item">${l.icon} <span class="rarity-${l.rarity}"><b>${l.name}</b> (${l.rarity})</span><br><small>${l.stat === "stress" ? "Passive: move faster, stress resist" : `+${l.val} ${l.stat}`}</small></div>`;
  } else if (tab === "Store") {
    el.innerHTML = `<i>Mac's IT Emporium — new stock every morning. Budget: <b>$${s.budget}</b></i><br><br>`;
    if (!s.storeStock.length) el.innerHTML += "<i>Sold out for today. Come back tomorrow.</i>";
    for (const id of s.storeStock) {
      const it = STORE_STOCK.find(x => x.id === id);
      const afford = s.budget >= it.cost;
      el.innerHTML += `<div class="loot-item">${it.icon} <b>${it.name}</b> <span style="color:#8f8">$${it.cost}</span><br><small>${it.type === "book" ? it.blurb : it.effect}</small> <button data-buy="${it.id}" data-cost="${it.cost}" ${afford ? "" : "disabled"} style="float:right;background:#153;border:1px solid #4f4;color:#8f8;border-radius:5px;padding:3px 10px;font-family:inherit">BUY</button></div>`;
    }
    el.innerHTML += `<br><small>Owned: ${[...s.books.map(b => STORE_STOCK.find(x => x.id === b)?.name), ...s.lab.map(k => STORE_STOCK.find(x => x.key === k)?.name)].filter(Boolean).join(", ") || "nothing yet"}</small>`;
    el.querySelectorAll("button[data-buy]").forEach(b => b.onclick = () => {
      const it = STORE_STOCK.find(x => x.id === b.dataset.buy);
      if (s.budget < it.cost) return toast("Not enough budget!");
      s.budget -= it.cost;
      if (it.type === "book") { s.books.push(it.id); toast(`📖 Learned a new move: ${it.blurb.replace("Teaches: ", "")}!`); }
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
