import { createClient } from '@/lib/supabase/server'
import { getSubscriptionInfo } from '@/lib/subscription'
import BillingCard from './billing-card'
import QrisPayment from './qris-payment'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

export default async function BillingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const subscription = await getSubscriptionInfo(supabase, user.id)

  const { data: pendingRequest } = await supabase
    .from('payment_requests')
    .select('id, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const isAdmin = !!process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-1">Langganan</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--ink-soft)' }}>
        Kelola status langganan FinCloud kamu.
      </p>

      <div className="flex flex-col gap-4">
        <QrisPayment pendingRequest={pendingRequest ?? null} />

        <details className="card p-5">
          <summary className="text-sm font-medium cursor-pointer" style={{ color: 'var(--ink-soft)' }}>
            Atau bayar otomatis pakai kartu/e-wallet
          </summary>
          <div className="mt-4">
            <BillingCard subscription={subscription} />
          </div>
        </details>

        {isAdmin && (
          <Link
            href="/admin/payments"
            className="flex items-center gap-2 text-xs font-medium justify-center py-2"
            style={{ color: 'var(--ink-soft)' }}
          >
            <ShieldCheck size={14} />
            Kelola konfirmasi pembayaran (admin)
          </Link>
        )}
      </div>
    </div>
  )
}
