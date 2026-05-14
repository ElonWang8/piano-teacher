import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarLoading() {
  return (
    <div className="p-3 md:p-6 space-y-4">
      {/* month nav bar skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 bg-muted rounded w-8 animate-pulse" />
        <div className="h-8 bg-muted rounded w-32 animate-pulse" />
        <div className="h-8 bg-muted rounded w-8 animate-pulse" />
      </div>
      {/* calendar grid skeleton — 4 rows × 7 cols */}
      <div className="rounded-lg border bg-card p-4 space-y-1 animate-pulse">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="h-5 bg-muted rounded" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 28 }, (_, i) => (
            <div key={i} className="aspect-square bg-muted rounded" />
          ))}
        </div>
      </div>
      <Skeleton type="card" count={1} />
    </div>
  );
}
