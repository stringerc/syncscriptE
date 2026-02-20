import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router';

interface TransitionContextValue {
  navigateWithParticles: (to: string) => void;
}

const TransitionContext = createContext<TransitionContextValue>({
  navigateWithParticles: () => {},
});

export const useParticleTransition = () => useContext(TransitionContext);

export function ParticleTransitionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const navigate = useNavigate();

  const navigateWithParticles = useCallback(
    (to: string) => {
      navigate(to);
    },
    [navigate],
  );

  return (
    <TransitionContext.Provider value={{ navigateWithParticles }}>
      {children}
    </TransitionContext.Provider>
  );
}
