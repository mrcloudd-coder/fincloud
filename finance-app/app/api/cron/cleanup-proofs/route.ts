import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Dipanggil otomatis tiap hari oleh Vercel Cron Job (lihat vercel.json).
// Menghapus TOTAL (foto di storage + baris data) payment_requests yang sudah
// direview (approved/rejected) lebih dari 7 hari lalu. Yang masih 'pending'
// tidak pernah dihapus otomatis.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 })
  }

  const admin = createAdminClient()
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: expired, error: fetchErr } = await admin
    .from('payment_requests')
    .select('id, proof_path')
    .in('status', ['approved', 'rejected'])
    .lt('reviewed_at', cutoff)

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }

  if (!expired || expired.length === 0) {
    return NextResponse.json({ deleted: 0 })
  }

  // Hapus foto-fotonya dari storage
  const paths = expired.map((r) => r.proof_path)
  await admin.storage.from('payment-proofs').remove(paths)

  // Hapus baris datanya juga (total, tanpa jejak)
  const ids = expired.map((r) => r.id)
  await admin.from('payment_requests').delete().in('id', ids)

  return NextResponse.json({ deleted: expired.length })
}
