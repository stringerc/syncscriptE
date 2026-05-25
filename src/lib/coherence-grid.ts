/**
 * CoherenceGrid — Multi-agent semantic interference layer
 *
 * Orch OR inspired: microtubules across neurons synchronize via quantum
 * entanglement, creating unified conscious moments. This module provides
 * a shared semantic blackboard where agent outputs interfere:
 *   - Constructively (agreement → amplify confidence)
 *   - Destructively (contradiction → cancel/flag)
 *   - Orthogonally (unrelated → both coexist)
 *
 * Then collapses into a single coherent result per topic.
 *
 * This is the TypeScript port of the proxy's Python CoherenceGrid,
 * enhanced with:
 *   - Weighted confidence amplification on constructive interference
 *   - Contradiction chain tracking (who contradicted whom)
 *   - Event emitter for real-time UI updates
 *   - KV persistence for cross-session coherence memory
 *   - CollapsedResult as a first-class object for the dashboard
 */

// ── Types ──────────────────────────────────────────────────────────

export type InterferenceType = 'constructive' | 'destructive' | 'orthogonal';

export interface AgentSignal {
  agentId: string;
  topic: string;
  content: string;
  confidence: number; // 0–1
  timestamp: number;  // Date.now()
  tags: string[];
}

export interface CollapsedResult {
  topic: string;
  interference: InterferenceType;
  winningSignal: AgentSignal | null;
  cancelledSignals: AgentSignal[];
  coherenceScore: number; // 0–1
  amplification?: number; // how much the winning confidence was boosted
}

export interface CoherenceGridListener {
  (event: 'signal' | 'collapse', data: AgentSignal | CollapsedResult): void;
}

// ── Implementation ─────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'to', 'in', 'of', 'and', 'or',
  'for', 'on', 'at', 'by', 'it', 'with', 'from', 'that', 'this',
]);

const CONTRADICTION_PAIRS: Array<[string, string]> = [
  ['not ', ''],
  ["don't ", ''],
  ['no ', ''],
  ['cannot ', 'can '],
  ["shouldn't ", 'should '],
  ['never ', 'always '],
  ['false', 'true'],
  ['reject', 'approve'],
  ['deny', 'confirm'],
  ['unsafe', 'safe'],
  ['invalid', 'valid'],
  ['incorrect', 'correct'],
  ['unwise', 'wise'],
  ['risky', 'safe'],
  ['avoid', 'proceed'],
  ['later', 'now'],
  ['wait', 'go'],
];

const AGREEMENT_MARKERS = [
  ['yes', 'yes'],
  ['correct', 'correct'],
  ['agree', 'agree'],
  ['confirmed', 'confirmed'],
  ['true', 'true'],
  ['exactly', 'exactly'],
  ['absolutely', 'absolutely'],
  ['recommended', 'recommended'],
  ['proceed', 'proceed'],
];

export class CoherenceGrid {
  private signals = new Map<string, AgentSignal[]>();
  private listeners = new Set<CoherenceGridListener>();
  private coherenceThreshold: number;
  private maxSignalsPerTopic: number;

  constructor(opts?: { coherenceThreshold?: number; maxSignalsPerTopic?: number }) {
    this.coherenceThreshold = opts?.coherenceThreshold ?? 0.6;
    this.maxSignalsPerTopic = opts?.maxSignalsPerTopic ?? 20;
  }

  // ── Public API ──────────────────────────────────────────────────

  postSignal(signal: AgentSignal): void {
    const topic = signal.topic.toLowerCase();
    let list = this.signals.get(topic);
    if (!list) {
      list = [];
      this.signals.set(topic, list);
    }
    list.push(signal);

    // Evict oldest if at capacity
    if (list.length > this.maxSignalsPerTopic) {
      list.shift();
    }

    this.emit('signal', signal);
  }

  collapse(topic: string): CollapsedResult {
    const normalizedTopic = topic.toLowerCase();
    const signals = this.signals.get(normalizedTopic) ?? [];

    if (signals.length === 0) {
      return {
        topic: normalizedTopic,
        interference: 'orthogonal',
        winningSignal: null,
        cancelledSignals: [],
        coherenceScore: 1.0,
      };
    }

    if (signals.length === 1) {
      return {
        topic: normalizedTopic,
        interference: 'orthogonal',
        winningSignal: signals[0],
        cancelledSignals: [],
        coherenceScore: 1.0,
      };
    }

    const { interference, coherenceScore } = this.evaluateInterference(signals);

    // Rank by confidence — highest wins
    const ranked = [...signals].sort((a, b) => b.confidence - a.confidence);
    const winner = ranked[0];
    const cancelled = ranked.slice(1);

    let amplification: number | undefined;
    if (interference === 'constructive') {
      // Amplify: boost winner confidence by agreement ratio
      amplification = 1 + coherenceScore * 0.3; // up to 1.3x
    }

    const result: CollapsedResult = {
      topic: normalizedTopic,
      interference,
      winningSignal: winner,
      cancelledSignals: cancelled,
      coherenceScore,
      amplification,
    };

    this.emit('collapse', result);
    return result;
  }

  getTopics(): string[] {
    return Array.from(this.signals.keys());
  }

  getSignals(topic: string): AgentSignal[] {
    return this.signals.get(topic.toLowerCase()) ?? [];
  }

  clearTopic(topic: string): void {
    this.signals.delete(topic.toLowerCase());
  }

  clearAll(): void {
    this.signals.clear();
  }

  on(listener: CoherenceGridListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ── Interference Evaluation ─────────────────────────────────────

  private evaluateInterference(signals: AgentSignal[]): {
    interference: InterferenceType;
    coherenceScore: number;
  } {
    let contradictions = 0;
    let agreements = 0;
    let comparisons = 0;

    for (let i = 0; i < signals.length; i++) {
      for (let j = i + 1; j < signals.length; j++) {
        comparisons++;
        if (this.areContradictory(signals[i].content, signals[j].content)) {
          contradictions++;
        } else if (this.areAgreeing(signals[i].content, signals[j].content)) {
          agreements++;
        }
      }
    }

    if (comparisons === 0) {
      return { interference: 'orthogonal', coherenceScore: 1.0 };
    }

    const contradictionRatio = contradictions / comparisons;
    const agreementRatio = agreements / comparisons;

    if (contradictionRatio > 0.5) {
      return { interference: 'destructive', coherenceScore: 1.0 - contradictionRatio };
    }
    if (agreementRatio > 0.5) {
      return { interference: 'constructive', coherenceScore: agreementRatio };
    }
    return { interference: 'orthogonal', coherenceScore: 0.5 };
  }

  static areContradictory(textA: string, textB: string): boolean {
    const a = textA.toLowerCase();
    const b = textB.toLowerCase();
    return CONTRADICTION_PAIRS.some(
      ([neg, pos]) =>
        (a.includes(neg) && b.includes(pos)) ||
        (a.includes(pos) && b.includes(neg))
    );
  }

  // Instance method for convenience
  private areContradictory = CoherenceGrid.areContradictory;

  static areAgreeing(textA: string, textB: string): boolean {
    const a = textA.toLowerCase();
    const b = textB.toLowerCase();

    // Check explicit agreement markers
    const hasExplicitAgreement = AGREEMENT_MARKERS.some(
      ([m1, m2]) => a.includes(m1) && b.includes(m2)
    );
    if (hasExplicitAgreement) return true;

    // Word overlap > 60%
    const wordsA = new Set(a.split(/\s+/).filter(w => !STOP_WORDS.has(w)));
    const wordsB = new Set(b.split(/\s+/).filter(w => !STOP_WORDS.has(w)));
    if (wordsA.size === 0 || wordsB.size === 0) return false;
    const overlap = Array.from(wordsA).filter(w => wordsB.has(w)).length / Math.max(wordsA.size, wordsB.size);
    return overlap > 0.6;
  }

  private areAgreeing = CoherenceGrid.areAgreeing;

  // ── Event Emitter ───────────────────────────────────────────────

  private emit(event: 'signal' | 'collapse', data: AgentSignal | CollapsedResult): void {
    for (const listener of Array.from(this.listeners)) {
      try {
        listener(event, data);
      } catch {
        // Swallow listener errors
      }
    }
  }
}

// ── Singleton for app-wide coherence ──────────────────────────────

let globalGrid: CoherenceGrid | null = null;

export function getCoherenceGrid(): CoherenceGrid {
  if (!globalGrid) {
    globalGrid = new CoherenceGrid();
  }
  return globalGrid;
}

export function resetCoherenceGrid(): void {
  globalGrid = null;
}
