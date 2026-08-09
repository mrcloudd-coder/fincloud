import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Belum login' }, { status: 401 })
  }

  const admin = createAdminClient()
  await admin
    .from('payment_requests')
    .update({ user_notified: true })
    .eq('user_id', user.id)
    .eq('status', 'rejected')
    .eq('user_notified', false)

  return NextResponse.json({ success: true })
}
