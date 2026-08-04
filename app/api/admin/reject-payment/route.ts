import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAdmin = !!user && !!process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL
  if (!isAdmin) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 })
  }

  const { requestId } = await request.json()
  if (!requestId) {
    return NextResponse.json({ error: 'requestId wajib diisi' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: paymentRequest, error: fetchErr } = await admin
    .from('payment_requests')
    .select('id, user_id, status, status_snapshot, period_end_snapshot')
    .eq('id', requestId)
    .single()

  if (fetchErr || !paymentRequest) {
    return NextResponse.json({ error: 'Permintaan pembayaran tidak ditemukan' }, { status: 404 })
  }
  if (paymentRequest.status !== 'pending') {
    return NextResponse.json({ error: 'Permintaan ini sudah pernah diproses' }, { status: 400 })
  }

  // Balikin subscription ke kondisi SEBELUM optimistic activation
  // (kondisi yang di-snapshot pas user upload bukti)
  const { error: subErr } = await admin
    .from('subscriptions')
    .update({
      status: paymentRequest.status_snapshot ?? 'expired',
      current_period_end: paymentRequest.period_end_snapshot,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', paymentRequest.user_id)

  if (subErr) {
    return NextResponse.json({ error: 'Gagal membatalkan akses: ' + subErr.message }, { status: 500 })
  }

  // Tandai request ini ditolak + user belum dikasih tau (buat munculin notifikasi di app)
  const { error } = await admin
    .from('payment_requests')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString(), user_notified: false })
    .eq('id', requestId)

  if (error) {
    return NextResponse.json({ error: 'Gagal menolak: ' + error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
