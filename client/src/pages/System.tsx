import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  Download,
  Cpu,
  Database,
  Globe,
  Shield,
  Code,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
} from 'lucide-react'
import { GlassPanel, Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { MarkdownMessage } from '@/components/chat/MarkdownMessage'
import { cn } from '@/utils/cn'

interface Doc {
  id: string
  title: string
  description: string
}

interface SystemStatusData {
  status: string
  version: string
  uptime: { formatted: string; seconds: number }
  connections: { active: number; total_messages: number }
  sessions: { active: number }
  services: {
    llm: { status: string; model: string }
    database: { status: string }
    memory: { status: string }
  }
}

function ServiceBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    active: { label: 'Actif', color: 'text-neon-green border-neon-green/30 bg-neon-green/10', icon: <CheckCircle className="w-3 h-3" /> },
    mock: { label: 'Simulation', color: 'text-neon-orange border-neon-orange/30 bg-neon-orange/10', icon: <Clock className="w-3 h-3" /> },
    offline: { label: 'Hors ligne', color: 'text-red-400 border-red-500/30 bg-red-500/10', icon: <XCircle className="w-3 h-3" /> },
  }
  const c = config[status] ?? config.offline
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-mono', c.color)}>
      {c.icon}
      {c.label}
    </span>
  )
}

export default function System() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [openDoc, setOpenDoc] = useState<string | null>(null)
  const [docContent, setDocContent] = useState<Record<string, string>>({})
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null)
  const [systemStatus, setSystemStatus] = useState<SystemStatusData | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [docsLoading, setDocsLoading] = useState(true)

  // Fetch docs list
  useEffect(() => {
    fetch('/api/docs')
      .then((r) => r.json())
      .then((data) => setDocs(data.docs ?? []))
      .catch(() => setDocs([]))
      .finally(() => setDocsLoading(false))
  }, [])

  // Fetch system status
  const fetchStatus = () => {
    setLoadingStatus(true)
    fetch('/api/status')
      .then((r) => r.json())
      .then(setSystemStatus)
      .catch(() => setSystemStatus(null))
      .finally(() => setLoadingStatus(false))
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const toggleDoc = async (docId: string) => {
    if (openDoc === docId) {
      setOpenDoc(null)
      return
    }
    setOpenDoc(docId)

    if (docContent[docId]) return

    setLoadingDoc(docId)
    try {
      const res = await fetch(`/api/docs/${docId}`)
      const data = await res.json()
      setDocContent((prev) => ({ ...prev, [docId]: data.content }))
    } catch {
      setDocContent((prev) => ({ ...prev, [docId]: '> Erreur lors du chargement du document.' }))
    } finally {
      setLoadingDoc(null)
    }
  }

  const downloadDoc = async (docId: string, title: string) => {
    try {
      const res = await fetch(`/api/docs/${docId}`)
      const data = await res.json()
      const blob = new Blob([data.content], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title}.md`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      console.error('Download failed')
    }
  }

  const techStack = [
    { label: 'Frontend', value: 'React 18 + Vite 6', icon: Code, color: 'text-neon-cyan', bg: 'bg-neon-cyan/10' },
    { label: 'Backend', value: 'FastAPI (Python)', icon: Cpu, color: 'text-neon-violet', bg: 'bg-neon-violet/10' },
    { label: 'Database', value: 'Supabase + pgvector', icon: Database, color: 'text-neon-orange', bg: 'bg-neon-orange/10' },
    { label: 'APIs', value: '1 400+ intégrées', icon: Globe, color: 'text-neon-green', bg: 'bg-neon-green/10' },
    { label: 'Sécurité', value: 'JWT + CORS', icon: Shield, color: 'text-neon-pink', bg: 'bg-neon-pink/10' },
    { label: 'IA / ML', value: 'LangChain + OpenAI', icon: Zap, color: 'text-neon-cyan', bg: 'bg-neon-cyan/10' },
  ]

  const docIcons: Record<string, React.ElementType> = {
    README: BookOpen,
    CLAUDE: Code,
    ABEL_PROMPT: FileText,
  }

  return (
    <div className="min-h-screen bg-abel-dark cyber-grid">
      <header className="border-b border-white/5 bg-abel-surface/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold text-white">Système</h1>
              <p className="text-xs text-white/30">Documentation & Statut</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchStatus} disabled={loadingStatus}>
            <RefreshCw className={cn('w-4 h-4', loadingStatus && 'animate-spin')} />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Live System Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-neon-cyan" />
            Statut en temps réel
          </h2>

          {loadingStatus ? (
            <GlassPanel className="p-6 flex items-center justify-center" hoverGlow={false}>
              <Loader2 className="w-5 h-5 text-neon-cyan animate-spin mr-3" />
              <span className="text-white/50 text-sm">Chargement...</span>
            </GlassPanel>
          ) : systemStatus ? (
            <GlassPanel className="p-5" hoverGlow={false}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-white/30 mb-1">Uptime</p>
                  <p className="font-mono text-neon-cyan font-bold">{systemStatus.uptime.formatted}</p>
                </div>
                <div>
                  <p className="text-xs text-white/30 mb-1">Connexions</p>
                  <p className="font-mono text-neon-violet font-bold">{systemStatus.connections.active}</p>
                </div>
                <div>
                  <p className="text-xs text-white/30 mb-1">Sessions IA</p>
                  <p className="font-mono text-neon-green font-bold">{systemStatus.sessions.active}</p>
                </div>
              </div>
              <div className="border-t border-white/5 pt-4 space-y-3">
                {[
                  { label: 'LLM / IA', status: systemStatus.services.llm.status, detail: systemStatus.services.llm.model },
                  { label: 'Base de données', status: systemStatus.services.database.status, detail: 'Supabase PostgreSQL' },
                  { label: 'Mémoire RAG', status: systemStatus.services.memory.status, detail: 'pgvector embeddings' },
                ].map((svc) => (
                  <div key={svc.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/70">{svc.label}</p>
                      <p className="text-xs text-white/30 font-mono">{svc.detail}</p>
                    </div>
                    <ServiceBadge status={svc.status} />
                  </div>
                ))}
              </div>
            </GlassPanel>
          ) : (
            <GlassPanel className="p-5 text-center" hoverGlow={false}>
              <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-white/50 text-sm">Backend hors ligne ou non démarré</p>
              <p className="text-white/30 text-xs mt-1">Lancez : <code className="font-mono">cd server && uvicorn app.main:app --reload</code></p>
            </GlassPanel>
          )}
        </motion.div>

        {/* Tech Stack */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Code className="w-4 h-4 text-neon-violet" />
            Stack Technique
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {techStack.map((item, i) => (
              <GlassPanel
                key={item.label}
                className="p-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.04 }}
                hoverGlow
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn('p-1.5 rounded-lg', item.bg)}>
                    <item.icon className={cn('w-4 h-4', item.color)} />
                  </div>
                  <div>
                    <p className="text-xs text-white/40">{item.label}</p>
                    <p className="text-sm text-white font-medium">{item.value}</p>
                  </div>
                </div>
              </GlassPanel>
            ))}
          </div>
        </motion.div>

        {/* Documentation */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-neon-orange" />
            Documentation
          </h2>

          {docsLoading ? (
            <div className="flex items-center gap-3 text-white/40 p-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Chargement des docs...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {docs.map((doc, i) => {
                const Icon = docIcons[doc.id] ?? FileText
                const isOpen = openDoc === doc.id
                const isLoading = loadingDoc === doc.id

                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                  >
                    <Card hoverable={false} className="overflow-hidden">
                      <CardHeader className="mb-0">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => toggleDoc(doc.id)}
                            className="flex items-center gap-3 flex-1 text-left"
                          >
                            <div className="p-2 rounded-lg bg-neon-orange/10 text-neon-orange">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <CardTitle className="text-sm">{doc.title}</CardTitle>
                              <p className="text-xs text-white/40">{doc.description}</p>
                            </div>
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 text-neon-cyan animate-spin ml-auto" />
                            ) : isOpen ? (
                              <ChevronUp className="w-4 h-4 text-white/40 ml-auto" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-white/40 ml-auto" />
                            )}
                          </button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              downloadDoc(doc.id, doc.title)
                            }}
                            className="ml-2 flex-shrink-0"
                            title="Télécharger"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>

                      <AnimatePresence>
                        {isOpen && docContent[doc.id] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <CardContent className="pt-0">
                              <div className="mt-3 p-4 rounded-xl bg-black/30 border border-white/5 max-h-96 overflow-y-auto">
                                <MarkdownMessage content={docContent[doc.id]} />
                              </div>
                            </CardContent>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                )
              })}

              {docs.length === 0 && (
                <GlassPanel className="p-6 text-center" hoverGlow={false}>
                  <FileText className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  <p className="text-white/40 text-sm">Aucun document disponible</p>
                  <p className="text-white/20 text-xs mt-1">Backend hors ligne ou aucun .md trouvé</p>
                </GlassPanel>
              )}
            </div>
          )}
        </motion.div>

        {/* Version */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center pb-4">
          <p className="text-white/20 text-xs font-mono">
            A.B.E.L v1.0.0 • Adam Beloucif Est Là • React 18 + FastAPI + LangChain
          </p>
        </motion.div>
      </main>
    </div>
  )
}
