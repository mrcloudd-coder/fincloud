import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Client khusus server-to-server (webhook Midtrans) yang bypass RLS.
 * JANGAN PERNAH dipakai atau diekspos di kode sisi client/browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY belum di-set di environment variables')
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
