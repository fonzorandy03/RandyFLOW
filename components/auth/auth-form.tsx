'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { ApiError } from '@/lib/api/http'
import logoImage from '@/logo/Logo Senza Sfondo.png'

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const registerMode = mode === 'register'
  const { login, register } = useAuth()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      const email = String(form.get('email'))
      const password = String(form.get('password'))
      if (registerMode) {
        await register({ firstName: String(form.get('firstName')), lastName: String(form.get('lastName')), email, password })
      } else await login({ email, password })
      router.replace('/dashboard')
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Operazione non riuscita. Riprova.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-[#f6f7fb] px-4 py-10 dark:bg-[#090a0d]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(88,101,242,.16),transparent_35%),radial-gradient(circle_at_90%_80%,rgba(18,151,111,.12),transparent_32%)]" />
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 text-lg font-semibold tracking-tight">
          <Image src={logoImage} alt="" width={36} height={36} className="size-9 rounded-xl object-contain" />
          RandyFLOW
        </Link>
        <section className="rounded-3xl border border-black/5 bg-white/90 p-7 shadow-[0_24px_80px_rgba(30,36,70,.12)] backdrop-blur dark:border-white/10 dark:bg-card/90 md:p-9">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[.18em] text-primary">{registerMode ? 'Nuovo account' : 'Bentornato'}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{registerMode ? 'Inizia il tuo percorso' : 'Accedi a RandyFLOW'}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{registerMode ? 'I tuoi esami, progressi e risultati resteranno separati dagli altri utenti.' : 'Riprendi il tuo piano di studio da dove lo avevi lasciato.'}</p>
          <form onSubmit={submit} className="mt-7 space-y-4">
            {registerMode && <div className="grid grid-cols-2 gap-3"><Field name="firstName" label="Nome" autoComplete="given-name" /><Field name="lastName" label="Cognome" autoComplete="family-name" /></div>}
            <Field name="email" label="Email" type="email" autoComplete="email" />
            <label className="block text-sm font-medium">Password
              <span className="relative mt-1.5 block"><input name="password" type={showPassword ? 'text' : 'password'} autoComplete={registerMode ? 'new-password' : 'current-password'} minLength={8} required className="h-11 w-full rounded-xl border bg-background px-3 pr-11 text-sm outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/10" />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></span>
            </label>
            {registerMode && <p className="text-xs text-muted-foreground">Almeno 8 caratteri.</p>}
            {error && <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{error}</p>}
            <button disabled={pending} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:brightness-105 disabled:opacity-60">{pending ? <LoaderCircle className="size-4 animate-spin" /> : <>{registerMode ? 'Crea account' : 'Accedi'}<ArrowRight className="size-4" /></>}</button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">{registerMode ? 'Hai già un account?' : 'Non hai ancora un account?'} <Link className="font-semibold text-primary hover:underline" href={registerMode ? '/accedi' : '/registrati'}>{registerMode ? 'Accedi' : 'Registrati'}</Link></p>
        </section>
      </div>
    </main>
  )
}

function Field({ name, label, type = 'text', autoComplete }: { name: string; label: string; type?: string; autoComplete: string }) {
  return <label className="block text-sm font-medium">{label}<input name={name} type={type} autoComplete={autoComplete} required className="mt-1.5 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/10" /></label>
}
