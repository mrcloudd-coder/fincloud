'use client'

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

function formatShort(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`
  if (value >= 1_000) return `${Math.round(value / 1_000)}rb`
  return String(value)
}

export default function ExpenseCalendar({
  dailyTotals,
  year,
  month, // 0-indexed (0 = Januari)
}: {
  dailyTotals: Record<string, number>
  year: number
  month: number
}) {
  const firstDayWeekday = new Date(year, month, 1).getDay() // 0 = Minggu
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

  const cells: (number | null)[] = [
    ...Array(firstDayWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Genapkan ke kelipatan 7 biar grid rapi
  while (cells.length % 7 !== 0) cells.push(null)

  const maxAmount = Math.max(1, ...Object.values(dailyTotals))

  return (
    <div className="card p-5">
      <h2 className="text-sm font-medium mb-3">
        📅 Kalender Pengeluaran —{' '}
        {new Date(year, month, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
      </h2>

      <div className="grid grid-cols-7 gap-1.5">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold pb-1" style={{ color: 'var(--ink-soft)' }}>
            {d}
          </div>
        ))}

        {cells.map((day, i) => {
          if (day === null) return <div key={i} />

          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const amount = dailyTotals[dateKey] ?? 0
          const isToday = isCurrentMonth && today.getDate() === day
          const intensity = amount > 0 ? Math.min(1, amount / maxAmount) : 0

          return (
            <div
              key={i}
              className="aspect-square rounded-lg flex flex-col items-center justify-center px-0.5"
              style={{
                background: amount > 0 ? `rgba(15,102,80,${0.08 + intensity * 0.22})` : 'var(--bg)',
                border: isToday ? '2px solid var(--primary)' : '1px solid transparent',
              }}
              title={amount > 0 ? `Rp${amount.toLocaleString('id-ID')}` : undefined}
            >
              <span
                className="text-xs font-semibold"
                style={{ color: isToday ? 'var(--primary)' : 'var(--ink)' }}
              >
                {day}
              </span>
              {amount > 0 && (
                <span className="text-[10px] font-medium leading-none mt-0.5" style={{ color: 'var(--primary)' }}>
                  {formatShort(amount)}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
