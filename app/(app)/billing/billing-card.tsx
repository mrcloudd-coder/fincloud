'use client'

import { useState } from 'react'
import Script from 'next/script'
import { Loader2, CheckCircle2, Clock, XCircle } from 'lucide-react'

type SubscriptionInfo = {
  hasFullAccess: boolean
  status: 'trialing' | 'active' | 'expired' | 'none'
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  daysLeftInTrial: number | null
}

const IS_PRODUCTION = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
const SNAP_JS_URL = IS_PRODUCTION
  ? 'https://app.midtrans.com/snap/snap.js'
  : 'https://app.sandbox.midtrans.com/snap/snap.js'
const CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? ''

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options?: Record<string, unknown>) => void
    }
  }
}

export default function BillingCard({ subscription }: { subscription: SubscriptionInfo }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scriptReady, setScriptReady] = useState(false)

  async function handlePay() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal memulai pembayaran')

      if (!window.snap) {
        throw new Error('Sistem pembayaran belum siap, coba refresh halaman')
      }

      window.snap.pay(data.token, {
        onSuccess: () => window.location.reload(),
        onPending: () => window.location.reload(),
        onError: () => setError('Pembayaran gagal, silakan coba lagi'),
        onClose: () => setLoading(false),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setLoading(false)
    }
  }

  return (
    <>
      <Script src={SNAP_JS_URL} data-client-key={CLIENT_KEY} onReady={() => setScriptReady(true)} />

      <div className="card p-6">
        {subscription.status === 'trialing' && subscription.hasFullAccess && (
          <div className="flex items-start gap-3 mb-5 p-4 rounded-xl" style={{ background: 'var(--primary-soft)' }}>
            <Clock size={20} style={{ color: 'var(--primary)' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                Masa coba gratis — {subscription.daysLeftInTrial} hari lagi
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--ink-soft)' }}>
                Setelah masa coba habis, beberapa fitur akan dibatasi kecuali kamu berlangganan.
              </p>
            </div>
          </div>
        )}

        {subscription.status === 'active' && subscription.hasFullAccess && (
          <div className="flex items-start gap-3 mb-5 p-4 rounded-xl" style={{ background: 'var(--primary-soft)' }}>
            <CheckCircle2 size={20} style={{ color: 'var(--primary)' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                Langganan aktif
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--ink-soft)' }}>
                Berlaku sampai{' '}
                {subscription.currentPeriodEnd &&
                  new Date(subscription.currentPeriodEnd).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
              </p>
            </div>
          </div>
        )}

        {!subscription.hasFullAccess && (
          <div className="flex items-start gap-3 mb-5 p-4 rounded-xl" style={{ background: '#fdeeee' }}>
            <XCircle size={20} style={{ color: 'var(--danger)' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--danger)' }}>
                Langganan tidak aktif
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--ink-soft)' }}>
                Fitur dibatasi: 1 chat/hari (maks 8 kata), tidak bisa edit/hapus transaksi, tidak bisa export Excel.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between p-5 rounded-xl border mb-4" style={{ borderColor: 'var(--border)' }}>
          <div>
            <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
              Langganan Bulanan
            </p>
            <p className="text-3xl font-bold" style={{ color: 'var(--ink)' }}>
              Rp15.000
              <span className="text-sm font-normal" style={{ color: 'var(--ink-soft)' }}>
                {' '}
                / 30 hari
              </span>
            </p>
          </div>
        </div>

        <ul className="text-sm space-y-2 mb-5" style={{ color: 'var(--ink-soft)' }}>
          <li>✓ Chat tanpa batas kata & tanpa batas harian</li>
          <li>✓ Edit & hapus transaksi bebas</li>
          <li>✓ Export ke Excel kapan saja</li>
          <li>✓ Semua fitur dashboard & grafik</li>
        </ul>

        {error && (
          <p className="text-sm mb-3" style={{ color: 'var(--danger)' }}>
            {error}
          </p>
        )}

        <button
          onClick={handlePay}
          disabled={loading || !scriptReady}
          className="btn-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          {subscription.hasFullAccess ? 'Perpanjang Sekarang' : 'Bayar Sekarang'}
        </button>
      </div>
    </>
  )
}
