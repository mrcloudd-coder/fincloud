import { createClient } from '@/lib/supabase/server'
import { getSubscriptionInfo } from '@/lib/subscription'
import BillingCard from './billing-card'

export default async function BillingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const subscription = await getSubscriptionInfo(supabase, user.id)

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-1">Langganan</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--ink-soft)' }}>
        Kelola status langganan Catatan Keuangan AI kamu.
      </p>

      <BillingCard subscription={subscription} />
    </div>
  )
}
