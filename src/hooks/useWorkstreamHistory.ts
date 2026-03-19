import { useCallback, useMemo, useRef, useState } from 'react';
import type { Edge, Node } from '@xyflow/react';

interface Snapshot {
  nodes: Node[];
  edges: Edge[];
}

export function useWorkstreamHistory(initial: Snapshot) {
  const [index, setIndex] = useState(0);
  const [entries, setEntries] = useState<Snapshot[]>([initial]);
  const lockRef = useRef(false);

  const current = useMemo(() => entries[index] || initial, [entries, index, initial]);

  const push = useCallback((snapshot: Snapshot) => {
    if (lockRef.current) return;
    setEntries((prev) => {
      const base = prev.slice(0, index + 1);
      return [...base, snapshot];
    });
    setIndex((prev) => prev + 1);
  }, [index]);

  const undo = useCallback(() => {
    setIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const redo = useCallback(() => {
    setIndex((prev) => Math.min(entries.length - 1, prev + 1));
  }, [entries.length]);

  const replaceCurrent = useCallback((snapshot: Snapshot) => {
    lockRef.current = true;
    setEntries((prev) => {
      const copy = [...prev];
      copy[index] = snapshot;
      return copy;
    });
    queueMicrotask(() => {
      lockRef.current = false;
    });
  }, [index]);

  return {
    current,
    canUndo: index > 0,
    canRedo: index < entries.length - 1,
    push,
    undo,
    redo,
    replaceCurrent,
  };
}
