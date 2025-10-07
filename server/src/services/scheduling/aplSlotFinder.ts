import { differenceInMinutes, addMinutes, isBefore, startOfDay, endOfDay } from 'date-fns';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Slot = { 
  startsAt: Date; 
  endsAt: Date; 
  score: number; 
  provider: 'google' | 'outlook' | 'apple' | 'internal' 
};

export async function findTopHoldsForEvent(
  eventId: string, 
  userId: string, 
  opts?: {
    windowDays?: number; // default 14
    minMinutes?: number; // default 60
    maxSuggestions?: number; // default 3
  }
): Promise<Slot[]> {
  const { windowDays = 14, minMinutes = 60, maxSuggestions = 3 } = opts ?? {};

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return [];

  // 1) Pull availability: store hours + external busy
  const [hours, busy] = await Promise.all([
    getStoreHours(userId, event.startTime ?? new Date()),
    getBusyBlocks(userId, windowDays),
  ]);

  // 2) Build free blocks from hours - busy
  const freeBlocks = buildFreeBlocks(hours, busy);

  // 3) Score blocks (simple V1: morning bias + near-event proximity)
  const now = new Date();
  const candidates: Slot[] = [];
  
  for (const block of freeBlocks) {
    const len = differenceInMinutes(block.endsAt, block.startsAt);
    if (len < minMinutes) continue;

    // slice to minMinutes windows and score them
    const starts = block.startsAt;
    const ends = addMinutes(starts, minMinutes);
    if (!isBefore(starts, ends)) continue;

    const score = computeScore({ 
      starts, 
      ends, 
      eventDate: event.startTime ?? now 
    });
    
    candidates.push({ 
      startsAt: starts, 
      endsAt: ends, 
      score, 
      provider: 'internal' 
    });
  }

  // 4) Sort + return top N
  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, maxSuggestions);
}

function computeScore({ 
  starts, 
  ends, 
  eventDate 
}: {
  starts: Date;
  ends: Date;
  eventDate: Date;
}) {
  // Simple V1 score: closer to event date + morning preference
  const proximity = 1 / (Math.abs((eventDate.getTime() - starts.getTime()) / 36e5) + 1); // hours distance
  const hour = starts.getHours();
  const morning = hour >= 8 && hour <= 12 ? 1 : 0.8;
  return proximity * morning;
}

// Mock implementations for now - replace with your actual calendar busy logic
async function getStoreHours(userId: string, eventDate: Date): Promise<{ startsAt: Date; endsAt: Date }[]> {
  // Mock store hours: 8 AM to 6 PM
  const dayStart = startOfDay(eventDate);
  const dayEnd = endOfDay(eventDate);
  
  return [
    {
      startsAt: new Date(dayStart.getTime() + 8 * 60 * 60 * 1000), // 8 AM
      endsAt: new Date(dayStart.getTime() + 18 * 60 * 60 * 1000)   // 6 PM
    }
  ];
}

async function getBusyBlocks(userId: string, windowDays: number): Promise<{ startsAt: Date; endsAt: Date }[]> {
  // Mock busy blocks - in real implementation, this would query your calendar integrations
  const now = new Date();
  const busyBlocks: { startsAt: Date; endsAt: Date }[] = [];
  
  // Add some mock busy times
  for (let i = 0; i < windowDays; i++) {
    const day = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    
    // Mock: busy from 12-1 PM each day
    busyBlocks.push({
      startsAt: new Date(day.getTime() + 12 * 60 * 60 * 1000),
      endsAt: new Date(day.getTime() + 13 * 60 * 60 * 1000)
    });
  }
  
  return busyBlocks;
}

function buildFreeBlocks(
  hours: { startsAt: Date; endsAt: Date }[],
  busy: { startsAt: Date; endsAt: Date }[]
): { startsAt: Date; endsAt: Date }[] {
  // Simple implementation: subtract busy blocks from store hours
  const freeBlocks: { startsAt: Date; endsAt: Date }[] = [];
  
  for (const hourBlock of hours) {
    let currentStart = hourBlock.startsAt;
    
    // Sort busy blocks by start time
    const sortedBusy = busy
      .filter(b => b.startsAt >= hourBlock.startsAt && b.endsAt <= hourBlock.endsAt)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    
    for (const busyBlock of sortedBusy) {
      // Add free block before this busy block
      if (currentStart < busyBlock.startsAt) {
        freeBlocks.push({
          startsAt: currentStart,
          endsAt: busyBlock.startsAt
        });
      }
      currentStart = busyBlock.endsAt;
    }
    
    // Add remaining free block
    if (currentStart < hourBlock.endsAt) {
      freeBlocks.push({
        startsAt: currentStart,
        endsAt: hourBlock.endsAt
      });
    }
  }
  
  return freeBlocks;
}
