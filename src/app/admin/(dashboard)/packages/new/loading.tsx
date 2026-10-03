export default function NewPackageLoading() {
  return (
    <div className="animate-pulse px-8 py-12">
      <div className="h-8 w-48 rounded-lg bg-ivory-dim" />
      <div className="mt-6 max-w-2xl space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div className="h-16 rounded-lg bg-ivory-dim" key={i} />
        ))}
      </div>
    </div>
  )
}
