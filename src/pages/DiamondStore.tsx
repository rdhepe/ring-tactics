import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DIAMOND_PACKAGES, type DiamondPackage } from '../data/economy'
import { API, useAuthStore } from '../store/authStore'
import { useRankStore } from '../store/rankStore'

const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void }
  }
}

function loadRazorpayScript(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true)
  return new Promise(resolve => {
    const script = document.createElement('script')
    script.src = RAZORPAY_SCRIPT_SRC
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function DiamondStorePage() {
  const { isLoggedIn, username } = useAuthStore()
  const { diamonds, setDiamonds } = useRankStore()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function purchase(pkg: DiamondPackage) {
    setError(null)
    if (!isLoggedIn) { setError('Please log in to buy diamonds.'); return }

    setPendingId(pkg.id)
    try {
      const scriptReady = await loadRazorpayScript()
      if (!scriptReady) throw new Error('Could not load Razorpay checkout.')

      const orderRes = await fetch(`${API}/payments/create-order`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id }),
      })
      if (!orderRes.ok) throw new Error((await orderRes.json().catch(() => null))?.error ?? 'Could not start checkout.')
      const order = await orderRes.json() as { orderId: string; amount: number; currency: string; keyId: string }

      const razorpay = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: 'Ring Tactics',
        description: `${pkg.name} — ${pkg.diamonds + pkg.bonus} diamonds`,
        prefill: { name: username ?? undefined },
        theme: { color: '#c42b2b' },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await fetch(`${API}/payments/verify`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            })
            if (!verifyRes.ok) throw new Error((await verifyRes.json().catch(() => null))?.error ?? 'Payment verification failed.')
            const { diamonds: newBalance } = await verifyRes.json() as { diamonds: number }
            setDiamonds(newBalance)
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Payment verification failed.')
          } finally {
            setPendingId(null)
          }
        },
        modal: { ondismiss: () => setPendingId(null) },
      })
      razorpay.open()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setPendingId(null)
    }
  }

  return (
    <div className="arena-page min-h-screen bg-px-base text-px-text">
      <div className="arena-page-header" style={{ background: '#141726', borderBottom: '4px solid #c42b2b' }}>
        <div className="max-w-4xl mx-auto px-4 py-5">
          <p className="text-px-dim text-[9px] font-bold uppercase tracking-widest mb-1"
             style={{ fontFamily: 'monospace' }}>Ring Tactics</p>
          <h1 className="text-2xl font-bold uppercase tracking-widest">💎 Diamond Store</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {isLoggedIn && (
          <p className="text-px-muted text-sm mb-6">
            Current balance: <span className="text-[#6be8ff] font-bold">{diamonds} 💎</span>
          </p>
        )}
        {error && (
          <p className="text-sm mb-6 px-4 py-2" style={{ color: '#f45e3f', background: '#f45e3f11', border: '1px solid #f45e3f44' }}>
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DIAMOND_PACKAGES.map(pkg => (
            <div key={pkg.id} className="arena-panel px-5 py-5 flex flex-col items-center gap-2 text-center"
                 style={{ background: '#141726', border: '2px solid #2e3755' }}>
              <p className="text-px-dim text-[9px] font-bold uppercase tracking-widest" style={{ fontFamily: 'monospace' }}>{pkg.name}</p>
              <p className="text-2xl font-bold text-[#6be8ff]">💎 {pkg.diamonds.toLocaleString()}</p>
              {pkg.bonus > 0 && (
                <p className="text-px-gold text-xs font-bold uppercase tracking-widest">+{pkg.bonus.toLocaleString()} bonus</p>
              )}
              <button
                onClick={() => purchase(pkg)}
                disabled={pendingId === pkg.id}
                className="mt-3 w-full py-2 text-sm font-bold uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50"
                style={{ background: '#c42b2b', color: '#fff', boxShadow: '3px 3px 0 #7a1a0a' }}>
                {pendingId === pkg.id ? 'Processing…' : `₹${pkg.priceInr.toFixed(2)}`}
              </button>
            </div>
          ))}
        </div>

        <Link to="/legal/pricing" className="inline-block mt-8 text-px-gold text-xs uppercase tracking-widest hover:brightness-110"
              style={{ fontFamily: 'monospace' }}>
          &larr; Back to Pricing Details
        </Link>
      </div>
    </div>
  )
}
