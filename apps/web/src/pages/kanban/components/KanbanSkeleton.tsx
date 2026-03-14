import { Skeleton } from '../../../components/ui/Skeleton';

export function KanbanSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto">
      {Array.from({ length: 5 }).map((_, columnIndex) => (
        <div key={columnIndex} className="w-[280px] space-y-2 rounded border p-2">
          <Skeleton className="h-6 w-32" />
          {Array.from({ length: 3 }).map((__, cardIndex) => (
            <Skeleton key={cardIndex} className="h-24 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}
