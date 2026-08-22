'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Wallet, Plus } from 'lucide-react'

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

function formatShort(value: number) {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`
  if (abs >= 1_000) return `${Math.round(value / 1_000)}k`
  return String(value)
}
function formatFull(value: number) {
  return `Rp${value.toLocaleString('id-ID')}`
}

type AccountBalance = { id: string; name: string; color: string; balance: number }
type Metric = 'saldo' | 'pemasukan' | 'pengeluaran'

export default function SummaryCalendarCard({
  metrics,
  accounts,
  isAccumulated,
  dailyTotals,
  viewedYear,
  viewedMonth,
  yearOptions,
  onRecordHere,
}: {
  metrics: { saldo: number; pemasukan: number; pengeluaran: number }
  accounts: AccountBalance[]
  isAccumulated: boolean
  dailyTotals: Record<string, number>
  viewedYear: number
  viewedMonth: number // 0-indexed
  yearOptions: number[]
  onRecordHere: (dateKey: string) => void
}) {
  const router = useRouter()
  const [mainMetric, setMainMetric] = useState<Metric>('saldo')
  const [showYearPicker, setShowYearPicker] = useState(false)
  const [selectedEmptyDay, setSelectedEmptyDay] = useState<string | null>(null)

  const metricLabels: Record<Metric, string> = {
    saldo: isAccumulated ? 'Sisa Saldo (Akumulasi)' : `Sisa Bulan ${MONTH_NAMES[viewedMonth]}`,
    pemasukan: 'Pemasukan',
    pengeluaran: 'Pengeluaran',
  }
  const metricValues: Record<Metric, number> = {
    saldo: metrics.saldo,
    pemasukan: metrics.pemasukan,
    pengeluaran: metrics.pengeluaran,
  }
  const otherMetrics = (['saldo', 'pemasukan', 'pengeluaran'] as Metric[]).filter((m) => m !== mainMetric)

  function formatMain(m: Metric, value: number) {
    if (m === 'pengeluaran') return `-${formatFull(value)}`
    if (m === 'pemasukan') return `+${formatFull(value)}`
    return formatFull(value)
  }

  function navigateToMonth(year: number, monthIdx: number) {
    const val = `${year}-${String(monthIdx + 1).padStart(2, '0')}`
    router.push(`/dashboard?viewMonth=${val}`)
    setShowYearPicker(false)
  }

  function handlePrev() {
    const d = new Date(viewedYear, viewedMonth - 1, 1)
    navigateToMonth(d.getFullYear(), d.getMonth())
  }
  function handleNext() {
    const d = new Date(viewedYear, viewedMonth + 1, 1)
    navigateToMonth(d.getFullYear(), d.getMonth())
  }
  function handleToday() {
    router.push('/dashboard')
    setShowYearPicker(false)
  }

  // ==== Kalender grid ====
  const firstDayWeekday = new Date(viewedYear, viewedMonth, 1).getDay()
  const daysInMonth = new Date(viewedYear, viewedMonth + 1, 0).getDate()
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === viewedYear && today.getMonth() === viewedMonth

  const cells: (number | null)[] = [
    ...Array(firstDayWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* ===== Panel kiri: ringkasan + rekening ===== */}
        <div
          className="sm:w-[280px] flex-shrink-0 p-5 relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #1fae7d 0%, #0f5e42 100%)' }}
        >
          <div
            className="absolute rounded-full pointer-events-none"
            style={{ width: 160, height: 160, top: -60, right: -50, background: 'rgba(255,255,255,0.06)' }}
          />

          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {metricLabels[mainMetric]}
            </p>
            <p className="text-3xl font-extrabold text-white mt-0.5 leading-tight break-all">
              {formatMain(mainMetric, metricValues[mainMetric])}
            </p>
          </div>

          <div className="flex gap-2 mt-4 relative">
            {otherMetrics.map((m) => (
              <button
                key={m}
                onClick={() => setMainMetric(m)}
                className="flex-1 rounded-lg px-2.5 py-2 text-left"
                style={{ background: 'rgba(255,255,255,0.95)' }}
              >
                <p className="text-[9px] font-extrabold uppercase tracking-wide" style={{ color: '#1fae7d' }}>
                  {m === 'saldo' ? 'Saldo' : m}
                </p>
                <p className="text-[13px] font-extrabold" style={{ color: '#0b3a2a' }}>
                  {formatShort(metricValues[m])}
                </p>
              </button>
            ))}
          </div>

          {accounts.length > 0 && (
            <div className="mt-5 relative">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Rekening
              </p>
              <div className="grid grid-cols-2 gap-1.5 max-h-[180px] overflow-y-auto pr-0.5">
                {accounts.map((acc) => (
                  <>
                    <div
                      key={acc.id + '-name'}
                      className="rounded-lg px-2.5 py-2 flex items-center gap-1.5 min-w-0"
                      style={{ background: 'rgba(255,255,255,0.95)' }}
                    >
                      <Wallet size={11} style={{ color: acc.color, flexShrink: 0 }} />
                      <span className="text-[11px] font-extrabold truncate" style={{ color: '#0b3a2a' }}>
                        {acc.name}
                      </span>
                    </div>
                    <div
                      key={acc.id + '-val'}
                      className="rounded-lg px-2.5 py-2 flex items-center justify-end"
                      style={{ background: 'rgba(255,255,255,0.95)' }}
                    >
                      <span className="text-[11px] font-extrabold" style={{ color: '#1fae7d' }}>
                        {formatShort(acc.balance)}
                      </span>
                    </div>
                  </>
                ))}
              </div>
              {accounts.length > 4 && (
                <p className="text-center text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  ˅ scroll
                </p>
              )}
            </div>
          )}
        </div>

        {/* ===== Panel kanan: kalender ===== */}
        <div className="flex-1 p-5">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrev}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--surface2)', color: 'var(--ink-soft)' }}
            >
              <ChevronLeft size={15} />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowYearPicker(!showYearPicker)}
                className="text-sm font-extrabold"
              >
                {MONTH_NAMES[viewedMonth]} {viewedYear}
              </button>
              {showYearPicker && (
                <div
                  className="absolute top-8 left-1/2 -translate-x-1/2 z-10 rounded-xl p-1.5 flex flex-col gap-0.5 shadow-lg"
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
                >
                  {yearOptions.map((y) => (
                    <button
                      key={y}
                      onClick={() => navigateToMonth(y, viewedMonth)}
                      className="text-xs font-semibold px-4 py-1.5 rounded-lg whitespace-nowrap text-left"
                      style={{
                        background: y === viewedYear ? 'var(--primary-soft)' : 'transparent',
                        color: y === viewedYear ? 'var(--primary)' : 'var(--ink)',
                      }}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isAccumulated && (
                <button
                  onClick={handleToday}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                >
                  Hari Ini
                </button>
              )}
              <button
                onClick={handleNext}
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--surface2)', color: 'var(--ink-soft)' }}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold pb-1" style={{ color: 'var(--ink-soft)' }}>
                {d}
              </div>
            ))}

            {cells.map((day, i) => {
              if (day === null) return <div key={i} />

              const dateKey = `${viewedYear}-${String(viewedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const amount = dailyTotals[dateKey] ?? 0
              const isToday = isCurrentMonth && today.getDate() === day
              const hasExpense = amount > 0

              if (hasExpense) {
                return (
                  <Link
                    key={i}
                    href={`/transactions?date=${dateKey}`}
                    className="aspect-square flex items-center justify-center relative"
                    style={{
                      borderRadius: '45% 45% 50% 50% / 55% 55% 45% 45%',
                      background: 'linear-gradient(160deg, #1c3a30 0%, #164030 100%)',
                      boxShadow: isToday ? '0 0 0 2px var(--primary)' : 'none',
                    }}
                    title={`${formatFull(amount)} — klik buat lihat riwayat tanggal ini`}
                  >
                    <span className="absolute top-0.5 left-1 text-[8px] opacity-50">☁️</span>
                    <span className="font-extrabold leading-none px-0.5 text-center" style={{ color: 'var(--primary)', fontSize: '11px' }}>
                      -{formatShort(amount)}
                    </span>
                  </Link>
                )
              }

              const isSelected = selectedEmptyDay === dateKey

              return (
                <div key={i} className="relative">
                  <button
                    type="button"
                    onClick={() => setSelectedEmptyDay(isSelected ? null : dateKey)}
                    className="aspect-square rounded-lg flex items-center justify-center w-full"
                    style={{
                      background: isSelected ? 'var(--primary-soft)' : 'var(--surface2)',
                      border: isSelected ? '2px solid var(--primary)' : isToday ? '2px solid var(--primary)' : '1px solid transparent',
                    }}
                  >
                    <span className="text-[11px]" style={{ color: isSelected || isToday ? 'var(--primary)' : 'var(--ink-soft)' }}>
                      {day}
                    </span>
                  </button>

                  {isSelected && (
                    <div
                      className="absolute z-20 top-full mt-1 left-1/2 -translate-x-1/2 rounded-xl p-2 shadow-lg"
                      style={{ background: 'var(--surface2)', border: '1px solid var(--border)', width: '150px' }}
                    >
                      <p className="text-[10px] mb-1.5" style={{ color: 'var(--ink-soft)' }}>
                        Belum ada pengeluaran
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          onRecordHere(dateKey)
                          setSelectedEmptyDay(null)
                        }}
                        className="w-full flex items-center justify-center gap-1 text-[10px] font-bold py-1.5 rounded-lg"
                        style={{ background: 'var(--primary)', color: '#0b3a2a' }}
                      >
                        <Plus size={11} />
                        Catat di sini
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
