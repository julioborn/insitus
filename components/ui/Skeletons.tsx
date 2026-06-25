export function SkeletonCard() {
  return (
    <div
      className="surface-card flex items-center gap-4 px-4 py-3 rounded-2xl"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="skeleton w-12 h-12 rounded-full flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2.5">
        <div className="skeleton h-3 rounded-lg" style={{ width: "55%" }} />
        <div className="skeleton h-2.5 rounded-lg" style={{ width: "35%" }} />
      </div>
      <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
    </div>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
