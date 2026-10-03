export default function PackagesLoading() {
  return (
    <div className="animate-pulse px-8 py-12">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 rounded-lg bg-ivory-dim" />
        <div className="h-10 w-32 rounded-lg bg-ivory-dim" />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        <div className="h-11 border-b border-border" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="h-12 border-b border-border last:border-0" key={i} />
        ))}
      </div>
    </div>
  )
}
