import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6">
        <header className="flex items-center justify-between py-8">
          <span className="text-lg font-extrabold tracking-tight">
            Voyager <span className="text-ember-500">AI</span>
          </span>
          <nav className="flex gap-3">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-ember-500 px-4 py-2 text-sm font-semibold text-ink-950 transition hover:bg-ember-400"
            >
              Get started
            </Link>
          </nav>
        </header>

        <section className="flex flex-1 flex-col items-start justify-center gap-6 py-16">
          <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-400">
            AI-Generated • Climate-Aware • Editable
          </span>
          <h1 className="max-w-2xl text-5xl font-extrabold leading-tight sm:text-6xl">
            Plan a trip in <span className="text-ember-500">seconds</span>, not weekends.
          </h1>
          <p className="max-w-xl text-lg text-slate-400">
            Tell Voyager where you&apos;re headed, your budget, and your interests. It builds a
            day-by-day itinerary, a real budget breakdown, hotel picks, and a packing list
            grounded in actual climate data — all editable, all yours.
          </p>
          <div className="flex gap-3">
            <Link
              href="/register"
              className="rounded-full bg-ember-500 px-6 py-3 font-semibold text-ink-950 shadow-glow transition hover:bg-ember-400"
            >
              Build my itinerary
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-ink-700 px-6 py-3 font-semibold text-slate-200 hover:border-sky-500/50"
            >
              I already have an account
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 pb-16 sm:grid-cols-3">
          {[
            {
              title: 'Day-by-day itinerary',
              copy: 'A structured plan tuned to your budget tier and interests, fully editable.',
            },
            {
              title: 'Real climate data',
              copy: 'Packing lists grounded in actual seasonal weather, not just an LLM guess.',
            },
            {
              title: 'Version history',
              copy: 'Regenerate any day without fear — every version is saved and revertible.',
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-ink-700 bg-ink-900/60 p-5">
              <h3 className="mb-1 font-bold text-white">{f.title}</h3>
              <p className="text-sm text-slate-400">{f.copy}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
