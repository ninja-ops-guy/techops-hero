# Night Walker competitive modes — implementation scope

This is a design and engineering backlog, not a claim that multiplayer exists.
The current Combat Lab is offline, single-player K, Iona, Mike or Felicia against
a stationary target or one existing AI opponent (guard, skimmer or hunter). It uses the existing Night combat loop. There is no
online connection, player-versus-player hit detection, team setup, character
selection, loadout, pickup or unlock in the current slice.

## Intended modes

* Breach: 1v1 or 2v2, side-swapped rounds. Blue deploys limited security; Red
  scouts and enters, then fights and completes an interruptible objective.
  Win by objective, elimination or time. Doors must be physically obstructive,
  breakable, or quietly pickable; lock difficulties must be playable puzzles.
  Cameras, lasers, disable/repair, alarms and pickups must be visible to the
  affected players and support counterplay, not merely change labels.
* Arena: fighting-focused 1v1 and 2v2, with round wins, rematch and no breach
  objectives. The present single-opponent offline fight is an early practice slice.
* Training: movement, strikes, blocking, combos, resets, and eventually opponent
  behavior and character/tool drills. The present target is stationary, with a damage counter and reset.

## Character and loadout direction

K is adaptable, Iona a controlled breacher/fighter, Mike discovers possible
routes and helps initial access, and Felicia is an agile, fast stealth support.
Characters can play on either team; tools have team-appropriate behavior.
Red is an unlockable visual alternative for K, with K's gameplay and readable
team identification; Red remains a distinct person in the story. No asset or
unlock is implemented in this slice. Confirm final art against creator references.

Choose one signature, a primary tool and a support item; use bounded charges.
Candidate pickups: medical supplies, tool parts, batteries, smoke, decoys and
limited access tokens. Match balancing, pickup distribution and character
numbers require playtesting. Competitive stats must be normalized independently
of campaign levels, equipment and accessibility damage assists. Never change a
player's campaign inventory or award street XP/cash for practice or PvP.

## Online prerequisites and acceptance

1. Select and provision an authoritative session service and transport. Existing
   GitHub Pages static hosting is not a game server. Define hosting, identity,
   private lobbies, access controls, regional latency and operating costs.
2. Factor shared movement/combat into a fixed-step model that supports distinct
   players: the current Night runtime has one player and AI enemies. Specify
   server-owned hit validation, cooldowns, objectives, item usage, pickup claims,
   match clock, disconnection handling, reconnection and cleanup. Do not treat
   local inputs or client-reported outcomes as authoritative.
3. Implement setup, doors, lock puzzles, cameras, lasers, route intel, character
   abilities, combat and objective as one coherent replicated game. Ensure
   opponents only receive information they are allowed to know.
4. Provide 1v1 and 2v2 lobbies, explicit teams, side swaps, result/rematch,
   keyboard and mobile controls, clear team indicators, and accessible feedback.
5. Validate actual independent clients and a hosted server under latency, loss,
   disconnect, duplicate input, and concurrent interaction; test physical mobile
   devices and run creator visual review. A local single-browser demo or bot
   cannot qualify online multiplayer.
