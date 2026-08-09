import { redirect } from 'next/navigation'

// Halaman kelola pembayaran sekarang menyatu di /billing (khusus admin).
// Redirect ke sana biar nggak ada 2 alamat buat hal yang sama.
export default function AdminPaymentsPage() {
  redirect('/billing')
}
