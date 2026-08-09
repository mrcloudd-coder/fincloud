'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, Clock, CheckCircle2, XCircle, QrCode, MessageCircle, Send, X } from 'lucide-react'

type PendingRequest = {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  user_notified: boolean
} | null

const WA_NUMBER = '62895402138794'
const TELEGRAM_HANDLE = 'mrclooudd'

export default function QrisPayment({ pendingRequest }: { pendingRequest: PendingRequest }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [showContactPicker, setShowContactPicker] = useState(false)
  const [dismissing, setDismissing] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError(null)
  }

  async function handleSubmit() {
    if (!file) {
      setError('Upload bukti transfer dulu ya.')
      return
    }
    setLoading(true)
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError('Sesi login habis, silakan login ulang.')
      setLoading(false)
      return
    }

    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${user.id}/${Date.now()}.${ext}`

    const { error: uploadErr } = await supabase.storage.from('payment-proofs').upload(path, file)
    if (uploadErr) {
      setError('Gagal upload bukti: ' + uploadErr.message)
      setLoading(false)
      return
    }

    // Kirim ke API route: catat permintaan + optimistic activation
    const res = await fetch('/api/billing/submit-proof', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proofPath: path }),
    })
    const data = await res.json()

    setLoading(false)
    if (!res.ok) {
      setError(data.error || 'Gagal mengirim konfirmasi')
      return
    }

    setSubmitted(true)
    router.refresh()
  }

  async function handleDismissRejection() {
    setDismissing(true)
    await fetch('/api/billing/dismiss-rejection', { method: 'POST' })
    setDismissing(false)
    router.refresh()
  }

  // === Notifikasi: perpanjangan sebelumnya di-reject admin (belum di-dismiss user) ===
  const showRejectionNotice = pendingRequest?.status === 'rejected' && pendingRequest.user_notified === false

  if (showRejectionNotice) {
    return (
      <div className="card p-6">
        <div className="flex items-start gap-3 p-4 rounded-xl mb-4" style={{ background: 'var(--danger-soft)' }}>
          <XCircle size={20} style={{ color: 'var(--danger)' }} className="flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--danger)' }}>
              Perpanjangan tidak valid
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--ink-soft)' }}>
              Bukti transfer yang kamu kirim tidak bisa diverifikasi, jadi akses premium sudah dinonaktifkan lagi.
              Kalau ini kesalahan, hubungi admin.
            </p>
          </div>
        </div>

        {showContactPicker ? (
          <div className="flex gap-2 mb-3">
            <a
              href={`https://wa.me/${WA_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: '#25D366', color: 'white' }}
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
            <a
              href={`https://t.me/${TELEGRAM_HANDLE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: '#229ED9', color: 'white' }}
            >
              <Send size={16} />
              Telegram
            </a>
          </div>
        ) : (
          <button
            onClick={() => setShowContactPicker(true)}
            className="btn-primary w-full py-2.5 text-sm font-medium mb-3"
          >
            Hubungi Admin
          </button>
        )}

        <button
          onClick={handleDismissRejection}
          disabled={dismissing}
          className="w-full py-2 text-xs flex items-center justify-center gap-1"
          style={{ color: 'var(--ink-soft)' }}
        >
          <X size={12} />
          {dismissing ? 'Memproses...' : 'Tutup notifikasi ini & lanjut berlangganan'}
        </button>
      </div>
    )
  }

  // Kalau masih ada permintaan yang pending (baru upload / belum direview admin)
  if (!submitted && pendingRequest?.status === 'pending') {
    return (
      <div className="card p-6">
        <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'var(--primary-soft)' }}>
          <CheckCircle2 size={20} style={{ color: 'var(--primary)' }} className="flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
              Fitur premium sudah aktif!
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--ink-soft)' }}>
              Bukti transfer kamu sedang direview admin — proses ini cuma buat konfirmasi akhir, kamu udah bisa
              pakai semua fitur sekarang.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="card p-6">
        <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'var(--primary-soft)' }}>
          <CheckCircle2 size={20} style={{ color: 'var(--primary)' }} className="flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
              Fitur premium sudah aktif!
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--ink-soft)' }}>
              Bukti transfer kamu sedang direview admin sebagai konfirmasi akhir. Selamat pakai semua fiturnya!
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <QrCode size={18} style={{ color: 'var(--primary)' }} />
        <h2 className="text-sm font-semibold">Bayar via QRIS</h2>
      </div>

      <div className="rounded-xl overflow-hidden mb-4 border" style={{ borderColor: 'var(--border)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/qris.png" alt="QRIS FinCloud" className="w-full" />
      </div>
      <p className="text-xs text-center mb-4" style={{ color: 'var(--ink-soft)' }}>
        Scan QRIS di atas, transfer <strong>Rp15.000</strong>, lalu upload bukti transfernya di bawah.
        Fitur premium langsung aktif begitu bukti terkirim.
      </p>

      <label className="block mb-3">
        <span className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink-soft)' }}>
          Upload bukti transfer
        </span>
        <div
          className="flex items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed cursor-pointer"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview bukti transfer" className="max-h-40 rounded-lg" />
          ) : (
            <div className="flex flex-col items-center gap-1.5" style={{ color: 'var(--ink-soft)' }}>
              <Upload size={20} />
              <span className="text-xs">Klik untuk pilih foto/screenshot</span>
            </div>
          )}
        </div>
        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      </label>

      {error && (
        <p className="text-sm mb-3" style={{ color: 'var(--danger)' }}>
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !file}
        className="btn-primary w-full py-3 text-sm font-semibold"
      >
        {loading ? 'Mengirim...' : 'Konfirmasi Pembayaran'}
      </button>
    </div>
  )
}
