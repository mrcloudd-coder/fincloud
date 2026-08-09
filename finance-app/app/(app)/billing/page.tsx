import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import QrisPayment from './qris-payment'
import AdminPaymentsClient from '../../admin/payments/client'

export default async function BillingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const isAdmin = !!process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL

  // === Tampilan ADMIN: langsung ke panel kelola langganan, bukan halaman bayar ===
  if (isAdmin) {
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
        <h1 className="text-xl font-semibold mb-1">Kelola Langganan</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--ink-soft)' }}>
          Review bukti transfer dari user, klik Aktifkan buat langsung aktifin langganan mereka.
        </p>

        <AdminPaymentsClient requests={enriched} />
      </div>
    )
  }

  // === Tampilan USER BIASA: halaman bayar seperti biasa ===
  const { data: pendingRequest } = await supabase
    .from('payment_requests')
    .select('id, status, created_at, user_notified')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-1">Langganan</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--ink-soft)' }}>
        Kelola status langganan FinCloud kamu.
      </p>

      <QrisPayment pendingRequest={pendingRequest ?? null} />
    </div>
  )
}
