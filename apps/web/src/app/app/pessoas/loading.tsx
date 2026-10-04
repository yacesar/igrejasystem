import { Skeleton } from "@mca/ui";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6" aria-busy>
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-11 w-full" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
