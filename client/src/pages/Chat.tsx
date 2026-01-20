import { useState, useRef, useEffect } from 'react'
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
  Trash2
} from 'lucide-react'
import { GlassPanel, Button } from '@/components/ui'
import { cn } from '@/utils/cn'
import { useAbelChat } from '@/hooks/useAbelChat'

export default function Chat() {
  const {
    messages,
    isConnected,
    isThinking,
    sendMessage,
    clearHistory,
    reconnect
  } = useAbelChat({
    url: `ws://localhost:8000/ws/chat/${Math.random().toString(36).substring(7)}`,
    onConnect: () => console.log('Connected to A.B.E.L'),
    onDisconnect: () => console.log('Disconnected from A.B.E.L'),
    onError: (err) => console.error('WebSocket error:', err)
  })

  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isThinking || !isConnected) return
    sendMessage(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleListening = () => {
    setIsListening(!isListening)
    // TODO: Implement voice recognition
  }

  return (
    <div className="min-h-screen bg-abel-dark flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 bg-abel-surface/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>

          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-white">A.B.E.L</h1>
              <div className="flex items-center gap-1.5">
                {isConnected ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                    <span className="text-xs text-neon-green">Connecté</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs text-red-400">Déconnecté</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={clearHistory} title="Effacer l'historique">
              <Trash2 className="w-4 h-4" />
            </Button>
            {!isConnected && (
              <Button variant="ghost" size="sm" onClick={reconnect} title="Reconnecter">
                <WifiOff className="w-4 h-4 text-red-400" />
              </Button>
            )}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neon-violet/10">
              <Sparkles className="w-4 h-4 text-neon-violet" />
              <span className="text-xs text-neon-violet">GPT-4</span>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 px-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Welcome message if no messages */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-cyan to-neon-violet mx-auto mb-6 flex items-center justify-center">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-display font-bold text-white mb-2">
                Bonjour, je suis A.B.E.L
              </h2>
              <p className="text-white/60 max-w-md mx-auto">
                Votre assistant personnel intelligent. Posez-moi une question ou demandez-moi de l'aide.
              </p>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' && 'flex-row-reverse'
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    message.role === 'user'
                      ? 'bg-neon-violet/20 text-neon-violet'
                      : message.role === 'system'
                      ? 'bg-neon-orange/20 text-neon-orange'
                      : 'bg-neon-cyan/20 text-neon-cyan'
                  )}
                >
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                {/* Message bubble */}
                <GlassPanel
                  className={cn(
                    'max-w-[80%] p-4',
                    message.role === 'user'
                      ? 'bg-neon-violet/10 border-neon-violet/20'
                      : message.role === 'system'
                      ? 'bg-neon-orange/5 border-neon-orange/20'
                      : 'bg-white/5',
                    message.isStreaming && 'border-neon-cyan/30'
                  )}
                  hoverGlow={false}
                >
                  <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                    {message.isStreaming && (
                      <span className="inline-block w-2 h-4 bg-neon-cyan ml-1 animate-pulse" />
                    )}
                  </p>
                  <p className="text-xs text-white/30 mt-2">
                    {message.timestamp.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </GlassPanel>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Thinking indicator */}
          {isThinking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-neon-cyan/20 text-neon-cyan flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <GlassPanel className="p-4" hoverGlow={false}>
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-neon-cyan animate-spin" />
                  <span className="text-white/60 text-sm">A.B.E.L réfléchit...</span>
                </div>
              </GlassPanel>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-white/5 bg-abel-surface/50 backdrop-blur-md p-4">
        <div className="max-w-4xl mx-auto">
          <GlassPanel className="flex items-center gap-2 p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleListening}
              className={cn(
                isListening && 'bg-red-500/20 text-red-400 border-red-500/50'
              )}
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </Button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isConnected ? "Écrivez votre message..." : "Connexion en cours..."}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/30 px-2"
              disabled={isThinking || !isConnected}
            />

            <Button
              onClick={handleSend}
              disabled={!input.trim() || isThinking || !isConnected}
              size="sm"
            >
              <Send className="w-5 h-5" />
            </Button>
          </GlassPanel>

          <div className="flex items-center justify-center gap-2 mt-2">
            {isConnected ? (
              <Wifi className="w-3 h-3 text-neon-green" />
            ) : (
              <WifiOff className="w-3 h-3 text-red-400" />
            )}
            <p className="text-xs text-white/30">
              {isConnected
                ? "A.B.E.L peut faire des erreurs. Vérifiez les informations importantes."
                : "Tentative de connexion au serveur..."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
