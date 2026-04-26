import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'

/** Stable setter — pages register chrome without subscribing to display updates (avoids update loops). */
type SetMobileChatsToolbar = Dispatch<SetStateAction<ReactNode | null>>

const SetterContext = createContext<SetMobileChatsToolbar | null>(null)
const DisplayContext = createContext<ReactNode | null>(null)

export function AiPageChromeProvider({ children }: { children: ReactNode }) {
  const [mobileChatsToolbar, setMobileChatsToolbar] = useState<ReactNode | null>(null)
  const setMobileChatsToolbarStable = useCallback<SetMobileChatsToolbar>(
    (action) => {
      setMobileChatsToolbar(action)
    },
    []
  )

  const setterValue = useMemo(() => setMobileChatsToolbarStable, [setMobileChatsToolbarStable])

  return (
    <SetterContext.Provider value={setterValue}>
      <DisplayContext.Provider value={mobileChatsToolbar}>{children}</DisplayContext.Provider>
    </SetterContext.Provider>
  )
}

/** Only for headers / shell — reads the registered mobile toolbar node. */
export function useAiPageChromeMobileToolbar(): ReactNode | null {
  return useContext(DisplayContext)
}

/** Only App AI page — stable setter; does not re-render when toolbar display updates. */
export function useSetAiPageMobileChatsToolbar(): SetMobileChatsToolbar | null {
  return useContext(SetterContext)
}
