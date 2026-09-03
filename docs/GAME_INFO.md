# Ring Tactics — Game Info

Ring Tactics is a turn-based, 3v3 professional-wrestling tactics game. Draft a team of wrestlers, manage a shared energy pool, and out-think your opponent turn by turn.

## Match Modes

| Mode | Description |
|---|---|
| **VS AI** | Single-player match against a computer-controlled team. |
| **VS Player (Private Room)** | Create a room and share the code with a friend, or join one. |
| **Ladder** | Auto-matchmaking against another online player. |

All modes use the same rules engine, so strategy carries over between them.

## Building Your Team

- Pick exactly **3 wrestlers** from the roster before a match.
- Each wrestler has **4 skills**, a rarity tier, and one or more fighting styles (brawler, high-flyer, submission, cornerman, monster, technician, etc.).
- Every wrestler starts at **100 HP**.

## Turn Structure

1. **Player's turn**: queue up to one skill per living, non-stunned wrestler, then submit.
2. **Opponent's turn**: the AI or other player queues their moves and submits.
3. Turns resolve **sequentially** — one full side at a time, not simultaneously.
4. After both sides act, active effects tick, cooldowns decrease, and each side gains energy for the next round.
5. The match ends when one team has no wrestlers left standing.

In Ladder and Private Room matches, each turn has a **60-second timer**. In VS AI, you also have 60 seconds before a random valid move is auto-submitted.

## Energy System

Energy fuels every skill. Each team shares one energy pool across all 4 types:

| Type | Theme |
|---|---|
| Strength | Power moves |
| Magic | Technical/mystical moves |
| Spirit | Support/recovery moves |
| Agility | Speed/submission moves |

- At the start of a match, each team receives **1 random energy** (opening round only).
- After each completed round, a team gains energy equal to **⌈(living wrestlers) / 2⌉**, rounded up — so a full team of 3 gains 2, down to 1 with a single wrestler left.
- Energy is capped at **3 per type**.
- Some skills cost a specific type (e.g. 2 Strength); others cost `random`, meaning **any type(s)** can be spent to cover it. If a skill has multiple valid ways to pay a random cost, you'll be prompted to choose which energy to spend.

## Skills

Every skill has:

- **Cost** — the energy required to use it.
- **Cooldown** — turns before it can be used again (`0` means no cooldown).
- **Target type** — `enemy`, `ally`, `self`, `all_enemies`, or `all_allies`.
- **Main class** — `physical`, `magic`, or `strategic`.
- **Persistence** — `instant` (resolves immediately), `action` (buffs/debuffs that last multiple rounds), or `control` (stuns/disables).

### Effect Types

| Effect | What it does |
|---|---|
| Damage | Standard damage; can be reduced by damage reduction or destructible defense. |
| Pierce Damage | Ignores damage reduction, but not destructible defense. |
| Affliction | Ignores **both** damage reduction and destructible defense. |
| Heal | Restores HP to a target. |
| Stun | Target cannot act for a set number of rounds. |
| Invulnerable | Target cannot be targeted or take damage for a round. |
| Damage Reduction | Reduces incoming damage for a duration. |
| Destructible Defense | A depletable damage-absorbing shield. |
| Damage Boost | Increases the caster's own outgoing damage. |
| Energy Gain / Drain | Adds or removes energy from a team's pool. |
| Damage Mark | A combo marker — hitting the same target again before it expires deals bonus damage (e.g. Big Crusher's Haymaker). |

Right-click (or long-press) any skill in battle to see its full tooltip: description, cost, class, persistence, and cooldown.

## Rivalries & Signature Mechanics

Some skills reward specific matchups or combos, tracked through the mission system (see below):

- **Big Crusher's Haymaker** builds a combo mark on the same target — miss a turn and it resets.
- **The Beast's Primal Rage** boosts his own damage and reduces incoming damage for several rounds.
- Wrestlers like **Snake Eyes** and **Doc Holiday** have invulnerability escapes on cooldown for defensive timing.

## Progression

### Ranking

Every completed match (VS AI or PvP) earns XP:

- **Win**: 75 XP base
- **Loss**: 15 XP base
- **+10 XP** per surviving ally
- **+25 XP bonus** for a win finished in 5 turns or fewer

XP moves you through 10 ranks, from **Green Horn** up to **Legend**.

### Missions

Missions track career and rivalry milestones, such as:

- Completing your first match, or 10 matches
- Winning 3 or 10 matches
- Winning in 5 turns or fewer
- Winning with all 3 allies still alive
- Specific rivalry win conditions/streaks between named wrestlers

### Leaderboards

Global leaderboards rank players by:

- Total wins
- Best win streak
- Total matches played
- Fewest losses

## Accounts

An account (username + password) is required to play matches, track rank/missions, and appear on leaderboards. Browsing the roster and leaderboards does not require logging in.
