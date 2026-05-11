import { cn } from "@/lib/utils";

interface SkeletonProps {
  type: "card" | "table-row" | "form";
  count?: number;
  className?: string;
}

function CardSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card animate-pulse">
      <div className="w-10 h-10 rounded-full bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-3 bg-muted rounded w-2/3" />
      </div>
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-3 animate-pulse">
      <div className="h-4 bg-muted rounded flex-1" />
      <div className="h-4 bg-muted rounded w-20" />
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-4 p-4 animate-pulse">
      <div className="h-10 bg-muted rounded" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
      </div>
      <div className="h-24 bg-muted rounded" />
      <div className="h-24 bg-muted rounded" />
      <div className="h-10 bg-muted rounded w-1/3" />
    </div>
  );
}

export function Skeleton({ type, count = 3, className }: SkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((i) => {
        switch (type) {
          case "card":
            return <CardSkeleton key={i} />;
          case "table-row":
            return <TableRowSkeleton key={i} />;
          case "form":
            return <FormSkeleton key={i} />;
        }
      })}
    </div>
  );
}
