import { NextRequest, NextResponse } from 'next/server'
import { verifyMidtransSignature, SUBSCRIPTION_DAYS } from '@/lib/midtrans'
import { createAdminClient } from '@/lib/supabase/admin'

// Biar endpoint ini bisa dicek "hidup/reachable" via GET (beberapa tool
// verifikasi webhook ngecek pakai GET dulu sebelum kirim POST beneran).
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}

export async function POST(req: NextRequest) {
  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    // Body kosong/bukan JSON (misal test ping) — tetap balas 200 supaya
    // Midtrans tidak menganggap endpoint ini error.
    return NextResponse.json({ received: true })
  }

  const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = payload as {
    order_id?: string
    status_code?: string
    gross_amount?: string
    signature_key?: string
    transaction_status?: string
    fraud_status?: string
  }

  // Kalau payload tidak lengkap (misal request test dari dashboard Midtrans),
  // tetap balas 200 OK — jangan dianggap error, cuma tidak diproses lebih lanjut.
  if (!order_id || !status_code || !gross_amount || !signature_key) {
    return NextResponse.json({ received: true, note: 'Payload tidak lengkap, diabaikan.' })
  }

  // Pastikan notifikasi ini beneran dari Midtrans, bukan dipalsukan.
  // Kalau signature tidak valid, tetap balas 200 (supaya tidak retry terus),
  // tapi TIDAK mengubah data apapun.
  const isValid = await verifyMidtransSignature({ order_id, status_code, gross_amount, signature_key })
  if (!isValid) {
    return NextResponse.json({ received: true, note: 'Signature tidak valid, diabaikan.' })
  }

  // order_id formatnya: sub-{userId}-{timestampBase36}
  const match = order_id.match(/^sub-(.+)-[a-z0-9]+$/)
  if (!match) {
    return NextResponse.json({ received: true, note: 'order_id tidak dikenali, diabaikan.' })
  }
  const userId = match[1]

  const isPaymentSuccess =
    transaction_status === 'settlement' || (transaction_status === 'capture' && fraud_status === 'accept')

  if (isPaymentSuccess) {
    const supabaseAdmin = createAdminClient()

    // Ambil current_period_end yang lama (kalau masih ada & belum lewat),
    // supaya kalau user bayar lebih awal, sisa harinya nggak hangus.
    const { data: existing } = await supabaseAdmin
      .from('subscriptions')
      .select('current_period_end')
      .eq('user_id', userId)
      .single()

    const now = new Date()
    const existingEnd = existing?.current_period_end ? new Date(existing.current_period_end) : null
    const baseDate = existingEnd && existingEnd > now ? existingEnd : now
    const newPeriodEnd = new Date(baseDate.getTime() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000)

    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_end: newPeriodEnd.toISOString(),
        midtrans_order_id: order_id,
        updated_at: now.toISOString(),
      })
      .eq('user_id', userId)
  }

  return NextResponse.json({ received: true })
}
