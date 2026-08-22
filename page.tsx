import { createClient } from '@/lib/supabase/server'
import DashboardCharts from './charts'
import IncomeManager from './income-manager'
import AnnualCharts from './annual-charts'
import DashboardInteractive from './dashboard-interactive'
import RangeFilter from './range-filter'
import Link from 'next/link'
import { getSubscriptionInfo } from '@/lib/subscription'
import { Clock, AlertTriangle } from 'lucide-react'

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; viewMonth?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const subscription = await getSubscriptionInfo(supabase, user.id)
  const params = await searchParams

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const yearStart = `${now.getFullYear()}-01-01`
  const yearEnd = `${now.getFullYear()}-12-31`

  // ==== Bulan yang lagi "dibuka" di kartu kalender ====
  // Kalau nggak ada param viewMonth, dianggap mode akumulasi & kalender nampilin bulan sekarang.
  const isAccumulated = !params.viewMonth
  let viewedYear = now.getFullYear()
  let viewedMonth = now.getMonth() // 0-indexed
  if (params.viewMonth) {
    const [vy, vm] = params.viewMonth.split('-').map(Number)
    viewedYear = vy
    viewedMonth = vm - 1
  }
  const viewedMonthStart = new Date(viewedYear, viewedMonth, 1).toISOString().slice(0, 10)
  const viewedMonthEnd = new Date(viewedYear, viewedMonth + 1, 0).toISOString().slice(0, 10)

  // Rentang buat "Transaksi Terbaru" + chart kategori. Prioritas:
  // 1) Dropdown "Dari bulan..." (params.from) kalau lagi dipakai — dari bulan itu sampai sekarang
  // 2) Kalau nggak, ikut bulan yang lagi dibuka di kalender (viewMonth / default bulan sekarang)
  let rangeStart: string
  let rangeEnd: string | null // null = nggak dibatasi (nyampe sekarang)
  let rangeLabel: string
  if (params.from) {
    const [y, m] = params.from.split('-').map(Number)
    rangeStart = new Date(y, m - 1, 1).toISOString().slice(0, 10)
    rangeEnd = null
    rangeLabel = `${MONTH_NAMES[m - 1]} ${y} - sekarang`
  } else {
    rangeStart = viewedMonthStart
    rangeEnd = viewedMonthEnd
    rangeLabel = `${MONTH_NAMES[viewedMonth]} ${viewedYear}`
  }

  const [
    { data: allIncome },
    { data: allTransactions },
    { data: viewedIncome },
    { data: viewedTransactions },
    { data: thisMonthIncomeData },
    { data: thisMonthExpenseData },
    { data: rangeTransactionsRaw },
    { data: categories },
    { data: accounts },
    { data: yearTransactions },
    { data: yearIncome },
  ] = await Promise.all([
    // All-time — buat mode akumulasi
    supabase.from('income').select('id, amount, source, date, account_id').eq('user_id', user.id).order('date', { ascending: false }),
    supabase.from('transactions').select('id, amount, date, account_id').eq('user_id', user.id),
    // Data bulan yang lagi dibuka di kalender — buat mode bulan spesifik + titik kalender
    supabase.from('income').select('amount, date, account_id').eq('user_id', user.id).gte('date', viewedMonthStart).lte('date', viewedMonthEnd),
    supabase.from('transactions').select('amount, date, account_id').eq('user_id', user.id).gte('date', viewedMonthStart).lte('date', viewedMonthEnd),
    // Budget bar SELALU bulan kalender beneran (nggak ikut navigasi apapun)
    supabase.from('income').select('amount, date').eq('user_id', user.id).gte('date', startOfMonth),
    supabase.from('transactions').select('amount, date').eq('user_id', user.id).gte('date', startOfMonth),
    // Chart kategori & tabel riwayat — ikut prioritas from > viewMonth > bulan sekarang
    (() => {
      let q = supabase
        .from('transactions')
        .select('id, item, amount, date, account_id, category:categories(name, color)')
        .eq('user_id', user.id)
        .gte('date', rangeStart)
      if (rangeEnd) q = q.lte('date', rangeEnd)
      return q.order('date', { ascending: false }).order('created_at', { ascending: false })
    })(),
    supabase.from('categories').select('id, name').order('name'),
    supabase.from('accounts').select('id, name, color').order('name'),
    supabase.from('transactions').select('amount, date').eq('user_id', user.id).gte('date', yearStart).lte('date', yearEnd),
    supabase.from('income').select('amount, date').eq('user_id', user.id).gte('date', yearStart).lte('date', yearEnd),
  ])
  const rangeTransactions = rangeTransactionsRaw

  const monthlyExpense = Array(12).fill(0)
  const monthlyIncome = Array(12).fill(0)
  for (const t of yearTransactions ?? []) {
    monthlyExpense[new Date(t.date).getMonth()] += Number(t.amount)
  }
  for (const i of yearIncome ?? []) {
    monthlyIncome[new Date(i.date).getMonth()] += Number(i.amount)
  }
  const annualChartData = MONTH_NAMES.map((name, i) => ({
    name: name.slice(0, 3),
    Pemasukan: monthlyIncome[i],
    Pengeluaran: monthlyExpense[i],
  }))

  // Saldo all-time (mode akumulasi)
  const totalIncomeAllTime = (allIncome ?? []).reduce((sum, i) => sum + Number(i.amount), 0)
  const totalExpenseAllTime = (allTransactions ?? []).reduce((sum, t) => sum + Number(t.amount), 0)

  // Saldo khusus bulan yang lagi dibuka (mode bulan spesifik)
  const totalIncomeViewed = (viewedIncome ?? []).reduce((sum, i) => sum + Number(i.amount), 0)
  const totalExpenseViewed = (viewedTransactions ?? []).reduce((sum, t) => sum + Number(t.amount), 0)

  // Kartu kalender pakai salah satu tergantung mode
  const summaryMetrics = isAccumulated
    ? { saldo: totalIncomeAllTime - totalExpenseAllTime, pemasukan: totalIncomeAllTime, pengeluaran: totalExpenseAllTime }
    : { saldo: totalIncomeViewed - totalExpenseViewed, pemasukan: totalIncomeViewed, pengeluaran: totalExpenseViewed }

  // Saldo per rekening — ikut mode yang sama
  const accountBalances = (accounts ?? []).map((acc) => {
    if (isAccumulated) {
      const accIncome = (allIncome ?? []).filter((i) => i.account_id === acc.id).reduce((sum, i) => sum + Number(i.amount), 0)
      const accExpense = (allTransactions ?? []).filter((t) => t.account_id === acc.id).reduce((sum, t) => sum + Number(t.amount), 0)
      return { id: acc.id, name: acc.name, color: acc.color, balance: accIncome - accExpense }
    }
    const accIncome = (viewedIncome ?? []).filter((i) => i.account_id === acc.id).reduce((sum, i) => sum + Number(i.amount), 0)
    const accExpense = (viewedTransactions ?? []).filter((t) => t.account_id === acc.id).reduce((sum, t) => sum + Number(t.amount), 0)
    return { id: acc.id, name: acc.name, color: acc.color, balance: accIncome - accExpense }
  })

  // Titik pengeluaran di grid kalender — selalu dari bulan yang lagi dibuka
  const dailyTotals: Record<string, number> = {}
  for (const t of viewedTransactions ?? []) {
    dailyTotals[t.date] = (dailyTotals[t.date] ?? 0) + Number(t.amount)
  }

  const yearOptions = Array.from({ length: 5 }).map((_, i) => now.getFullYear() - i)

  // Budget bulan ini (selalu bulan kalender beneran, nggak ikut navigasi apapun)
  const thisMonthIncome = (thisMonthIncomeData ?? []).reduce((sum, i) => sum + Number(i.amount), 0)
  const thisMonthExpense = (thisMonthExpenseData ?? []).reduce((sum, t) => sum + Number(t.amount), 0)

  // Chart kategori & tabel riwayat — ikut filter RangeFilter
  const byCategory: Record<string, { name: string; value: number; color: string }> = {}
  for (const t of rangeTransactions ?? []) {
    const cat = Array.isArray(t.category) ? t.category[0] : t.category
    const name = cat?.name ?? 'Lainnya'
    const color = cat?.color ?? '#6b7280'
    if (!byCategory[name]) byCategory[name] = { name, value: 0, color }
    byCategory[name].value += Number(t.amount)
  }

  const previewRows = (rangeTransactions ?? []).slice(0, 15)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-1">Beranda</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--ink-soft)' }}>
        {now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
      </p>

      {subscription.status === 'trialing' && subscription.hasFullAccess && (
        <Link
          href="/billing"
          className="flex items-center gap-3 mb-6 p-4 rounded-xl"
          style={{ background: 'var(--primary-soft)' }}
        >
          <Clock size={18} style={{ color: 'var(--primary)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
            Masa coba gratis: {subscription.daysLeftInTrial} hari lagi — klik untuk lihat detail langganan
          </p>
        </Link>
      )}

      {!subscription.hasFullAccess && (
        <Link
          href="/billing"
          className="flex items-center gap-3 mb-6 p-4 rounded-xl"
          style={{ background: '#3a1f1e' }}
        >
          <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--danger)' }}>
            Langganan tidak aktif — fitur dibatasi. Klik untuk berlangganan lagi.
          </p>
        </Link>
      )}

      <DashboardInteractive
        metrics={summaryMetrics}
        accounts={accountBalances}
        isAccumulated={isAccumulated}
        dailyTotals={dailyTotals}
        viewedYear={viewedYear}
        viewedMonth={viewedMonth}
        yearOptions={yearOptions}
        categories={categories ?? []}
      />

      <div className="card p-5 mb-4">
        <IncomeManager incomeList={allIncome ?? []} accounts={accounts ?? []} />
      </div>

      <div className="mb-4">
        <DashboardCharts
          categoryData={Object.values(byCategory)}
          monthlyIncome={thisMonthIncome}
          monthlyExpense={thisMonthExpense}
          rangeLabel={rangeLabel}
        />
      </div>

      <div className="mb-6">
        <AnnualCharts data={annualChartData} year={now.getFullYear()} />
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="text-sm font-medium">Transaksi terbaru</h2>
          <div className="flex items-center gap-2">
            <RangeFilter selected={params.from ?? null} />
            <Link href="/transactions" className="text-xs font-medium whitespace-nowrap" style={{ color: 'var(--primary)' }}>
              Lihat semua →
            </Link>
          </div>
        </div>
        {previewRows.length === 0 ? (
          <p className="text-sm py-6 text-center" style={{ color: 'var(--ink-soft)' }}>
            Belum ada transaksi di periode ini
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left" style={{ background: 'var(--bg)' }}>
                  <th className="px-3 py-2 font-medium text-xs" style={{ color: 'var(--ink-soft)' }}>Tanggal</th>
                  <th className="px-3 py-2 font-medium text-xs" style={{ color: 'var(--ink-soft)' }}>Item</th>
                  <th className="px-3 py-2 font-medium text-xs" style={{ color: 'var(--ink-soft)' }}>Kategori</th>
                  <th className="px-3 py-2 font-medium text-xs text-right" style={{ color: 'var(--ink-soft)' }}>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((t) => {
                  const cat = Array.isArray(t.category) ? t.category[0] : t.category
                  return (
                    <tr key={t.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-3 py-2 text-xs">{t.item}</td>
                      <td className="px-3 py-2 text-xs">
                        <span
                          className="px-2 py-0.5 rounded-full"
                          style={{ background: (cat?.color ?? '#6b7280') + '20', color: cat?.color ?? '#6b7280' }}
                        >
                          {cat?.name ?? 'Lainnya'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-right whitespace-nowrap">Rp{Number(t.amount).toLocaleString('id-ID')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
