import { useParams, Link } from 'react-router-dom'

interface LegalContent {
  title: string
  body: string[]
}

const LEGAL_CONTENT: Record<string, LegalContent> = {
  about: {
    title: 'About Us',
    body: [
      'Ring Tactics is a turn-based wrestling strategy game where you build a roster of wrestlers, master their skills, and battle your way up the ladder.',
      'We are a small independent team passionate about combat strategy games and wrestling culture, building this project as a labor of love.',
    ],
  },
  contact: {
    title: 'Contact Us',
    body: [
      'Have a question, bug report, or feedback? We would love to hear from you.',
      'Email: support@ringtactics.com',
      'We aim to respond to all inquiries within 2-3 business days.',
    ],
  },
  pricing: {
    title: 'Pricing Details',
    body: [
      'Ring Tactics is free to play. Coins are earned in-game by winning ladder matches and cannot be purchased.',
      'Diamond purchases are currently paused while we choose a reliable payment gateway.',
    ],
  },
  terms: {
    title: 'Terms and Conditions',
    body: [
      'By accessing or using Ring Tactics, you agree to be bound by these Terms and Conditions.',
      'You must be at least 13 years old to create an account. Accounts are for personal, non-commercial use only.',
      'In-game currency (coins and diamonds) has no real-world monetary value and cannot be exchanged, transferred, or redeemed for cash.',
      'We reserve the right to suspend or terminate accounts that violate these terms or engage in abusive behavior.',
      'These terms may be updated periodically; continued use of the service constitutes acceptance of any changes.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    body: [
      'We collect the minimum information necessary to operate your account, such as your username and gameplay progress.',
      'We do not sell your personal information to third parties.',
      'When payments are available, payment information will be processed by a third-party payment provider and will not be stored on our servers.',
      'You may request deletion of your account and associated data at any time by contacting support.',
    ],
  },
  refund: {
    title: 'Cancellation/Refund Policy',
    body: [
      'Diamond purchases are currently paused while we choose a reliable payment gateway.',
      'If you believe you were charged in error from a previous transaction, contact support within 7 days and we will review your case.',
      'Refunds, when approved for prior transactions, will be issued to the original payment method.',
    ],
  },
}

export function LegalPage() {
  const { slug = '' } = useParams()
  const content = LEGAL_CONTENT[slug]

  return (
    <div className="arena-page min-h-screen bg-px-base text-px-text">
      <div className="arena-page-header" style={{ background: '#141726', borderBottom: '4px solid #c42b2b' }}>
        <div className="max-w-4xl mx-auto px-4 py-5">
          <p className="text-px-dim text-[9px] font-bold uppercase tracking-widest mb-1"
             style={{ fontFamily: 'monospace' }}>Ring Tactics</p>
          <h1 className="text-2xl font-bold uppercase tracking-widest">{content?.title ?? 'Not Found'}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="arena-panel px-6 py-6" style={{ background: '#141726', border: '2px solid #2e3755' }}>
          {content
            ? content.body.map((p, i) => (
                <p key={i} className="text-px-muted text-sm leading-relaxed mb-4 last:mb-0">{p}</p>
              ))
            : <p className="text-px-muted text-sm">This page could not be found.</p>}

          {slug === 'pricing' && (
            <div className="mt-4 px-4 py-3" style={{ background: '#0f1120', border: '1px solid #2e3755' }}>
              <p className="text-px-muted text-xs uppercase tracking-widest" style={{ fontFamily: 'monospace' }}>
                💎 Diamond Store coming soon
              </p>
            </div>
          )}

          <Link to="/" className="block mt-4 text-px-gold text-xs uppercase tracking-widest hover:brightness-110"
                style={{ fontFamily: 'monospace' }}>
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
