'use client'

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

function formatShort(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`
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
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="card p-5">
      <h2 className="text-sm font-medium mb-3 flex items-center gap-1.5">
        ☁️ Kalender Pengeluaran —{' '}
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
          const hasExpense = amount > 0

          if (hasExpense) {
            // Hari ada pengeluaran: bentuk kayak awan, angka jadi fokus utama, tanpa tanggal
            return (
              <div
                key={i}
                className="aspect-square flex items-center justify-center relative"
                style={{
                  borderRadius: '45% 45% 50% 50% / 55% 55% 45% 45%',
                  background: 'linear-gradient(160deg, #cfe8de 0%, #a9d4c4 100%)',
                  boxShadow: isToday ? '0 0 0 2px var(--primary)' : 'inset 0 -2px 4px rgba(15,102,80,0.12)',
                }}
                title={`Rp${amount.toLocaleString('id-ID')}`}
              >
                <span className="absolute top-0.5 left-1 text-[9px] opacity-60">☁️</span>
                <span
                  className="font-extrabold leading-none px-0.5 text-center"
                  style={{ color: 'var(--green-dark, #0b4f3d)', fontSize: '13px' }}
                >
                  {formatShort(amount)}
                </span>
              </div>
            )
          }

          // Hari tanpa pengeluaran: polos, cuma tanggal kecil
          return (
            <div
              key={i}
              className="aspect-square rounded-lg flex items-center justify-center"
              style={{
                background: 'var(--bg)',
                border: isToday ? '2px solid var(--primary)' : '1px solid transparent',
              }}
            >
              <span className="text-xs" style={{ color: isToday ? 'var(--primary)' : 'var(--ink-soft)' }}>
                {day}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
