import { Skeleton } from './ui/skeleton';

export function SkeletonTaskCard() {
  return (
    <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-5">
      <div className="flex items-start gap-4">
        {/* Checkbox skeleton */}
        <Skeleton className="w-6 h-6 rounded-full shrink-0 mt-1" />
        
        {/* Content skeleton */}
        <div className="flex-1 space-y-3">
          {/* Title */}
          <Skeleton className="h-5 w-3/4" />
          
          {/* Tags & Meta */}
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
          
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-8" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonGoalCard() {
  return (
    <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <Skeleton className="w-8 h-8 rounded" />
      </div>
      
      {/* Progress */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-3 w-full" />
      </div>
      
      {/* Details */}
      <div className="flex gap-2">
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}
