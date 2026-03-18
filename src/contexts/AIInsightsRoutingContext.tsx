import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { normalizeRouteContext, type AIRouteContext } from '../utils/ai-route';

interface AIInsightsRoutingValue {
  routeContext: AIRouteContext | null;
  setRouteContext: (next: AIRouteContext | null) => void;
  openRequestedAt: number;
  requestOpen: (next?: AIRouteContext | null) => void;
}

const AIInsightsRoutingContext = createContext<AIInsightsRoutingValue | null>(null);

export function AIInsightsRoutingProvider({ children }: { children: ReactNode }) {
  const [routeContext, setRouteContextState] = useState<AIRouteContext | null>(null);
  const [openRequestedAt, setOpenRequestedAt] = useState(0);

  const setRouteContext = useCallback((next: AIRouteContext | null) => {
    setRouteContextState(normalizeRouteContext(next));
  }, []);

  const requestOpen = useCallback((next?: AIRouteContext | null) => {
    if (next !== undefined) {
      setRouteContextState(normalizeRouteContext(next));
    }
    setOpenRequestedAt(Date.now());
  }, []);

  const value = useMemo<AIInsightsRoutingValue>(
    () => ({
      routeContext,
      setRouteContext,
      openRequestedAt,
      requestOpen,
    }),
    [openRequestedAt, requestOpen, routeContext, setRouteContext]
  );

  return (
    <AIInsightsRoutingContext.Provider value={value}>
      {children}
    </AIInsightsRoutingContext.Provider>
  );
}

export function useAIInsightsRouting(): AIInsightsRoutingValue {
  const value = useContext(AIInsightsRoutingContext);
  if (value) return value;
  return {
    routeContext: null,
    setRouteContext: () => {},
    openRequestedAt: 0,
    requestOpen: () => {},
  };
}
