'use client'

import { useEffect } from 'react'

export default function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Diamkan saja kalau gagal (misal browser lama) — app tetap jalan normal,
        // cuma tidak bisa di-install sebagai PWA.
      })
    }
  }, [])

  return null
}
