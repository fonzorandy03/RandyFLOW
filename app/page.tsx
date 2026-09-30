import Link from 'next/link'
import { ArrowRight, BarChart3, BookOpenCheck, CalendarRange, CheckCircle2, FileUp, Layers3, Sparkles } from 'lucide-react'

const features = [
  { icon: CalendarRange, title: 'Un piano che resta realistico', text: 'Distribuisce gli argomenti in base a difficoltà, importanza, tempo disponibile e data dell’esame.' },
  { icon: BookOpenCheck, title: 'Studio guidato slide per slide', text: 'Spiegazioni, riassunti, concetti ed esempi seguono automaticamente la pagina che stai leggendo.' },
  { icon: BarChart3, title: 'Progressi che puoi misurare', text: 'Quiz, flashcard, mastery e simulazioni mostrano cosa sai e cosa conviene ripassare.' },
]

export default function LandingPage() {
  return <main className="min-h-dvh overflow-hidden bg-[#f7f8fc] text-[#11131a] dark:bg-[#090a0d] dark:text-foreground">
    <div className="relative isolate">
      <div className="absolute inset-x-0 top-0 -z-10 h-[760px] bg-[radial-gradient(circle_at_15%_0%,rgba(76,91,220,.22),transparent_38%),radial-gradient(circle_at_85%_25%,rgba(18,151,111,.13),transparent_32%)]" />
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight"><span className="grid size-9 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">R</span>RandyFLOW</Link>
        <div className="flex items-center gap-2"><Link href="/accedi" className="rounded-xl px-4 py-2 text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/5">Accedi</Link><Link href="/registrati" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20">Inizia gratis</Link></div>
      </nav>
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-16 md:px-8 md:pt-24 lg:grid-cols-[1.05fr_.95fr] lg:pb-32">
        <div><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/70 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur dark:bg-white/5"><Sparkles className="size-3.5" />Il tuo metodo di studio, finalmente in ordine</div>
          <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[1.03] tracking-[-.045em] md:text-7xl">Dalle slide al prossimo esame, con un piano chiaro.</h1>
          <p className="mt-6 max-w-xl text-pretty text-lg leading-8 text-[#626878] dark:text-muted-foreground">RandyFLOW riunisce materiali, calendario, ripasso e risultati in un unico spazio. Tu studi; il percorso resta sempre visibile.</p>
          <div className="mt-9 flex flex-wrap gap-3"><Link href="/registrati" className="flex h-12 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/20">Crea il tuo spazio<ArrowRight className="size-4" /></Link><Link href="/accedi" className="flex h-12 items-center rounded-xl border border-black/10 bg-white/70 px-5 text-sm font-semibold backdrop-blur hover:bg-white dark:border-white/10 dark:bg-white/5">Ho già un account</Link></div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#626878] dark:text-muted-foreground">{['Account separato','Nessuna AI nell’app','Progressi persistenti'].map(x=><span key={x} className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-success" />{x}</span>)}</div>
        </div>
        <div className="relative mx-auto w-full max-w-xl"><div className="absolute -inset-8 -z-10 rounded-full bg-primary/10 blur-3xl" /><div className="rotate-1 rounded-[2rem] border border-black/5 bg-white p-3 shadow-[0_40px_100px_rgba(28,35,75,.18)] dark:border-white/10 dark:bg-[#121318]"><div className="rounded-[1.4rem] bg-[#f4f5fa] p-5 dark:bg-[#0d0e12]"><div className="flex items-center justify-between"><div><p className="text-xs font-medium text-muted-foreground">Oggi</p><p className="mt-1 text-xl font-semibold">Microeconomia</p></div><span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">In linea</span></div><div className="mt-7 rounded-2xl bg-white p-5 shadow-sm dark:bg-card"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold">Costi fissi e variabili</p><p className="mt-1 text-xs text-muted-foreground">Slide 18–31 · 35 minuti</p></div><span className="text-2xl font-semibold text-primary">68%</span></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-primary/10"><div className="h-full w-[68%] rounded-full bg-primary" /></div></div><div className="mt-3 grid grid-cols-2 gap-3"><PreviewCard icon={Layers3} value="12" label="concetti appresi"/><PreviewCard icon={FileUp} value="4" label="materiali ordinati"/></div><div className="mt-3 rounded-2xl border border-primary/10 bg-primary/[.04] p-4"><p className="text-xs font-semibold uppercase tracking-wider text-primary">Prossimo passo</p><p className="mt-1 text-sm font-medium">Completa 8 slide, poi prova il quiz rapido.</p></div></div></div></div>
      </section>
    </div>
    <section className="border-y border-black/5 bg-white/75 py-24 dark:border-white/10 dark:bg-white/[.02]"><div className="mx-auto max-w-7xl px-5 md:px-8"><p className="text-sm font-semibold text-primary">Tutto nello stesso flusso</p><h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">Meno tempo a organizzare. Più tempo per capire.</h2><div className="mt-12 grid gap-4 md:grid-cols-3">{features.map(({icon:Icon,title,text})=><article key={title} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-card"><span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span><h3 className="mt-5 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>)}</div></div></section>
    <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8"><p>© 2026 RandyFLOW</p><p>Progettato per lo studio universitario.</p></footer>
  </main>
}

function PreviewCard({icon:Icon,value,label}:{icon:React.ComponentType<{className?:string}>,value:string,label:string}){return <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-card"><Icon className="size-4 text-primary"/><p className="mt-3 text-xl font-semibold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>}
