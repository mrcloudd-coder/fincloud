import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSnapTransaction } from '@/lib/midtrans'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Belum login' }, { status: 401 })
  }

  // order_id harus unik tiap transaksi & maksimal 50 karakter (limit Midtrans).
  // UUID user (36 karakter) sudah makan banyak jatah, jadi timestamp dipakai
  // dalam format base36 (lebih pendek) alih-alih angka desimal biasa.
  const orderId = `sub-${user.id}-${Date.now().toString(36)}`

  try {
    const snap = await createSnapTransaction(orderId, user.email ?? '')
    return NextResponse.json({ token: snap.token, orderId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal membuat transaksi pembayaran'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
