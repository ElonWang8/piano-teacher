import { Skeleton } from "@/components/ui/skeleton";

export default function StudentsLoading() {
  return (
    <div className="p-3 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-muted rounded w-24 animate-pulse" />
        <div className="h-9 bg-muted rounded w-28 animate-pulse" />
      </div>
      <Skeleton type="table-row" count={6} />
    </div>
  );
}
