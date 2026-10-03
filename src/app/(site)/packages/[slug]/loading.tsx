export default function PackageDetailLoading() {
  return (
    <>
      <div className="h-[70vh] min-h-[420px] animate-pulse bg-navy-950" />
      <section className="py-14 md:py-[72px]">
        <div className="container">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div className="animate-pulse space-y-3">
              <div className="h-6 w-32 rounded bg-ivory-dim" />
              <div className="h-4 w-full rounded bg-ivory-dim" />
              <div className="h-4 w-5/6 rounded bg-ivory-dim" />
            </div>
            <div className="grid animate-pulse grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-ivory-dim" />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
