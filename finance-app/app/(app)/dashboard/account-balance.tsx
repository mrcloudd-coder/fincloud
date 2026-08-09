'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Wallet } from 'lucide-react'

type AccountBalanceDatum = {
  id: string
  name: string
  color: string
  income: number
  expense: number
}

export default function AccountBalanceCharts({ data }: { data: AccountBalanceDatum[] }) {
  if (data.length === 0) return null

  return (
    <div>
      <h2 className="text-sm font-medium mb-3">Saldo per rekening</h2>
      <div className="flex gap-3 overflow-x-auto -mx-1 px-1 pb-1" style={{ scrollbarWidth: 'none' }}>
        {data.map((acc) => {
          const remaining = acc.income - acc.expense
          const pct = acc.income > 0 ? Math.min(100, Math.round((acc.expense / acc.income) * 100)) : 0
          const chartData =
            acc.income > 0
              ? [
                  { name: 'Terpakai', value: acc.expense },
                  { name: 'Sisa', value: Math.max(0, remaining) },
                ]
              : [{ name: 'Kosong', value: 1 }]

          return (
            <div
              key={acc.id}
              className="flex-shrink-0 w-[104px] rounded-xl p-3 flex flex-col items-center text-center"
              style={{ background: 'var(--bg)' }}
            >
              <div className="relative w-11 h-11 mb-1.5">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      innerRadius={14}
                      outerRadius={21}
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                    >
                      {acc.income > 0 ? (
                        <>
                          <Cell fill={acc.color} />
                          <Cell fill="var(--border)" />
                        </>
                      ) : (
                        <Cell fill="var(--border)" />
                      )}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Wallet size={13} style={{ color: acc.color }} />
                </div>
              </div>
              <p className="text-xs font-medium truncate w-full">{acc.name}</p>
              <p className="text-[11px] font-semibold truncate w-full" style={{ color: remaining >= 0 ? 'var(--ink)' : 'var(--danger)' }}>
                Rp{remaining.toLocaleString('id-ID')}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--ink-soft)' }}>
                {acc.income > 0 ? `${pct}% terpakai` : 'Belum ada dana'}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
