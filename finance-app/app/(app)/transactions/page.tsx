import { createClient } from '@/lib/supabase/server'
import TransactionsTable from './table'
import { getSubscriptionInfo } from '@/lib/subscription'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; day?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const subscription = await getSubscriptionInfo(supabase, user.id)

  const params = await searchParams
  const now = new Date()
  const selectedYear = Number(params.year) || now.getFullYear()
  const selectedMonth = Number(params.month) || now.getMonth() + 1
  const selectedDay = params.day ? Number(params.day) : null

  const startDate = selectedDay
    ? new Date(selectedYear, selectedMonth - 1, selectedDay).toISOString().slice(0, 10)
    : new Date(selectedYear, selectedMonth - 1, 1).toISOString().slice(0, 10)
  const endDate = selectedDay
    ? startDate
    : new Date(selectedYear, selectedMonth, 0).toISOString().slice(0, 10)

  const [{ data: transactions }, { data: categories }, { data: accounts }] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, item, amount, date, category:categories(id, name, color), account:accounts(id, name, color)')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('id, name, color').order('name'),
    supabase.from('accounts').select('id, name, color').order('name'),
  ])

  // Pilihan tahun: 4 tahun ke belakang sampai tahun sekarang
  const yearOptions = Array.from({ length: 5 }).map((_, i) => now.getFullYear() - i)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-1">Riwayat pengeluaran</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--ink-soft)' }}>
        Lihat transaksi per bulan, edit atau export ke Excel.
      </p>

      {selectedDay && (
        <div
          className="flex items-center justify-between gap-3 mb-6 p-3.5 rounded-xl"
          style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
            📅 Menampilkan tanggal {selectedDay} {MONTH_NAMES[selectedMonth - 1]} {selectedYear} saja
          </p>
          <Link
            href={`/transactions?year=${selectedYear}&month=${selectedMonth}`}
            className="text-xs font-bold underline flex-shrink-0"
            style={{ color: 'var(--accent)' }}
          >
            Lihat semua bulan ini
          </Link>
        </div>
      )}

      {!subscription.hasFullAccess && (
        <Link
          href="/billing"
          className="flex items-center gap-3 mb-6 p-4 rounded-xl"
          style={{ background: 'var(--danger-soft)' }}
        >
          <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--danger)' }}>
            Langganan tidak aktif — edit, hapus, dan export dinonaktifkan. Klik untuk berlangganan.
          </p>
        </Link>
      )}

      <TransactionsTable
        initialTransactions={transactions ?? []}
        categories={categories ?? []}
        accounts={accounts ?? []}
        monthNames={MONTH_NAMES}
        yearOptions={yearOptions}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        hasFullAccess={subscription.hasFullAccess}
      />
    </div>
  )
}
