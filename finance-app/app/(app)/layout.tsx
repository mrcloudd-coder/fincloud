import Nav from '@/components/Nav'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAdmin = !!user && !!process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL

  return (
    <div className="min-h-screen flex flex-col">
      <Nav isAdmin={isAdmin} />
      <main className="flex-1 pb-20 sm:pb-0">{children}</main>
    </div>
  )
}
