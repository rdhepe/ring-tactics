import { Link } from 'react-router-dom'

const FOOTER_LINKS = [
  { to: '/legal/about',   label: 'About Us' },
  { to: '/legal/contact', label: 'Contact Us' },
  { to: '/legal/pricing', label: 'Pricing Details' },
  { to: '/legal/terms',   label: 'Terms and Conditions' },
  { to: '/legal/privacy', label: 'Privacy Policy' },
  { to: '/legal/refund',  label: 'Cancellation/Refund Policy' },
] as const

export function Footer() {
  return (
    <footer className="bg-px-panel border-t-2 border-px-border mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col items-center gap-3">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {FOOTER_LINKS.map(({ to, label }) => (
            <Link key={to} to={to}
                  className="text-px-muted hover:text-px-gold text-xs uppercase tracking-widest transition-colors"
                  style={{ fontFamily: 'monospace' }}>
              {label}
            </Link>
          ))}
        </div>
        <p className="text-px-dim text-[10px]" style={{ fontFamily: 'monospace' }}>
          &copy; {new Date().getFullYear()} Ring Tactics. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
