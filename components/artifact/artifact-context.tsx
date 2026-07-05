'use client'

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useReducer
} from 'react'

import type { Part } from '@/lib/types/ai'

import { useLibrary } from '../library/library-context'
import { useSidebar } from '../ui/sidebar'

// Animation duration should match the inspector panel exit transition.
const ANIMATION_DURATION = 260

interface ArtifactState {
  part: Part | null
  isOpen: boolean
}

type ArtifactAction =
  | { type: 'OPEN'; payload: Part }
  | { type: 'CLOSE' }
  | { type: 'CLEAR_CONTENT' }

const initialState: ArtifactState = {
  part: null,
  isOpen: false
}

function artifactReducer(
  state: ArtifactState,
  action: ArtifactAction
): ArtifactState {
  switch (action.type) {
    case 'OPEN':
      return { part: action.payload, isOpen: true }
    case 'CLOSE':
      return { ...state, isOpen: false }
    case 'CLEAR_CONTENT':
      return { part: null, isOpen: false }
    default:
      return state
  }
}

interface ArtifactContextValue {
  state: ArtifactState
  open: (part: Part) => void
  close: () => void
}

const ArtifactContext = createContext<ArtifactContextValue | undefined>(
  undefined
)

export function ArtifactProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(artifactReducer, initialState)
  const { setOpen, open: sidebarOpen } = useSidebar()
  const { isOpen: libraryOpen, closeLibrary } = useLibrary()

  const close = useCallback(() => {
    dispatch({ type: 'CLOSE' })
    // Keep content for animation purposes, clear after transition
    setTimeout(() => {
      dispatch({ type: 'CLEAR_CONTENT' })
    }, ANIMATION_DURATION)
  }, [])

  // Close artifact when sidebar opens
  useEffect(() => {
    if (sidebarOpen && state.isOpen) {
      close()
    }
    // LibraryProvider closes the sidebar before opening Library; this handles
    // the inverse path when the sidebar is opened while Library is visible.
    if (sidebarOpen && libraryOpen) {
      closeLibrary()
    }
  }, [sidebarOpen, state.isOpen, libraryOpen, close, closeLibrary])

  const open = (part: Part) => {
    closeLibrary()
    dispatch({ type: 'OPEN', payload: part })
    setOpen(false)
  }

  useEffect(() => {
    if (libraryOpen && state.isOpen) {
      close()
    }
  }, [libraryOpen, state.isOpen, close])

  return (
    <ArtifactContext.Provider value={{ state, open, close }}>
      {children}
    </ArtifactContext.Provider>
  )
}

// Inert fallback used when no ArtifactProvider is mounted (e.g. the
// FreePlanTour embedded modal, which skips the full app shell). Keeps
// consumers like search-section/answer-section safe to render standalone.
const noopArtifactContext: ArtifactContextValue = {
  state: initialState,
  open: () => {},
  close: () => {}
}

export function useArtifact() {
  const context = useContext(ArtifactContext)
  return context ?? noopArtifactContext
}

// Lets "inspect"-style UI (search/reasoning/todo section headers) decide
// whether to render an interactive trigger at all — calling the no-op
// `open()` above is safe but produces a dead click with no visible effect,
// which is worse than not offering the affordance in the first place.
export function useHasArtifactProvider(): boolean {
  return useContext(ArtifactContext) !== undefined
}
