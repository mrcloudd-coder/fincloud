'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

type CategoryDatum = { name: string; value: number; color: string }

export default function DashboardCharts({
  categoryData,
  monthlyIncome,
  monthlyExpense,
  rangeLabel,
}: {
  categoryData: CategoryDatum[]
  monthlyIncome: number
  monthlyExpense: number
  rangeLabel: string
}) {
  const pct = monthlyIncome > 0 ? Math.min(100, Math.round((monthlyExpense / monthlyIncome) * 100)) : 0
  const sorted = [...categoryData].sort((a, b) => b.value - a.value)

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium">Pengeluaran per kategori — {rangeLabel}</h2>
        {monthlyIncome > 0 && (
          <span className="text-xs font-medium" style={{ color: pct >= 90 ? 'var(--danger)' : 'var(--primary)' }}>
            {pct}% budget bulan ini
          </span>
        )}
      </div>

      {categoryData.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: 'var(--ink-soft)' }}>
          Belum ada pengeluaran di periode ini
        </p>
      ) : (
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={28} outerRadius={46} paddingAngle={2}>
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `Rp${Number(value).toLocaleString('id-ID')}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            {sorted.slice(0, 4).map((c) => (
              <div key={c.name} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <span className="truncate">{c.name}</span>
                </span>
                <span className="font-medium flex-shrink-0" style={{ color: 'var(--ink-soft)' }}>
                  Rp{c.value.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
            {sorted.length > 4 && (
              <p className="text-[11px]" style={{ color: 'var(--ink-soft)' }}>
                +{sorted.length - 4} kategori lainnya
              </p>
            )}
          </div>
        </div>
      )}

      <div className="w-full h-2 rounded-full overflow-hidden mt-4" style={{ background: 'var(--bg)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: pct >= 90 ? 'var(--danger)' : 'var(--primary)',
          }}
        />
      </div>
      <p className="text-[11px] mt-1.5" style={{ color: 'var(--ink-soft)' }}>
        {monthlyIncome > 0
          ? `${pct}% dari pemasukan bulan ini sudah terpakai`
          : 'Tambahkan pemasukan untuk melihat progress budget'}
      </p>
    </div>
  )
}
