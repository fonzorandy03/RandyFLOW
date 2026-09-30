import { AppShell } from '@/components/layout/app-shell'
import { AuthGuard } from '@/lib/auth'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard><AppShell>{children}</AppShell></AuthGuard>
}
