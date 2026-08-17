'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Send, Check, X, Pencil, Wallet, CalendarDays } from 'lucide-react'

type ParsedItem = { item: string; kategori: string; jumlah: number; tanggal: string }
type Category = { id: string; name: string }
type Account = { id: string; name: string; color: string }

const EXAMPLE_CHIPS = ['kemarin makan 20k', 'beli pulsa 25k', 'jajan cilok 15k, bensin 30k']

export default function QuickChat({
  categories: initialCategories,
  accounts,
  prefillDate,
  onPrefillConsumed,
}: {
  categories: Category[]
  accounts: Account[]
  prefillDate?: string | null
  onPrefillConsumed?: () => void
}) {
  const [accountId, setAccountId] = useState('')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<ParsedItem[] | null>(null)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const selectedAccount = accounts.find((a) => a.id === accountId)
  const isLocked = !accountId

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || !accountId) return
    setLoading(true)
    setError(null)
    setSavedMsg(null)
    setPending(null)

    try {
      const res = await fetch('/api/parse-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal memproses chat')
      if (!data.transactions?.length) {
        setError('AI tidak menemukan transaksi dari chat kamu. Coba lebih spesifik, misal: "jajan cilok 15k".')
      } else {
        // Kalau user klik "Catat di sini" dari kalender, tanggal itu MENANG
        // dibanding tebakan AI — user udah eksplisit milih tanggalnya.
        const transactions = prefillDate
          ? data.transactions.map((t: ParsedItem) => ({ ...t, tanggal: prefillDate }))
          : data.transactions
        setPending(transactions)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  function updatePending(index: number, field: keyof ParsedItem, value: string | number) {
    if (!pending) return
    const copy = [...pending]
    copy[index] = { ...copy[index], [field]: value }
    setPending(copy)
  }

  function removePending(index: number) {
    if (!pending) return
    setPending(pending.filter((_, i) => i !== index))
  }

  async function confirmSave() {
    if (!pending || pending.length === 0 || !accountId) return
    setSaving(true)
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError('Sesi login habis, silakan login ulang.')
      setSaving(false)
      return
    }

    const rows = []
    const currentCategories = [...categories]

    for (const t of pending) {
      let cat = currentCategories.find((c) => c.name.toLowerCase() === t.kategori.toLowerCase())
      if (!cat) {
        const { data: newCat, error: catErr } = await supabase
          .from('categories')
          .insert({ user_id: user.id, name: t.kategori })
          .select('id, name')
          .single()
        if (catErr || !newCat) {
          setError('Gagal membuat kategori baru: ' + (catErr?.message ?? ''))
          setSaving(false)
          return
        }
        cat = newCat
        currentCategories.push(newCat)
      }
      rows.push({ user_id: user.id, item: t.item, category_id: cat.id, amount: t.jumlah, account_id: accountId, date: t.tanggal })
    }

    const { error: insertErr } = await supabase.from('transactions').insert(rows)
    if (insertErr) {
      setError('Gagal menyimpan transaksi: ' + insertErr.message)
      setSaving(false)
      return
    }

    setCategories(currentCategories)
    setSavedMsg(`${rows.length} transaksi berhasil disimpan dari ${selectedAccount?.name ?? 'rekening'}.`)
    setPending(null)
    setText('')
    setSaving(false)
    onPrefillConsumed?.()
    router.refresh()
  }

  const total = pending?.reduce((sum, t) => sum + (Number(t.jumlah) || 0), 0) ?? 0
  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div className="card overflow-hidden">
      {/* ===== Header "Chat Fin" ===== */}
      <div
        className="px-5 py-4 flex items-center justify-between relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2a2340 0%, #1a1628 100%)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3 relative z-10">
          <span
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
            style={{ background: 'rgba(52,224,161,0.15)' }}
          >
            ☁️
          </span>
          <div>
            <p className="font-extrabold text-base leading-tight">Chat Fin</p>
            <p className="text-xs" style={{ color: 'var(--ink-soft)' }}>Cukup chat, AI yang urus sisanya</p>
          </div>
        </div>
        <span className="text-2xl relative z-10">💸</span>
      </div>

      <div className="p-5">
        {prefillDate && (
          <div
            className="flex items-center justify-between gap-2 mb-3 px-3.5 py-2.5 rounded-xl"
            style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)' }}
          >
            <p className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
              📅 Nyatet buat tanggal{' '}
              {new Date(prefillDate + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <button
              type="button"
              onClick={() => onPrefillConsumed?.()}
              className="text-xs font-bold flex-shrink-0"
              style={{ color: 'var(--accent)' }}
            >
              Batal
            </button>
          </div>
        )}

        {/* ===== Pill: Rekening & Tanggal ===== */}
        <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="flex-1 px-3.5 py-3 text-sm font-bold rounded-xl"
            style={
              accountId
                ? { background: 'var(--primary-soft)', border: '1.5px solid var(--primary)', color: 'var(--primary)' }
                : { background: 'var(--bg)', border: '1.5px dashed var(--border)', color: 'var(--ink-soft)' }
            }
          >
            <option value="">🏦 Pilih Rekening</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>🏦 {a.name}</option>
            ))}
          </select>

          {pending && pending.length > 0 ? null : (
            <div
              className="flex-1 flex items-center gap-2 px-3.5 py-3 text-sm font-bold rounded-xl"
              style={{ background: 'var(--accent-soft)', border: '1.5px solid var(--accent)', color: 'var(--accent)' }}
            >
              <CalendarDays size={15} />
              {prefillDate
                ? new Date(prefillDate + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                : 'Hari ini'}
            </div>
          )}
        </div>

        {/* ===== Zona chat besar ===== */}
        <div
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{ background: isLocked ? 'var(--bg)' : 'linear-gradient(160deg, #1c1730 0%, #221b38 100%)', border: isLocked ? '1.5px dashed var(--border)' : '1.5px solid var(--border)' }}
        >
          <p className="text-xs font-bold mb-3 relative z-10" style={{ color: isLocked ? 'var(--ink-soft)' : 'var(--accent)' }}>
            {isLocked ? '🔒 Pilih rekening dulu buat mulai catat' : '💬 Tulis pengeluaranmu, sedetail atau sesantai apapun'}
          </p>

          <form onSubmit={handleSubmit} className="flex items-center gap-3 relative z-10">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={isLocked ? 'Pilih rekening terlebih dahulu...' : 'jajan cilok 15k terus isi bensin 30k...'}
              className="flex-1 px-4 py-3.5 text-sm rounded-full"
              style={{ background: 'var(--surface)' }}
              disabled={loading || isLocked}
            />
            <button
              type="submit"
              disabled={loading || !text.trim() || isLocked}
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: isLocked ? 'var(--border)' : 'var(--primary)', color: isLocked ? 'var(--ink-soft)' : '#0b3a2a' }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>

          <div className="flex gap-2 mt-3.5 flex-wrap relative z-10">
            {EXAMPLE_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                disabled={isLocked}
                onClick={() => setText(chip)}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-full"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: isLocked ? 'var(--ink-soft)' : 'var(--accent)',
                  opacity: isLocked ? 0.5 : 1,
                }}
              >
                &quot;{chip}&quot;
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="text-xs mt-3 flex items-center gap-1.5" style={{ color: 'var(--ink-soft)' }}>
            <Loader2 size={12} className="animate-spin" />
            AI sedang membaca chatmu...
          </div>
        )}

        {error && (
          <div className="text-sm mt-3" style={{ color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        {savedMsg && (
          <div className="text-sm mt-3" style={{ color: 'var(--primary)' }}>
            ✅ {savedMsg}
          </div>
        )}

        {/* ===== Konfirmasi transaksi ===== */}
        {pending && pending.length > 0 && (
          <div className="p-4 rounded-xl mt-4" style={{ background: 'var(--bg)' }}>
            <p className="text-xs mb-3" style={{ color: 'var(--ink-soft)' }}>
              Semua item ini akan tercatat keluar dari <strong style={{ color: 'var(--primary)' }}>{selectedAccount?.name}</strong>
            </p>
            <div className="space-y-2 mb-3">
              {pending.map((t, i) => {
                const isNotToday = t.tanggal !== todayStr
                return (
                  <div
                    key={i}
                    className="flex flex-col gap-1.5 p-2.5 rounded-lg"
                    style={{ background: isNotToday ? 'var(--accent-soft)' : 'var(--surface)' }}
                  >
                    <div className="flex items-center gap-1.5">
                      <Pencil size={12} style={{ color: 'var(--ink-soft)' }} />
                      <input
                        value={t.item}
                        onChange={(e) => updatePending(i, 'item', e.target.value)}
                        className="flex-1 px-2 py-1 text-xs"
                      />
                      <input
                        value={t.kategori}
                        onChange={(e) => updatePending(i, 'kategori', e.target.value)}
                        list="quick-category-list"
                        className="w-24 px-2 py-1 text-xs"
                      />
                      <input
                        type="number"
                        value={t.jumlah}
                        onChange={(e) => updatePending(i, 'jumlah', Number(e.target.value))}
                        className="w-20 px-2 py-1 text-xs"
                      />
                      <button onClick={() => removePending(i)} type="button" style={{ color: 'var(--danger)' }}>
                        <X size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 pl-4">
                      <CalendarDays size={12} style={{ color: isNotToday ? 'var(--accent)' : 'var(--ink-soft)' }} />
                      <input
                        type="date"
                        value={t.tanggal}
                        onChange={(e) => updatePending(i, 'tanggal', e.target.value)}
                        className="px-2 py-1 text-xs"
                      />
                      {isNotToday && (
                        <span className="text-[10px] font-medium" style={{ color: 'var(--accent)' }}>
                          AI mendeteksi ini bukan hari ini — cek lagi ya
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <datalist id="quick-category-list">
              {categories.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>

            <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="text-xs font-medium">Total: Rp{total.toLocaleString('id-ID')}</span>
              <div className="flex gap-2">
                <button onClick={() => { setPending(null); onPrefillConsumed?.() }} type="button" className="btn-secondary px-3 py-1.5 text-xs font-medium">
                  Batal
                </button>
                <button onClick={confirmSave} disabled={saving} type="button" className="btn-primary px-3 py-1.5 text-xs font-medium flex items-center gap-1">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
