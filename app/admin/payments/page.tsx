import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AdminPaymentsClient from './client'

export default async function AdminPaymentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAdmin = !!user && !!process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL
  if (!isAdmin) {
    redirect('/dashboard')
  }

  const admin = createAdminClient()

  const { data: requests } = await admin
    .from('payment_requests')
    .select('id, user_id, proof_path, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  const enriched = await Promise.all(
    (requests ?? []).map(async (r) => {
      const [{ data: userData }, { data: signed }] = await Promise.all([
        admin.auth.admin.getUserById(r.user_id),
        admin.storage.from('payment-proofs').createSignedUrl(r.proof_path, 600),
      ])
      return {
        id: r.id,
        status: r.status as 'pending' | 'approved' | 'rejected',
        createdAt: r.created_at,
        email: userData.user?.email ?? '(email tidak ditemukan)',
        proofUrl: signed?.signedUrl ?? null,
      }
    })
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-1">Konfirmasi Pembayaran</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--ink-soft)' }}>
        Review bukti transfer, klik Aktifkan buat langsung aktifin langganan user.
      </p>

      <AdminPaymentsClient requests={enriched} />
    </div>
  )
}
