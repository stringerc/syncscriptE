/**
 * Voice Memory System
 * 
 * Persistent conversation memory using localStorage (Phase 1-2)
 * and Supabase (Phase 3+) for cross-device sync.
 * 
 * Implements Memoria/ENGRAM-inspired patterns:
 * - Episodic memory: remembers specific conversations
 * - Semantic memory: extracts facts and preferences
 * - Procedural memory: learns user patterns and routines
 */

import type {
  VoiceMemoryEntry,
  VoiceMemoryStore,
  VoiceUserProfile,
  VoiceMessage,
  VoiceSession,
} from '../types/voice-engine';

const STORAGE_KEY = 'syncscript-voice-memory';
const MAX_ENTRIES = 200;

// ============================================================================
// STORE MANAGEMENT
// ============================================================================

function loadStore(): VoiceMemoryStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Corrupted data, start fresh
  }
  
  return {
    entries: [],
    lastAccessed: Date.now(),
    totalSessions: 0,
    userProfile: {},
  };
}

function saveStore(store: VoiceMemoryStore): void {
  try {
    // Trim if over limit
    if (store.entries.length > MAX_ENTRIES) {
      store.entries = store.entries
        .sort((a, b) => b.importance - a.importance)
        .slice(0, MAX_ENTRIES);
    }
    store.lastAccessed = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage full, try to trim more aggressively
    store.entries = store.entries.slice(0, MAX_ENTRIES / 2);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // Give up silently
    }
  }
}

// ============================================================================
// MEMORY EXTRACTION
// ============================================================================

function extractMemories(session: VoiceSession): VoiceMemoryEntry[] {
  const memories: VoiceMemoryEntry[] = [];
  const sessionId = session.id;

  for (const msg of session.messages) {
    if (msg.role !== 'user') continue;
    const text = msg.text.toLowerCase();

    // Extract preferences
    if (text.includes('prefer') || text.includes('like to') || text.includes('always') || text.includes('usually')) {
      memories.push({
        id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        sessionId,
        timestamp: msg.timestamp,
        type: 'preference',
        content: msg.text,
        importance: 0.7,
        tags: ['preference'],
      });
    }

    // Extract requests/commitments
    if (text.includes('remind me') || text.includes('don\'t forget') || text.includes('i need to') || text.includes('i want to')) {
      memories.push({
        id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        sessionId,
        timestamp: msg.timestamp,
        type: 'request',
        content: msg.text,
        importance: 0.8,
        tags: ['request', 'action-item'],
      });
    }

    // Extract facts about the user
    if (text.includes('i am') || text.includes('i\'m') || text.includes('my ') || text.includes('i have')) {
      memories.push({
        id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        sessionId,
        timestamp: msg.timestamp,
        type: 'fact',
        content: msg.text,
        importance: 0.6,
        tags: ['fact', 'personal'],
      });
    }
  }

  // Extract emotion patterns from the session
  if (session.emotionTimeline.length > 0) {
    const emotionCounts: Record<string, number> = {};
    for (const snapshot of session.emotionTimeline) {
      emotionCounts[snapshot.emotion.primary] = (emotionCounts[snapshot.emotion.primary] || 0) + 1;
    }

    const dominantEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0];
    if (dominantEmotion && dominantEmotion[0] !== 'neutral') {
      memories.push({
        id: `mem-${Date.now()}-emotion`,
        sessionId,
        timestamp: Date.now(),
        type: 'emotion-pattern',
        content: `During this session, the user was predominantly ${dominantEmotion[0]} (${dominantEmotion[1]} readings)`,
        importance: 0.5,
        tags: ['emotion', dominantEmotion[0]],
      });
    }
  }

  return memories;
}

// ============================================================================
// PUBLIC API
// ============================================================================

export const voiceMemory = {
  /**
   * Save a completed voice session and extract memories
   */
  saveSession(session: VoiceSession): void {
    const store = loadStore();
    store.totalSessions += 1;

    const newMemories = extractMemories(session);
    store.entries.push(...newMemories);

    // Update user profile
    updateUserProfile(store, session);

    saveStore(store);
  },

  /**
   * Get relevant memories for a given query/context
   */
  getRelevantMemories(query: string, limit = 5): VoiceMemoryEntry[] {
    const store = loadStore();
    const queryWords = query.toLowerCase().split(/\s+/);

    // Score each memory by relevance to the query
    const scored = store.entries.map(entry => {
      const entryWords = entry.content.toLowerCase().split(/\s+/);
      let score = entry.importance;

      // Word overlap scoring
      for (const word of queryWords) {
        if (word.length < 3) continue;
        if (entryWords.some(w => w.includes(word) || word.includes(w))) {
          score += 0.3;
        }
      }

      // Tag matching
      for (const tag of entry.tags || []) {
        if (queryWords.includes(tag)) {
          score += 0.5;
        }
      }

      // Recency bonus (memories from last 7 days get a boost)
      const ageInDays = (Date.now() - entry.timestamp) / (1000 * 60 * 60 * 24);
      if (ageInDays < 7) score += 0.2;
      if (ageInDays < 1) score += 0.3;

      return { entry, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.entry);
  },

  /**
   * Get the user's voice profile
   */
  getUserProfile(): VoiceUserProfile {
    const store = loadStore();
    return store.userProfile;
  },

  /**
   * Get all memories of a specific type
   */
  getByType(type: VoiceMemoryEntry['type'], limit = 10): VoiceMemoryEntry[] {
    const store = loadStore();
    return store.entries
      .filter(e => e.type === type)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  },

  /**
   * Get memory context string for the AI prompt
   */
  getMemoryContext(currentMessage: string): string {
    const relevant = voiceMemory.getRelevantMemories(currentMessage, 3);
    const profile = voiceMemory.getUserProfile();
    const store = loadStore();

    if (relevant.length === 0 && store.totalSessions === 0) {
      return '';
    }

    let context = '\nUSER MEMORY (from past conversations):\n';
    
    if (store.totalSessions > 0) {
      context += `Total past voice sessions: ${store.totalSessions}\n`;
    }

    if (profile.communicationStyle) {
      context += `Preferred communication style: ${profile.communicationStyle}\n`;
    }

    if (profile.commonTopics?.length) {
      context += `Common topics: ${profile.commonTopics.join(', ')}\n`;
    }

    if (relevant.length > 0) {
      context += 'Relevant memories:\n';
      for (const mem of relevant) {
        const age = Math.round((Date.now() - mem.timestamp) / (1000 * 60 * 60 * 24));
        context += `  - [${mem.type}, ${age}d ago] ${mem.content}\n`;
      }
    }

    return context;
  },

  /**
   * Clear all voice memories
   */
  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  },

  /**
   * Get total session count
   */
  getSessionCount(): number {
    const store = loadStore();
    return store.totalSessions;
  },
};

// ============================================================================
// PROFILE UPDATER
// ============================================================================

function updateUserProfile(store: VoiceMemoryStore, session: VoiceSession): void {
  const profile = store.userProfile;
  const userMessages = session.messages.filter(m => m.role === 'user');

  // Detect communication style from message lengths
  if (userMessages.length > 0) {
    const avgLength = userMessages.reduce((sum, m) => sum + m.text.length, 0) / userMessages.length;
    if (avgLength < 30) {
      profile.communicationStyle = 'concise';
    } else if (avgLength > 100) {
      profile.communicationStyle = 'detailed';
    }
  }

  // Track conversation times
  const hour = new Date(session.startedAt).getHours();
  if (!profile.peakConversationTimes) profile.peakConversationTimes = [];
  profile.peakConversationTimes.push(hour);
  // Keep last 20
  if (profile.peakConversationTimes.length > 20) {
    profile.peakConversationTimes = profile.peakConversationTimes.slice(-20);
  }

  // Track emotion patterns
  if (!profile.emotionPatterns) profile.emotionPatterns = {};
  for (const snapshot of session.emotionTimeline) {
    const emotion = snapshot.emotion.primary;
    profile.emotionPatterns[emotion] = (profile.emotionPatterns[emotion] || 0) + 1;
  }

  store.userProfile = profile;
}
