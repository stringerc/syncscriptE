import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CoherenceGrid,
  getCoherenceGrid,
  type AgentSignal,
  type CollapsedResult,
  type InterferenceType,
} from '../lib/coherence-grid';

export interface CoherenceState {
  topics: string[];
  signalsByTopic: Record<string, AgentSignal[]>;
  lastCollapse: CollapsedResult | null;
  coherenceWarnings: Array<{ topic: string; score: number; interference: InterferenceType }>;
}

export function useCoherenceGrid() {
  const gridRef = useRef<CoherenceGrid>(getCoherenceGrid());
  const [state, setState] = useState<CoherenceState>({
    topics: [],
    signalsByTopic: {},
    lastCollapse: null,
    coherenceWarnings: [],
  });

  // Subscribe to grid events
  useEffect(() => {
    const grid = gridRef.current;
    const unsubscribe = grid.on((event, data) => {
      if (event === 'collapse') {
        const result = data as CollapsedResult;
        setState(prev => ({
          ...prev,
          lastCollapse: result,
          // Add a warning if coherence is low
          coherenceWarnings:
            result.coherenceScore < 0.6
              ? [
                  ...prev.coherenceWarnings.slice(-9), // keep last 10
                  { topic: result.topic, score: result.coherenceScore, interference: result.interference },
                ]
              : prev.coherenceWarnings,
        }));
      }
      // Refresh topic list on any event
      setState(prev => ({
        ...prev,
        topics: grid.getTopics(),
      }));
    });
    return unsubscribe;
  }, []);

  const postSignal = useCallback((signal: Omit<AgentSignal, 'timestamp'>) => {
    gridRef.current.postSignal({ ...signal, timestamp: Date.now() });
    // Update signalsByTopic for the caller
    setState(prev => ({
      ...prev,
      signalsByTopic: {
        ...prev.signalsByTopic,
        [signal.topic.toLowerCase()]: gridRef.current.getSignals(signal.topic),
      },
    }));
  }, []);

  const collapseTopic = useCallback((topic: string): CollapsedResult => {
    const result = gridRef.current.collapse(topic);
    setState(prev => ({ ...prev, lastCollapse: result }));
    return result;
  }, []);

  const clearTopic = useCallback((topic: string) => {
    gridRef.current.clearTopic(topic);
    setState(prev => ({
      ...prev,
      topics: gridRef.current.getTopics(),
      signalsByTopic: {
        ...prev.signalsByTopic,
        [topic.toLowerCase()]: [],
      },
    }));
  }, []);

  return {
    ...state,
    grid: gridRef.current,
    postSignal,
    collapseTopic,
    clearTopic,
  };
}
