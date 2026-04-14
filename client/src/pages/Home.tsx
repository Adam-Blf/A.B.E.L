import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  MessageSquare,
  Settings,
  FileText,
  Cpu,
  Wifi,
  Shield,
  Activity,
  Zap,
  Brain,
  Database,
  Globe,
  Clock,
  Terminal,
  ChevronRight,
  Bot,
  Layers,
} from 'lucide-react'
import { GlassPanel, Button, Card, CardHeader, CardTitle } from '@/components/ui'
import { useStore } from '@/store/useStore'
import { cn } from '@/utils/cn'

interface SystemStatus {
  uptime: { formatted: string; seconds: number }
  connections: { active: number; total_messages: number }
  sessions: { active: number }
  services: {
    llm: { status: string; model: string }
    database: { status: string }
    memory: { status: string }
  }
}

// Live clock
function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="font-mono text-neon-cyan text-sm tabular-nums">
      {time.toLocaleTimeString('fr-FR')}
    </span>
  )
}

// Status dot
function StatusDot({ active }: { active: boolean }) {
  return (
    <div className={cn('w-2 h-2 rounded-full', active ? 'bg-neon-green animate-pulse' : 'bg-red-500')} />
  )
}

// Agent card
interface AgentCardProps {
  name: string
  role: string
  icon: React.ReactNode
  status: 'active' | 'mock' | 'offline'
  color: string
  detail: string
}

function AgentCard({ name, role, icon, status, color, detail }: AgentCardProps) {
  const statusConfig = {
    active: { label: 'Actif', dot: 'bg-neon-green' },
    mock: { label: 'Simulation', dot: 'bg-neon-orange' },
    offline: { label: 'Hors ligne', dot: 'bg-red-500' },
  }
  const s = statusConfig[status]

  return (
    <GlassPanel className="p-4 hover:border-white/20 transition-all" hoverGlow intensity="light">
      <div className="flex items-start gap-3">
        <div className={cn('p-2.5 rounded-xl', color)}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-white text-sm">{name}</span>
            <div className="flex items-center gap-1">
              <div className={cn('w-1.5 h-1.5 rounded-full', s.dot, status === 'active' && 'animate-pulse')} />
              <span className={cn('text-xs', status === 'active' ? 'text-neon-green' : status === 'mock' ? 'text-neon-orange' : 'text-red-400')}>
                {s.label}
              </span>
            </div>
          </div>
          <p className="text-xs text-white/40">{role}</p>
          <p className="text-xs text-white/25 mt-1 font-mono truncate">{detail}</p>
        </div>
      </div>
    </GlassPanel>
  )
}

export default function Home() {
  const { messageCount, settings } = useStore()
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status')
      if (!res.ok) throw new Error('Backend offline')
      const data = await res.json()
      setSystemStatus(data)
      setBackendOnline(true)
    } catch {
      setBackendOnline(false)
    } finally {
      setLoadingStatus(false)
    }
  }, [])

  // Fetch status on mount and every 10s
  useEffect(() => {
    fetchStatus()
    const id = setInterval(fetchStatus, 10000)
    return () => clearInterval(id)
  }, [fetchStatus])

  const llmStatus = systemStatus?.services.llm.status as 'active' | 'mock' | 'offline' ?? 'offline'
  const dbStatus = systemStatus?.services.database.status === 'active' ? 'active' : 'offline'
  const memStatus = systemStatus?.services.memory.status as 'active' | 'mock' | 'offline' ?? 'offline'

  const stats = [
    {
      label: 'Backend',
      value: backendOnline === null ? '...' : backendOnline ? 'En ligne' : 'Hors ligne',
      icon: Wifi,
      color: backendOnline ? 'text-neon-green' : 'text-red-400',
      bg: backendOnline ? 'bg-neon-green/10' : 'bg-red-500/10',
    },
    {
      label: 'Uptime',
      value: systemStatus?.uptime.formatted ?? '00:00:00',
      icon: Clock,
      color: 'text-neon-cyan',
      bg: 'bg-neon-cyan/10',
    },
    {
      label: 'Messages',
      value: messageCount.toString(),
      icon: MessageSquare,
      color: 'text-neon-violet',
      bg: 'bg-neon-violet/10',
    },
    {
      label: 'APIs',
      value: '1 400+',
      icon: Zap,
      color: 'text-neon-orange',
      bg: 'bg-neon-orange/10',
    },
  ]

  const agents: AgentCardProps[] = [
    {
      name: '@Agent_Brain',
      role: 'LLM Orchestration + RAG',
      icon: <Brain className="w-4 h-4 text-neon-cyan" />,
      status: llmStatus,
      color: 'bg-neon-cyan/10',
      detail: systemStatus?.services.llm.model ?? 'non configuré',
    },
    {
      name: '@Agent_Memory',
      role: 'Mémoire à long terme (pgvector)',
      icon: <Database className="w-4 h-4 text-neon-violet" />,
      status: memStatus,
      color: 'bg-neon-violet/10',
      detail: dbStatus === 'active' ? 'Supabase • pgvector actif' : 'DB non connectée',
    },
    {
      name: '@Agent_Connector',
      role: 'Proxy API Universel',
      icon: <Globe className="w-4 h-4 text-neon-orange" />,
      status: 'mock',
      color: 'bg-neon-orange/10',
      detail: '+1 400 APIs disponibles',
    },
    {
      name: '@Agent_UI',
      role: 'Interface & Animations',
      icon: <Layers className="w-4 h-4 text-neon-pink" />,
      status: 'active',
      color: 'bg-neon-pink/10',
      detail: 'React 18 • Framer Motion',
    },
  ]

  const quickActions = [
    { label: 'Chat', icon: MessageSquare, href: '/chat', description: 'Parler avec A.B.E.L', color: 'text-neon-cyan', bg: 'bg-neon-cyan/10 group-hover:bg-neon-cyan/20' },
    { label: 'Système', icon: FileText, href: '/system', description: 'Documentation & statut', color: 'text-neon-violet', bg: 'bg-neon-violet/10 group-hover:bg-neon-violet/20' },
    { label: 'Paramètres', icon: Settings, href: '/settings', description: 'Personnalisation', color: 'text-neon-orange', bg: 'bg-neon-orange/10 group-hover:bg-neon-orange/20' },
  ]

  return (
    <div className="min-h-screen bg-abel-dark cyber-grid">
      {/* Header */}
      <header className="border-b border-white/5 bg-abel-surface/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ boxShadow: ['0 0 10px rgba(0,245,255,0.2)', '0 0 20px rgba(0,245,255,0.5)', '0 0 10px rgba(0,245,255,0.2)'] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center"
            >
              <Bot className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h1 className="font-display font-bold text-lg text-white">A.B.E.L</h1>
              <p className="text-xs text-white/30 font-mono">Command Center v1.0</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LiveClock />
            <div className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium',
              backendOnline === null ? 'border-white/10 text-white/40' :
              backendOnline ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' :
              'bg-red-500/10 border-red-500/30 text-red-400'
            )}>
              <StatusDot active={!!backendOnline} />
              {backendOnline === null ? 'Vérification...' : backendOnline ? 'Système en ligne' : 'Backend hors ligne'}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-4xl font-display font-bold text-white mb-1">
            Bienvenue, <span className="text-gradient-cyber">Adam</span>
          </h2>
          <p className="text-white/40 text-sm">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {stats.map((stat, i) => (
            <GlassPanel
              key={stat.label}
              className="p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.04 }}
              hoverGlow
            >
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', stat.bg)}>
                  <stat.icon className={cn('w-5 h-5', stat.color)} />
                </div>
                <div>
                  <p className="text-xs text-white/40 font-mono">{stat.label}</p>
                  <p className={cn('font-bold font-mono tabular-nums', stat.color)}>{stat.value}</p>
                </div>
              </div>
            </GlassPanel>
          ))}
        </motion.div>

        {/* Two column layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Quick actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-neon-cyan" />
              Actions Rapides
            </h3>
            <div className="space-y-3">
              {quickActions.map((action, i) => (
                <Link key={action.label} to={action.href}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all cursor-pointer group"
                  >
                    <div className={cn('p-2.5 rounded-xl transition-colors', action.bg)}>
                      <action.icon className={cn('w-5 h-5', action.color)} />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{action.label}</p>
                      <p className="text-white/40 text-xs">{action.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* System info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-neon-violet" />
              Système
            </h3>
            <GlassPanel className="p-4 space-y-3" hoverGlow={false}>
              {[
                { label: 'Connexions actives', value: systemStatus?.connections.active ?? 0, color: 'text-neon-cyan' },
                { label: 'Sessions IA', value: systemStatus?.sessions.active ?? 0, color: 'text-neon-violet' },
                { label: 'Messages traités', value: systemStatus?.connections.total_messages ?? 0, color: 'text-neon-green' },
                { label: 'Uptime serveur', value: systemStatus?.uptime.formatted ?? '—', color: 'text-neon-orange' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-white/40 text-xs">{item.label}</span>
                  <span className={cn('font-mono text-sm font-bold', item.color)}>{item.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-xs">Modèle IA</span>
                  <span className="font-mono text-xs text-white/60">
                    {systemStatus?.services.llm.model ?? '—'}
                  </span>
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        </div>

        {/* Agents */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-neon-green" />
            Agents Virtuels
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {agents.map((agent, i) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.05 }}
              >
                <AgentCard {...agent} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <GlassPanel className="p-8 text-center" neonBorder>
            <div className="max-w-md mx-auto">
              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-violet mx-auto mb-4 flex items-center justify-center shadow-neon-cyan"
              >
                <MessageSquare className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-2xl font-display font-bold text-white mb-2">
                Commencer une conversation
              </h3>
              <p className="text-white/50 mb-6 text-sm">
                A.B.E.L est prêt — posez des questions, demandez du code, de l'analyse ML, ou explorez les APIs.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link to="/chat">
                  <Button size="lg" className="min-w-[180px]">
                    <MessageSquare className="w-5 h-5" />
                    Ouvrir le Chat
                  </Button>
                </Link>
                <div className="text-xs text-white/20 font-mono">ou Ctrl+K</div>
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        {/* Footer */}
        <div className="text-center pb-4">
          <p className="text-white/20 text-xs font-mono">
            A.B.E.L v1.0.0 • React + FastAPI + LangChain • Adam Beloucif
          </p>
        </div>
      </main>
    </div>
  )
}
