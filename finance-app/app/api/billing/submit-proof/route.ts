import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SUBSCRIPTION_DAYS } from '@/lib/midtrans'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Belum login' }, { status: 401 })
  }

  const { proofPath } = await req.json()
  if (!proofPath || typeof proofPath !== 'string') {
    return NextResponse.json({ error: 'Bukti transfer tidak ditemukan' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Batasi 1 payment_request PENDING per user
  const { data: existingPending } = await admin
    .from('payment_requests')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (existingPending) {
    return NextResponse.json(
      { error: 'Kamu masih punya permintaan konfirmasi yang sedang diproses. Tunggu direview dulu ya.' },
      { status: 409 }
    )
  }

  // Snapshot status subscription SEBELUM diaktifkan, buat di-restore kalau nanti di-reject admin
  const { data: currentSub } = await admin
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', user.id)
    .single()

  const { error: insertErr } = await admin.from('payment_requests').insert({
    user_id: user.id,
    proof_path: proofPath,
    status: 'pending',
    status_snapshot: currentSub?.status ?? 'expired',
    period_end_snapshot: currentSub?.current_period_end ?? null,
    user_notified: true,
  })

  if (insertErr) {
    return NextResponse.json({ error: 'Gagal mengirim konfirmasi: ' + insertErr.message }, { status: 500 })
  }

  // === Optimistic Activation: langsung aktifkan akses penuh, admin review belakangan ===
  const now = new Date()
  const existingEnd = currentSub?.current_period_end ? new Date(currentSub.current_period_end) : null
  const baseDate = existingEnd && existingEnd > now ? existingEnd : now
  const newPeriodEnd = new Date(baseDate.getTime() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000)

  await admin
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_end: newPeriodEnd.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('user_id', user.id)

  return NextResponse.json({ success: true })
}
