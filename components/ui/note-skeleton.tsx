import { Skeleton } from "@/components/ui/skeleton";

export function NoteSkeleton() {
  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
}

export function NoteListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="w-full" role="status" aria-label="Loading notes">
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <NoteSkeleton key={i} />
        ))}
      <span className="sr-only">Loading notes...</span>
    </div>
  );
}

export function EditorSkeleton() {
  return (
    <div className="w-full h-full p-4 animate-pulse" role="status" aria-label="Loading editor">
      <Skeleton className="h-8 w-3/4 mb-6" />
      <Skeleton className="h-4 w-full mb-3" />
      <Skeleton className="h-4 w-5/6 mb-3" />
      <Skeleton className="h-4 w-4/6 mb-6" />
      
      <Skeleton className="h-4 w-full mb-3" />
      <Skeleton className="h-4 w-full mb-3" />
      <Skeleton className="h-4 w-3/4 mb-6" />
      
      <Skeleton className="h-4 w-5/6 mb-3" />
      <Skeleton className="h-4 w-full mb-3" />
      <span className="sr-only">Loading editor...</span>
    </div>
  );
}
