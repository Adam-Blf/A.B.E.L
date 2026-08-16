import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Settings {
  theme: 'dark' | 'light'
  language: 'fr' | 'en'
  notifications: boolean
  soundEffects: boolean
  voiceEnabled: boolean
  voiceSpeed: number
  voiceType: string
  autoSpeak: boolean
  showTimestamps: boolean
  compactMode: boolean
}

interface SystemStatus {
  connected: boolean
  uptime: string
  activeConnections: number
  llmStatus: 'active' | 'mock' | 'offline'
  dbStatus: 'active' | 'offline'
  lastChecked: number | null
}

interface AbelStore {
  // Settings
  settings: Settings
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  resetSettings: () => void

  // Session
  sessionId: string
  messageCount: number
  incrementMessageCount: () => void

  // System status
  status: SystemStatus
  setStatus: (status: Partial<SystemStatus>) => void

  // UI state
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const defaultSettings: Settings = {
  theme: 'dark',
  language: 'fr',
  notifications: true,
  soundEffects: true,
  voiceEnabled: false,
  voiceSpeed: 1,
  voiceType: 'onyx',
  autoSpeak: false,
  showTimestamps: true,
  compactMode: false,
}

// Generate or reuse a persistent session ID
const getSessionId = (): string => {
  const stored = localStorage.getItem('abel-session-id')
  if (stored) return stored
  const id = `abel-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  localStorage.setItem('abel-session-id', id)
  return id
}

export const useStore = create<AbelStore>()(
  persist(
    (set, get) => ({
      // Settings
      settings: defaultSettings,
      updateSetting: (key, value) =>
        set((state) => ({
          settings: { ...state.settings, [key]: value }
        })),
      resetSettings: () => set({ settings: defaultSettings }),

      // Session
      sessionId: getSessionId(),
      messageCount: 0,
      incrementMessageCount: () =>
        set((state) => ({ messageCount: state.messageCount + 1 })),

      // System status
      status: {
        connected: false,
        uptime: '00:00:00',
        activeConnections: 0,
        llmStatus: 'offline',
        dbStatus: 'offline',
        lastChecked: null,
      },
      setStatus: (partial) =>
        set((state) => ({
          status: { ...state.status, ...partial }
        })),

      // UI state
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'abel-store',
      partialize: (state) => ({
        settings: state.settings,
        messageCount: state.messageCount,
      }),
    }
  )
)
