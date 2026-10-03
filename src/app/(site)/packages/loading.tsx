export default function PackagesLoading() {
  return (
    <>
      <section className="bg-navy-950 py-16 text-ivory md:py-[72px]">
        <div className="container">
          <div className="mx-auto max-w-[40rem] animate-pulse text-center">
            <div className="mx-auto mb-4 h-3 w-32 rounded-full bg-white/10" />
            <div className="mx-auto mb-3 h-9 w-3/4 rounded-lg bg-white/10" />
            <div className="mx-auto h-5 w-2/3 rounded-lg bg-white/10" />
          </div>
        </div>
      </section>

      <section className="py-16 md:py-[72px]">
        <div className="container">
          <div className="mb-10 h-[92px] animate-pulse rounded-[18px] border border-border bg-paper" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[340px] animate-pulse rounded-[20px] bg-ivory-dim" />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
