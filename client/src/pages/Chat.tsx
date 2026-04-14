import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Send,
  ArrowLeft,
  Mic,
  MicOff,
  Bot,
  User,
  Sparkles,
  Loader2,
  Wifi,
  WifiOff,
  Trash2,
  Copy,
  Volume2,
  VolumeX,
  Zap,
  ChevronDown,
  Terminal,
  MoreVertical,
} from 'lucide-react'
import { toast } from 'sonner'
import { GlassPanel, Button } from '@/components/ui'
import { MarkdownMessage } from '@/components/chat/MarkdownMessage'
import { cn } from '@/utils/cn'
import { useAbelChat } from '@/hooks/useAbelChat'
import { useVoice } from '@/hooks/useVoice'
import { useStore } from '@/store/useStore'

// Quick command suggestions
const QUICK_COMMANDS = [
  { label: '💡 Aide', prompt: 'Que peux-tu faire pour moi ?' },
  { label: '⚡ Statut', prompt: 'Quel est ton statut système ?' },
  { label: '💻 Code', prompt: 'Aide-moi à écrire du code Python' },
  { label: '🧠 ML', prompt: 'Explique-moi le machine learning en 5 points' },
  { label: '🌐 API', prompt: 'Quelles APIs ai-je à disposition ?' },
  { label: '📊 Data', prompt: 'Comment analyser un dataset avec pandas ?' },
]

// Clock component
function Clock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="font-mono text-xs text-white/30">
      {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  )
}

export default function Chat() {
  const { settings } = useStore()

  const {
    messages,
    isConnected,
    isThinking,
    sendMessage,
    clearHistory,
    reconnect,
    sessionId,
  } = useAbelChat({
    onConnect: () => toast.success('A.B.E.L connecté', { duration: 2000 }),
    onDisconnect: () => toast.error('Déconnexion détectée', { duration: 3000 }),
  })

  const {
    isListening,
    isSpeaking,
    isSupported: voiceSupported,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
  } = useVoice({
    language: settings.language === 'fr' ? 'fr-FR' : 'en-US',
    onTranscript: (text) => {
      setInput(text)
    },
    onError: (err) => toast.error(err),
  })

  const [input, setInput] = useState('')
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom
  const scrollToBottom = useCallback((force = false) => {
    if (!messagesContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150

    if (force || isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Show scroll button when not at bottom
  const handleScroll = () => {
    if (!messagesContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 300)
  }

  // Auto-speak last assistant message
  useEffect(() => {
    if (!settings.autoSpeak || !settings.voiceEnabled) return
    const last = messages[messages.length - 1]
    if (last?.role === 'assistant' && !last.isStreaming) {
      speak(last.content, settings.voiceSpeed, settings.voiceType)
    }
  }, [messages]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = () => {
    if (!input.trim() || isThinking || !isConnected) return
    sendMessage(input.trim())
    setInput('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleVoice = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const copyMessage = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success('Copié !', { duration: 1500 })
  }

  const speakMessage = (content: string) => {
    if (isSpeaking) {
      cancelSpeech()
    } else {
      speak(content, settings.voiceSpeed, settings.voiceType)
    }
  }

  const handleQuickCommand = (prompt: string) => {
    if (!isConnected || isThinking) return
    sendMessage(prompt)
  }

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const shortSessionId = sessionId.slice(-8)

  return (
    <div className="min-h-screen bg-abel-dark flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 bg-abel-surface/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>

          {/* AI avatar */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div
              className={cn(
                'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-abel-surface',
                isConnected ? 'bg-neon-green animate-pulse' : 'bg-red-500'
              )}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-white text-sm">A.B.E.L</h1>
              <span className="text-xs text-white/30 font-mono">v1.0</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('text-xs', isConnected ? 'text-neon-green' : 'text-red-400')}>
                {isConnected ? 'En ligne' : 'Déconnecté'}
              </span>
              <span className="text-white/20 text-xs">•</span>
              <span className="text-white/30 text-xs font-mono">#{shortSessionId}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock />

            {/* TTS toggle */}
            {voiceSupported && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (isSpeaking) cancelSpeech()
                  else if (messages.length > 0) {
                    const last = messages.filter(m => m.role === 'assistant').pop()
                    if (last) speakMessage(last.content)
                  }
                }}
                title={isSpeaking ? 'Arrêter la lecture' : 'Lire la dernière réponse'}
                className={cn(isSpeaking && 'text-neon-cyan bg-neon-cyan/10')}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearHistory()
                toast.info('Historique effacé')
              }}
              title="Effacer l'historique"
            >
              <Trash2 className="w-4 h-4" />
            </Button>

            {!isConnected && (
              <Button variant="danger" size="sm" onClick={reconnect} title="Reconnecter">
                <WifiOff className="w-4 h-4" />
              </Button>
            )}

            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neon-violet/10 border border-neon-violet/20">
              <Sparkles className="w-3 h-3 text-neon-violet" />
              <span className="text-xs text-neon-violet font-mono">GPT-4</span>
            </div>
          </div>
        </div>
      </header>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-6 px-4 scroll-smooth"
      >
        <div className="max-w-4xl mx-auto space-y-5">
          {/* Welcome screen */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-neon-cyan via-neon-violet to-neon-magenta mx-auto mb-6 flex items-center justify-center shadow-neon-cyan"
              >
                <Bot className="w-12 h-12 text-white" />
              </motion.div>
              <h2 className="text-3xl font-display font-bold text-white mb-2">
                Bonjour, je suis <span className="text-gradient-cyber">A.B.E.L</span>
              </h2>
              <p className="text-white/50 max-w-sm mx-auto mb-8 text-sm">
                Votre assistant IA personnel. Posez-moi une question, demandez du code, de l'analyse ML, ou utilisez une commande rapide.
              </p>

              {/* Quick command chips */}
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_COMMANDS.map((cmd) => (
                  <motion.button
                    key={cmd.label}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleQuickCommand(cmd.prompt)}
                    className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm hover:bg-neon-cyan/10 hover:border-neon-cyan/30 hover:text-neon-cyan transition-all"
                  >
                    {cmd.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Messages */}
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={cn('flex gap-3', message.role === 'user' && 'flex-row-reverse')}
                onMouseEnter={() => setHoveredId(message.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1',
                    message.role === 'user'
                      ? 'bg-neon-violet/20 text-neon-violet border border-neon-violet/30'
                      : message.role === 'system'
                      ? 'bg-neon-orange/20 text-neon-orange border border-neon-orange/30'
                      : 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                  )}
                >
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                {/* Message bubble */}
                <div className="max-w-[80%] group flex flex-col gap-1">
                  <GlassPanel
                    className={cn(
                      'p-4 relative',
                      message.role === 'user'
                        ? 'bg-neon-violet/10 border-neon-violet/20'
                        : message.role === 'system'
                        ? 'bg-neon-orange/5 border-neon-orange/20'
                        : 'bg-white/[0.04] border-white/10',
                      message.isStreaming && 'border-neon-cyan/40 shadow-neon-cyan/10'
                    )}
                    hoverGlow={false}
                    initial={false}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {message.role === 'user' ? (
                      <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    ) : (
                      <MarkdownMessage content={message.content} />
                    )}

                    {/* Streaming cursor */}
                    {message.isStreaming && (
                      <span className="inline-block w-2 h-4 bg-neon-cyan ml-1 animate-pulse align-middle" />
                    )}
                  </GlassPanel>

                  {/* Message actions + timestamp */}
                  <div
                    className={cn(
                      'flex items-center gap-2 px-1 transition-opacity duration-200',
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row',
                      hoveredId === message.id ? 'opacity-100' : 'opacity-0'
                    )}
                  >
                    <span className="text-xs text-white/20">
                      {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <button
                      onClick={() => copyMessage(message.id, message.content)}
                      className="p-1 rounded hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors"
                      title="Copier"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedId === message.id && (
                        <span className="absolute -top-5 text-xs bg-neon-cyan/20 text-neon-cyan px-1 rounded">✓</span>
                      )}
                    </button>

                    {message.role === 'assistant' && voiceSupported && (
                      <button
                        onClick={() => speakMessage(message.content)}
                        className="p-1 rounded hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors"
                        title={isSpeaking ? 'Arrêter' : 'Lire'}
                      >
                        {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Thinking indicator */}
          {isThinking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 flex items-center justify-center mt-1">
                <Bot className="w-4 h-4" />
              </div>
              <GlassPanel className="p-4" hoverGlow={false}>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-neon-cyan"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                  <span className="text-white/50 text-sm font-mono">A.B.E.L réfléchit...</span>
                </div>
              </GlassPanel>
            </motion.div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToBottom(true)}
            className="fixed bottom-24 right-6 p-2 rounded-full bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/30 transition-all shadow-neon-cyan z-30"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="border-t border-white/5 bg-abel-surface/80 backdrop-blur-md p-4">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Quick commands (shown when not empty conversation) */}
          {messages.length > 0 && messages.length < 4 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {QUICK_COMMANDS.slice(0, 4).map((cmd) => (
                <button
                  key={cmd.label}
                  onClick={() => handleQuickCommand(cmd.prompt)}
                  disabled={!isConnected || isThinking}
                  className="flex-shrink-0 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs hover:bg-neon-cyan/10 hover:border-neon-cyan/30 hover:text-neon-cyan transition-all disabled:opacity-30"
                >
                  {cmd.label}
                </button>
              ))}
            </div>
          )}

          {/* Input row */}
          <GlassPanel className="flex items-end gap-2 p-2 pl-3" hoverGlow={false}>
            {/* Voice input button */}
            {voiceSupported && (
              <button
                onClick={toggleVoice}
                disabled={!isConnected}
                className={cn(
                  'p-2 rounded-lg transition-all flex-shrink-0 mb-0.5',
                  isListening
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                )}
                title={isListening ? 'Arrêter la reconnaissance vocale' : 'Parler à A.B.E.L'}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}

            {/* Text input */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? '🎤 Écoute en cours...'
                  : isConnected
                  ? 'Écrivez votre message... (Shift+Enter pour nouvelle ligne)'
                  : 'Connexion en cours...'
              }
              rows={1}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/30 px-2 resize-none text-sm leading-relaxed max-h-[120px] overflow-y-auto"
              disabled={isThinking || !isConnected || isListening}
              style={{ height: 'auto' }}
            />

            {/* Send button */}
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isThinking || !isConnected}
              size="sm"
              className="flex-shrink-0 mb-0.5"
            >
              {isThinking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </GlassPanel>

          {/* Status bar */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="w-3 h-3 text-neon-green" />
              ) : (
                <WifiOff className="w-3 h-3 text-red-400" />
              )}
              <span className="text-xs text-white/20">
                {isConnected
                  ? 'A.B.E.L peut se tromper — vérifiez les infos importantes.'
                  : 'Reconnexion en cours...'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-white/20 text-xs">
              <Terminal className="w-3 h-3" />
              <span>Ctrl+K</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
