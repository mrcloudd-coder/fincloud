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
    .select('id, status')
    .eq('id', requestId)
    .single()

  if (fetchErr || !paymentRequest) {
    return NextResponse.json({ error: 'Permintaan pembayaran tidak ditemukan' }, { status: 404 })
  }
  if (paymentRequest.status !== 'pending') {
    return NextResponse.json({ error: 'Permintaan ini sudah pernah diproses' }, { status: 400 })
  }

  // Subscription-nya UDAH aktif dari sejak user upload bukti (Optimistic Activation),
  // jadi di sini tinggal konfirmasi statusnya doang, tidak perlu ubah subscriptions lagi.
  const { error: updateErr } = await admin
    .from('payment_requests')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', requestId)

  if (updateErr) {
    return NextResponse.json({ error: 'Gagal update status: ' + updateErr.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
