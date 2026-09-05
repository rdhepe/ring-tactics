interface Step {
  n: string
  title: string
  body: string[]
}

const STEPS: Step[] = [
  {
    n: '1',
    title: 'Build Your Stable',
    body: [
      'Pick exactly 3 wrestlers from the roster before a match. Each one has 4 unique skills, a rarity tier, and one or more fighting styles.',
      'Every wrestler starts at 100 HP. Choose a mix that covers offense, defense, and support.',
    ],
  },
  {
    n: '2',
    title: 'Pick a Match Type',
    body: [
      'VS AI — fight a computer-controlled team, great for practice.',
      'VS Player — create a private room and share the code with a friend.',
      'Ladder — get auto-matched against a random online player and climb the rank ladder.',
    ],
  },
  {
    n: '3',
    title: 'How Turns Work',
    body: [
      'On your turn, queue up to one skill per living, non-stunned wrestler, then submit.',
      'Then your opponent (AI or player) queues their moves and submits.',
      'Turns resolve sequentially, one full side at a time — not simultaneously.',
      'After both sides act, active effects tick down, cooldowns decrease, and each side gains energy for the next round.',
      'Ladder and Private Room matches have a 60-second timer per turn — plan quickly!',
    ],
  },
  {
    n: '4',
    title: 'Energy Powers Every Skill',
    body: [
      'Your team shares one energy pool across 4 types: Strength (power moves), Magic (technical/mystical), Spirit (support/recovery), and Agility (speed/submission).',
      'Each team starts with 1 random energy. After every completed round, your team gains energy equal to half your living wrestlers, rounded up — capped at 3 per type.',
      'Some skills cost a specific type; others cost "random", meaning any type(s) can cover it.',
    ],
  },
  {
    n: '5',
    title: 'Attacks, Abilities & Effects',
    body: [
      'Every skill has a Cost (energy needed), Cooldown (turns before reuse), Target Type (enemy/ally/self/all), Main Class (physical, magic, or strategic), and Persistence (instant, action, or control).',
      'Right-click or long-press any skill in battle to see its full tooltip.',
    ],
  },
  {
    n: '6',
    title: 'Defense & Damage Mitigation',
    body: [
      'Damage Reduction lowers incoming damage for a set duration.',
      'Destructible Defense is a depletable shield that soaks up damage before your HP does.',
      'Invulnerable wrestlers cannot be targeted or take damage for a round.',
      'Pierce Damage ignores damage reduction (but not shields); Affliction ignores both — watch out for those!',
    ],
  },
  {
    n: '7',
    title: 'Health, Damage & KOs',
    body: [
      'Standard damage is reduced by damage reduction or destructible defense before it hits HP.',
      'Healing effects restore HP to a target — timing heals around incoming burst damage is key.',
      'When a wrestler\'s HP hits 0, they\'re knocked out and can no longer act.',
    ],
  },
  {
    n: '8',
    title: 'Winning & Losing',
    body: [
      'The match ends the moment one team has no wrestlers left standing.',
      'Ranked Ladder wins earn coins and XP; every completed match (win or loss) earns XP toward your rank, from Green Horn all the way up to Legend.',
    ],
  },
  {
    n: '9',
    title: 'Unlocking More Wrestlers',
    body: [
      'Common-rarity wrestlers are free from the start. Higher-rarity wrestlers can be unlocked using Coins (earned from ladder wins) or Diamonds (purchased or earned).',
      'Check the Roster page to see unlock costs for each wrestler.',
    ],
  },
  {
    n: '10',
    title: 'Extra Tips',
    body: [
      'Some skills build combo marks on the same target — like Big Crusher\'s Haymaker — but miss a turn and the combo resets.',
      'Watch cooldowns on defensive skills like invulnerability escapes to time your saves.',
      'Missions track career and rivalry milestones for bonus goals to chase as you play.',
    ],
  },
]

export function TutorialPage() {
  return (
    <div className="arena-page min-h-screen bg-px-base text-px-text">
      <div className="arena-page-header" style={{ background: '#141726', borderBottom: '4px solid #c42b2b' }}>
        <div className="max-w-4xl mx-auto px-4 py-5">
          <p className="text-px-dim text-[9px] font-bold uppercase tracking-widest mb-1"
             style={{ fontFamily: 'monospace' }}>Ring Tactics</p>
          <h1 className="text-2xl font-bold uppercase tracking-widest">How to Play</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-4">
        {STEPS.map(step => (
          <div key={step.n} className="arena-panel flex gap-4 px-6 py-5"
               style={{ background: '#141726', border: '2px solid #2e3755' }}>
            <div className="shrink-0 flex items-center justify-center font-bold"
                 style={{ width: 44, height: 44, background: '#ffd16622', border: '2px solid #ffd166',
                          color: '#ffd166', fontFamily: "'Press Start 2P', monospace", fontSize: 14 }}>
              {step.n}
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="font-bold uppercase tracking-wider text-sm text-px-gold">{step.title}</h2>
              {step.body.map((line, i) => (
                <p key={i} className="text-px-muted text-sm leading-relaxed">{line}</p>
              ))}
            </div>
          </div>
        ))}

      </div>
    </div>
  )
}
