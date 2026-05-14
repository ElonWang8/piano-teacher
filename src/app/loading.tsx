import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-3 md:p-6 space-y-6">
      {/* stat cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4 space-y-2 animate-pulse">
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="h-7 bg-muted rounded w-1/3" />
          </div>
        ))}
      </div>
      {/* content area */}
      <Skeleton type="card" count={2} />
    </div>
  );
}
