'use client'

import { useRouter } from 'next/navigation'

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export default function RangeFilter({ selected }: { selected: string | null }) {
  const router = useRouter()
  const now = new Date()

  // Opsi: 12 bulan terakhir, buat dipilih sebagai titik "mulai dari"
  const options = Array.from({ length: 12 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
    return { value, label }
  })

  function handleChange(value: string) {
    if (value === 'current') {
      router.push('/dashboard')
    } else {
      router.push(`/dashboard?from=${value}`)
    }
  }

  return (
    <select
      value={selected ?? 'current'}
      onChange={(e) => handleChange(e.target.value)}
      className="text-xs px-2.5 py-1.5 rounded-lg border"
      style={{ borderColor: 'var(--border)', color: 'var(--ink-soft)' }}
    >
      <option value="current">Bulan ini saja</option>
      {options.slice(1).map((o) => (
        <option key={o.value} value={o.value}>
          Dari {o.label}
        </option>
      ))}
    </select>
  )
}
