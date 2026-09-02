import { Link } from 'react-router-dom'
import { LeaderboardGrid } from '../components/leaderboards/LeaderboardGrid'
import { ALL_CHARACTERS } from '../data/characters'
import arenaBackground from '../assets/backgrounds/background-1.jpg'
import './Home.css'

const ENERGY = [
  ['Power', 'P', '#ef4b3f'], ['Technical', 'T', '#4f8fd8'],
  ['Stamina', 'S', '#35b892'], ['Quickness', 'Q', '#e8bd4a'],
  ['Wildcard', '?', '#9ba3b5'],
] as const

const FORMAT = [
  ['3', 'Wrestlers per stable'], ['60', 'Seconds on the clock'],
  ['4', 'Energy disciplines'], ['1', 'Stable left standing'],
] as const

export function HomePage() {
  return (
    <main className="event-home">
      <section className="event-hero" style={{ backgroundImage: `url(${arenaBackground})` }}>
        <div className="event-broadcast">
          <span>RING TACTICS NETWORK</span><b>LIVE</b><span>SEASON 01</span>
        </div>
        <div className="event-hero-copy">
          <p className="event-kicker">The bell is about to ring</p>
          <h1><em>RING</em> TACTICS</h1>
          <p>Build a three-wrestler stable. Call every move. Leave no one standing.</p>
          <div className="event-actions">
            <Link to="/battle" className="event-button event-button-primary">Enter The Ring</Link>
            <Link to="/characters" className="event-button event-button-outline">View Fight Card</Link>
          </div>
        </div>
        <div className="event-rounds" aria-hidden="true"><span>01</span><i /><span>02</span><i /><span>03</span></div>
      </section>

      <div className="event-marquee">
        BUILD THE STABLE <b>+</b> CALL THE SPOTS <b>+</b> OWN THE RING <b>+</b> BUILD THE STABLE <b>+</b> CALL THE SPOTS
      </div>

      <section className="event-wrap event-leaders">
        <Header kicker="Official arena records" title="Top Of The Card">
          <Link to="/leaderboards" className="event-more">Full Leaderboards <span>+</span></Link>
        </Header>
        <LeaderboardGrid limit={3} />
      </section>

      <section className="event-fight-bill">
        <div className="event-wrap">
          <Header kicker="Available tonight" title="The Fight Bill" light>
            <p className="event-stamp">6 WRESTLERS / 1 RING</p>
          </Header>
          <div className="event-roster">
            {ALL_CHARACTERS.map((character, index) => (
              <Link key={character.id} to={`/characters/${character.id}`} className="event-wrestler">
                <span className="event-wrestler-number">0{index + 1}</span>
                <div className="event-wrestler-photo">
                  {character.avatarUrl
                    ? <img src={character.avatarUrl} alt={character.name} />
                    : <span>{character.name[0]}</span>}
                </div>
                <div className="event-wrestler-name">
                  <strong>{character.name}</strong>
                  <span>{character.title ?? character.classes[0]}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="event-format">
        <div className="event-wrap event-format-inner">
          <div><p className="event-kicker">Match format</p><h2>No Judges.<br />No Timeouts.</h2></div>
          <div className="event-format-stats">
            {FORMAT.map(([value, label]) => (
              <div key={label}><strong>{value}</strong><span>{label}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section className="event-energy">
        <div className="event-wrap event-energy-inner">
          <div><p className="event-kicker">Corner supply</p><h2>Spend It Wisely</h2></div>
          <div className="event-energy-rail">
            {ENERGY.map(([label, short, color]) => (
              <div key={label}><span style={{ background: color }}>{short}</span><strong>{label}</strong></div>
            ))}
          </div>
          <Link to="/battle" className="event-button event-button-primary">Book A Match</Link>
        </div>
      </section>
    </main>
  )
}

function Header({ kicker, title, light = false, children }: {
  kicker: string
  title: string
  light?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`event-section-heading${light ? ' event-section-heading-light' : ''}`}>
      <div><p className="event-kicker">{kicker}</p><h2>{title}</h2></div>
      {children}
    </div>
  )
}