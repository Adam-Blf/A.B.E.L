import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  MessageSquare,
  Home,
  Settings,
  FileText,
  Zap,
  Trash2,
  Volume2,
  VolumeX,
  Moon,
  Globe,
  Terminal,
  ArrowRight,
  Search,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useStore } from '@/store/useStore'

interface Command {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  action: () => void
  keywords: string[]
  category: string
}

interface CommandPaletteProps {
  onClearChat?: () => void
}

export function CommandPalette({ onClearChat }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { commandPaletteOpen, setCommandPaletteOpen, settings, updateSetting } = useStore()

  const close = useCallback(() => {
    setCommandPaletteOpen(false)
    setQuery('')
    setSelectedIndex(0)
  }, [setCommandPaletteOpen])

  const commands: Command[] = [
    // Navigation
    {
      id: 'nav-home',
      label: 'Dashboard',
      description: 'Aller au Command Center',
      icon: <Home className="w-4 h-4" />,
      action: () => { navigate('/'); close() },
      keywords: ['home', 'dashboard', 'accueil', 'command center'],
      category: 'Navigation',
    },
    {
      id: 'nav-chat',
      label: 'Chat A.B.E.L',
      description: 'Ouvrir la conversation',
      icon: <MessageSquare className="w-4 h-4" />,
      action: () => { navigate('/chat'); close() },
      keywords: ['chat', 'conversation', 'message', 'parler'],
      category: 'Navigation',
    },
    {
      id: 'nav-settings',
      label: 'Paramètres',
      description: 'Configuration & préférences',
      icon: <Settings className="w-4 h-4" />,
      action: () => { navigate('/settings'); close() },
      keywords: ['settings', 'paramètres', 'configuration', 'préférences'],
      category: 'Navigation',
    },
    {
      id: 'nav-models',
      label: 'Modèles LLM',
      description: 'Ollama, Groq, OpenAI — config',
      icon: <Zap className="w-4 h-4 text-neon-green" />,
      action: () => { navigate('/models'); close() },
      keywords: ['models', 'modèles', 'llm', 'ollama', 'groq', 'openai', 'ia', 'ml'],
      category: 'Navigation',
    },
    {
      id: 'nav-system',
      label: 'Système',
      description: 'Documentation & statut',
      icon: <FileText className="w-4 h-4" />,
      action: () => { navigate('/system'); close() },
      keywords: ['system', 'système', 'docs', 'documentation', 'statut'],
      category: 'Navigation',
    },
    // Actions
    {
      id: 'action-clear',
      label: 'Effacer le chat',
      description: 'Supprimer tout l\'historique',
      icon: <Trash2 className="w-4 h-4 text-red-400" />,
      action: () => { onClearChat?.(); close() },
      keywords: ['clear', 'effacer', 'supprimer', 'reset', 'historique'],
      category: 'Actions',
    },
    {
      id: 'action-voice',
      label: settings.voiceEnabled ? 'Désactiver la voix' : 'Activer la voix',
      description: 'Bascule la synthèse vocale',
      icon: settings.voiceEnabled ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />,
      action: () => { updateSetting('voiceEnabled', !settings.voiceEnabled); close() },
      keywords: ['voice', 'voix', 'audio', 'tts', 'speech'],
      category: 'Actions',
    },
    {
      id: 'action-autospeak',
      label: settings.autoSpeak ? 'Désactiver lecture auto' : 'Activer lecture auto',
      description: 'Lire automatiquement les réponses',
      icon: <Zap className="w-4 h-4" />,
      action: () => { updateSetting('autoSpeak', !settings.autoSpeak); close() },
      keywords: ['autospeak', 'lecture', 'auto', 'automatique', 'speak'],
      category: 'Actions',
    },
    // Settings shortcuts
    {
      id: 'set-fr',
      label: 'Langue: Français',
      description: 'Passer en français',
      icon: <Globe className="w-4 h-4" />,
      action: () => { updateSetting('language', 'fr'); close() },
      keywords: ['français', 'french', 'langue', 'language', 'fr'],
      category: 'Paramètres',
    },
    {
      id: 'set-en',
      label: 'Language: English',
      description: 'Switch to English',
      icon: <Globe className="w-4 h-4" />,
      action: () => { updateSetting('language', 'en'); close() },
      keywords: ['english', 'anglais', 'langue', 'language', 'en'],
      category: 'Paramètres',
    },
    {
      id: 'set-dark',
      label: 'Thème: Sombre',
      description: 'Mode cyberpunk (défaut)',
      icon: <Moon className="w-4 h-4" />,
      action: () => { updateSetting('theme', 'dark'); close() },
      keywords: ['dark', 'sombre', 'thème', 'theme', 'nuit'],
      category: 'Paramètres',
    },
    {
      id: 'set-compact',
      label: settings.compactMode ? 'Mode normal' : 'Mode compact',
      description: 'Réduire l\'espacement de l\'interface',
      icon: <Terminal className="w-4 h-4" />,
      action: () => { updateSetting('compactMode', !settings.compactMode); close() },
      keywords: ['compact', 'dense', 'mode', 'espacement'],
      category: 'Paramètres',
    },
  ]

  // Filter commands based on query
  const filtered = query.trim()
    ? commands.filter((cmd) => {
        const q = query.toLowerCase()
        return (
          cmd.label.toLowerCase().includes(q) ||
          cmd.description?.toLowerCase().includes(q) ||
          cmd.keywords.some((k) => k.includes(q))
        )
      })
    : commands

  // Group by category
  const grouped = filtered.reduce<Record<string, Command[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = []
    acc[cmd.category].push(cmd)
    return acc
  }, {})

  // Flatten for keyboard navigation
  const flatCommands = Object.values(grouped).flat()

  // Open with Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
        close()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [commandPaletteOpen, close, setCommandPaletteOpen])

  // Focus input when opened
  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [commandPaletteOpen])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, flatCommands.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      flatCommands[selectedIndex]?.action()
    }
  }

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Scroll selected item into view
  useEffect(() => {
    const items = listRef.current?.querySelectorAll('[data-command-item]')
    items?.[selectedIndex]?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  let flatIndex = 0

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={close}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50"
          >
            <div className="bg-abel-surface/95 border border-neon-cyan/30 rounded-2xl shadow-neon-cyan overflow-hidden backdrop-blur-xl">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
                <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Rechercher une commande..."
                  className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-sm"
                />
                <kbd className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 border border-white/10 text-white/30 text-xs font-mono">
                  ESC
                </kbd>
              </div>

              {/* Commands list */}
              <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
                {Object.entries(grouped).length === 0 ? (
                  <div className="py-8 text-center text-white/40 text-sm">
                    Aucune commande trouvée
                  </div>
                ) : (
                  Object.entries(grouped).map(([category, cmds]) => (
                    <div key={category} className="mb-2">
                      <p className="px-3 py-1 text-xs text-white/30 uppercase tracking-wider font-mono">
                        {category}
                      </p>
                      {cmds.map((cmd) => {
                        const isSelected = flatIndex === selectedIndex
                        const currentIndex = flatIndex++
                        return (
                          <button
                            key={cmd.id}
                            data-command-item
                            onClick={cmd.action}
                            onMouseEnter={() => setSelectedIndex(currentIndex)}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all',
                              isSelected
                                ? 'bg-neon-cyan/10 text-white'
                                : 'text-white/70 hover:bg-white/5 hover:text-white'
                            )}
                          >
                            <span className={cn('flex-shrink-0', isSelected ? 'text-neon-cyan' : 'text-white/40')}>
                              {cmd.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{cmd.label}</p>
                              {cmd.description && (
                                <p className="text-xs text-white/40 truncate">{cmd.description}</p>
                              )}
                            </div>
                            {isSelected && (
                              <ArrowRight className="w-3 h-3 text-neon-cyan/60 flex-shrink-0" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between">
                <p className="text-xs text-white/20">
                  {flatCommands.length} commande{flatCommands.length !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-3 text-xs text-white/20">
                  <span><kbd className="font-mono">↑↓</kbd> naviguer</span>
                  <span><kbd className="font-mono">↵</kbd> exécuter</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
