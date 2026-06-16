export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 lg:px-8">
          <nav className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
                XeelTech Solutions
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
                FarsamoTech Repair Hub
              </h1>
            </div>
            <a
              href="/api/health"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              API health
            </a>
          </nav>


        </div>
      </section>


    </main>
  );
}
