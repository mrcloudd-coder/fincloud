import { SupabaseClient } from '@supabase/supabase-js'

export type SubscriptionInfo = {
  hasFullAccess: boolean
  status: 'trialing' | 'active' | 'expired' | 'none'
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  daysLeftInTrial: number | null
}

/**
 * Ambil status subscription user dan tentukan apakah dia punya akses penuh
 * (masih dalam masa trial 7 hari ATAU subscription-nya aktif).
 */
export async function getSubscriptionInfo(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string
): Promise<SubscriptionInfo> {
  const { data } = await supabase
    .from('subscriptions')
    .select('status, trial_ends_at, current_period_end')
    .eq('user_id', userId)
    .single()

  if (!data) {
    return { hasFullAccess: false, status: 'none', trialEndsAt: null, currentPeriodEnd: null, daysLeftInTrial: null }
  }

  const now = new Date()
  const trialEndsAt = data.trial_ends_at ? new Date(data.trial_ends_at) : null
  const currentPeriodEnd = data.current_period_end ? new Date(data.current_period_end) : null

  const isTrialing = data.status === 'trialing' && trialEndsAt !== null && trialEndsAt > now
  const isActive = data.status === 'active' && currentPeriodEnd !== null && currentPeriodEnd > now

  let daysLeftInTrial: number | null = null
  if (isTrialing && trialEndsAt) {
    daysLeftInTrial = Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  }

  return {
    hasFullAccess: isTrialing || isActive,
    status: data.status,
    trialEndsAt: data.trial_ends_at,
    currentPeriodEnd: data.current_period_end,
    daysLeftInTrial,
  }
}

// Batasan untuk user yang belum/tidak berlangganan (setelah trial habis)
export const FREE_TIER_LIMITS = {
  maxChatPerDay: 1,
  maxWordsPerChat: 8,
}
