export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse px-8 py-12">
      <div className="h-8 w-40 rounded-lg bg-ivory-dim" />
      <div className="mt-2 h-4 w-72 rounded-lg bg-ivory-dim" />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div className="h-24 rounded-xl border border-border bg-card" key={i} />
        ))}
      </div>

      <div className="mt-8 h-10 w-44 rounded-lg bg-ivory-dim" />
    </div>
  )
}
