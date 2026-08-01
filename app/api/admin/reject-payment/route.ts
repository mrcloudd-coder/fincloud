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

  const { error } = await admin
    .from('payment_requests')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('status', 'pending')

  if (error) {
    return NextResponse.json({ error: 'Gagal menolak: ' + error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
