import { useQuery } from '@tanstack/react-query';
import { fetchCalendarSyncGroups } from '@/lib/calendar-linked-api';

export function useCalendarSyncGroups(enabled = true) {
  return useQuery({
    queryKey: ['calendar-sync-groups'],
    queryFn: fetchCalendarSyncGroups,
    staleTime: 45_000,
    enabled,
  });
}
