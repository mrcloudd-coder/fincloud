'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, Clock, CheckCircle2, XCircle, QrCode } from 'lucide-react'

type PendingRequest = { id: string; status: 'pending' | 'approved' | 'rejected'; created_at: string } | null

export default function QrisPayment({ pendingRequest }: { pendingRequest: PendingRequest }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
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

    const { error: insertErr } = await supabase.from('payment_requests').insert({
      user_id: user.id,
      proof_path: path,
    })

    setLoading(false)
    if (insertErr) {
      setError('Gagal mengirim konfirmasi: ' + insertErr.message)
      return
    }

    setSubmitted(true)
    router.refresh()
  }

  // Kalau sudah pernah kirim dan masih menunggu direview
  if (!submitted && pendingRequest?.status === 'pending') {
    return (
      <div className="card p-6">
        <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'var(--primary-soft)' }}>
          <Clock size={20} style={{ color: 'var(--primary)' }} className="flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
              Menunggu konfirmasi
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--ink-soft)' }}>
              Bukti transfer kamu sudah dikirim dan sedang direview. Biasanya diproses dalam beberapa jam.
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
              Bukti transfer terkirim!
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--ink-soft)' }}>
              Langganan kamu akan aktif setelah bukti transfer direview. Biasanya diproses dalam beberapa jam.
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

      {pendingRequest?.status === 'rejected' && (
        <div className="flex items-start gap-3 p-3 rounded-xl mb-4" style={{ background: '#fdeeee' }}>
          <XCircle size={18} style={{ color: 'var(--danger)' }} className="flex-shrink-0" />
          <p className="text-xs" style={{ color: 'var(--danger)' }}>
            Bukti transfer sebelumnya belum bisa diverifikasi. Coba upload ulang bukti yang lebih jelas.
          </p>
        </div>
      )}

      <div className="rounded-xl overflow-hidden mb-4 border" style={{ borderColor: 'var(--border)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/qris.png" alt="QRIS FinCloud" className="w-full" />
      </div>
      <p className="text-xs text-center mb-4" style={{ color: 'var(--ink-soft)' }}>
        Scan QRIS di atas, transfer <strong>Rp15.000</strong>, lalu upload bukti transfernya di bawah.
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
