'use client'

import { useRef, useState } from 'react'
import SummaryCalendarCard from './summary-calendar-card'
import QuickChat from './quick-chat'

type AccountBalance = { id: string; name: string; color: string; balance: number }
type Category = { id: string; name: string }
type Account = { id: string; name: string; color: string }

export default function DashboardInteractive({
  metrics,
  accounts,
  isAccumulated,
  dailyTotals,
  viewedYear,
  viewedMonth,
  yearOptions,
  categories,
}: {
  metrics: { saldo: number; pemasukan: number; pengeluaran: number }
  accounts: AccountBalance[]
  isAccumulated: boolean
  dailyTotals: Record<string, number>
  viewedYear: number
  viewedMonth: number
  yearOptions: number[]
  categories: Category[]
}) {
  const [prefillDate, setPrefillDate] = useState<string | null>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  function handleRecordHere(dateKey: string) {
    setPrefillDate(dateKey)
    chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Untuk QuickChat, cukup nama+id+color rekening (tanpa saldo)
  const accountsForChat: Account[] = accounts.map((a) => ({ id: a.id, name: a.name, color: a.color }))

  return (
    <>
      <div className="mb-4">
        <SummaryCalendarCard
          metrics={metrics}
          accounts={accounts}
          isAccumulated={isAccumulated}
          dailyTotals={dailyTotals}
          viewedYear={viewedYear}
          viewedMonth={viewedMonth}
          yearOptions={yearOptions}
          onRecordHere={handleRecordHere}
        />
      </div>

      <div className="mb-4" ref={chatRef}>
        <QuickChat
          categories={categories}
          accounts={accountsForChat}
          prefillDate={prefillDate}
          onPrefillConsumed={() => setPrefillDate(null)}
        />
      </div>
    </>
  )
}
