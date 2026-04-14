import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Cpu,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Download,
  HardDrive,
  Cloud,
  Globe,
  Zap,
  Info,
  ExternalLink,
} from 'lucide-react'
import { GlassPanel, Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { cn } from '@/utils/cn'

interface ModelInfo {
  id: string
  name: string
  size?: number
  recommended?: boolean
}

interface ModelsData {
  active: { provider: string; model: string; ollama_available: boolean; groq_configured: boolean; openai_configured: boolean }
  ollama: { available: boolean; models: ModelInfo[] }
  groq: { available: boolean; models: ModelInfo[] }
  openai: { available: boolean; models: ModelInfo[] }
}

function formatSize(bytes: number): string {
  if (!bytes) return ''
  const gb = bytes / 1e9
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / 1e6).toFixed(0)} MB`
}

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono border',
      ok ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' : 'bg-red-500/10 border-red-500/30 text-red-400'
    )}>
      {ok ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {ok ? 'Disponible' : 'Non configuré'}
    </span>
  )
}

export default function Models() {
  const [data, setData] = useState<ModelsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchModels = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/models')
      if (!res.ok) throw new Error('Backend hors ligne')
      setData(await res.json())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModels()
  }, [])

  const active = data?.active

  return (
    <div className="min-h-screen bg-abel-dark cyber-grid">
      <header className="border-b border-white/5 bg-abel-surface/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
            </Link>
            <div>
              <h1 className="font-semibold text-white">Modèles LLM</h1>
              <p className="text-xs text-white/30">Open-source & gratuits</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchModels} disabled={loading}>
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Active model */}
        {active && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <GlassPanel className="p-5" neonBorder hoverGlow={false}>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-neon-cyan/10">
                  <Cpu className="w-6 h-6 text-neon-cyan" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-white/40 mb-0.5">Modèle actif</p>
                  <p className="text-xl font-display font-bold text-white">{active.model}</p>
                  <p className="text-sm text-neon-cyan font-mono capitalize">{active.provider}</p>
                </div>
                <div className="text-right">
                  <div className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-mono',
                    active.provider === 'mock'
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-neon-green/10 border-neon-green/30 text-neon-green'
                  )}>
                    <div className={cn('w-2 h-2 rounded-full', active.provider !== 'mock' ? 'bg-neon-green animate-pulse' : 'bg-red-500')} />
                    {active.provider !== 'mock' ? 'En service' : 'Simulation'}
                  </div>
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        )}

        {error && (
          <GlassPanel className="p-5 text-center" hoverGlow={false}>
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-400">{error}</p>
            <p className="text-white/30 text-sm mt-1">Démarrez le backend avec <code className="font-mono">uvicorn app.main:app --reload</code></p>
          </GlassPanel>
        )}

        {/* Ollama */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card hoverable={false}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neon-green/10">
                    <HardDrive className="w-5 h-5 text-neon-green" />
                  </div>
                  <div>
                    <CardTitle>Ollama — Local</CardTitle>
                    <p className="text-xs text-white/40 mt-0.5">100% gratuit • Aucune limite • Privé • Hors-ligne</p>
                  </div>
                </div>
                <StatusBadge ok={!!data?.ollama.available} />
              </div>
            </CardHeader>
            <CardContent>
              {!data?.ollama.available ? (
                <div className="space-y-3">
                  <GlassPanel className="p-4 border-neon-orange/20" hoverGlow={false}>
                    <p className="text-sm text-white/70 mb-3">
                      Ollama n'est pas détecté sur <code className="font-mono text-neon-cyan">localhost:11434</code>.
                      Installez-le gratuitement :
                    </p>
                    <div className="space-y-2 font-mono text-xs">
                      <div className="p-2 bg-black/40 rounded border border-white/10">
                        <span className="text-white/40"># Linux/Mac</span>
                        <br /><span className="text-neon-green">curl -fsSL https://ollama.com/install.sh | sh</span>
                      </div>
                      <div className="p-2 bg-black/40 rounded border border-white/10">
                        <span className="text-white/40"># Puis télécharger un modèle (ex: Llama 3.2 ~2GB)</span>
                        <br /><span className="text-neon-green">ollama pull llama3.2</span>
                      </div>
                      <div className="p-2 bg-black/40 rounded border border-white/10">
                        <span className="text-white/40"># Configurer dans server/.env :</span>
                        <br /><span className="text-neon-cyan">LLM_PROVIDER=ollama</span>
                        <br /><span className="text-neon-cyan">OLLAMA_MODEL=llama3.2</span>
                      </div>
                    </div>
                    <a
                      href="https://ollama.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-neon-cyan text-xs hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      ollama.com
                    </a>
                  </GlassPanel>

                  {/* Recommended models */}
                  <div>
                    <p className="text-xs text-white/40 mb-2">Modèles recommandés :</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { name: 'llama3.2', size: '2 GB', desc: 'Recommandé — rapide et précis', cmd: 'ollama pull llama3.2' },
                        { name: 'mistral', size: '4 GB', desc: 'Excellent pour le code', cmd: 'ollama pull mistral' },
                        { name: 'phi3', size: '2 GB', desc: 'Léger et efficace', cmd: 'ollama pull phi3' },
                        { name: 'deepseek-r1', size: '4 GB', desc: 'Raisonnement avancé', cmd: 'ollama pull deepseek-r1' },
                        { name: 'gemma2', size: '5 GB', desc: 'Google — très performant', cmd: 'ollama pull gemma2' },
                        { name: 'qwen2.5-coder', size: '4 GB', desc: 'Spécialisé code', cmd: 'ollama pull qwen2.5-coder' },
                      ].map((m) => (
                        <button
                          key={m.name}
                          onClick={() => navigator.clipboard.writeText(m.cmd)}
                          title="Cliquer pour copier la commande"
                          className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-neon-green/30 hover:bg-neon-green/5 text-left transition-all group"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-sm text-white">{m.name}</span>
                            <span className="text-xs text-white/30">{m.size}</span>
                          </div>
                          <p className="text-xs text-white/40">{m.desc}</p>
                          <p className="text-xs text-neon-green/50 group-hover:text-neon-green mt-1 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                            Copier la commande ↗
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-neon-green mb-3">✅ Ollama actif — {data?.ollama.models.length} modèle(s) installé(s)</p>
                  {data?.ollama.models.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          active?.model === m.id ? 'bg-neon-green animate-pulse' : 'bg-white/20'
                        )} />
                        <span className="font-mono text-sm text-white">{m.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {m.size && <span className="text-xs text-white/30">{formatSize(m.size)}</span>}
                        {active?.model === m.id && (
                          <span className="text-xs text-neon-green font-mono">ACTIF</span>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="mt-3 p-3 rounded-lg bg-black/30 border border-white/5">
                    <p className="text-xs text-white/40 font-mono">
                      Pour changer de modèle : modifiez <span className="text-neon-cyan">OLLAMA_MODEL</span> dans <span className="text-neon-cyan">server/.env</span>
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Groq */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card hoverable={false}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neon-orange/10">
                    <Zap className="w-5 h-5 text-neon-orange" />
                  </div>
                  <div>
                    <CardTitle>Groq — Cloud gratuit</CardTitle>
                    <p className="text-xs text-white/40 mt-0.5">14 400 req/jour • Ultra-rapide (LPU) • Open-source</p>
                  </div>
                </div>
                <StatusBadge ok={!!data?.groq.available} />
              </div>
            </CardHeader>
            <CardContent>
              {!data?.groq.available ? (
                <GlassPanel className="p-4 border-neon-orange/20" hoverGlow={false}>
                  <p className="text-sm text-white/70 mb-3">
                    Groq offre un accès gratuit aux meilleurs modèles open-source avec une inférence ultra-rapide (LPU).
                  </p>
                  <div className="space-y-2 font-mono text-xs">
                    <div className="p-2 bg-black/40 rounded border border-white/10">
                      <span className="text-white/40"># 1. Créez un compte sur console.groq.com (gratuit)</span>
                      <br /><span className="text-white/40"># 2. Générez une clé API</span>
                      <br /><span className="text-white/40"># 3. Ajoutez dans server/.env :</span>
                      <br /><span className="text-neon-orange">GROQ_API_KEY=gsk_...</span>
                      <br /><span className="text-neon-orange">LLM_PROVIDER=groq</span>
                    </div>
                  </div>
                  <a
                    href="https://console.groq.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-neon-orange text-xs hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    console.groq.com (100% gratuit)
                  </a>
                </GlassPanel>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-neon-orange mb-3">✅ Groq configuré</p>
                  {data?.groq.models.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-2 h-2 rounded-full', active?.model === m.id ? 'bg-neon-orange animate-pulse' : 'bg-white/20')} />
                        <div>
                          <span className="font-mono text-sm text-white">{m.name}</span>
                          {m.recommended && (
                            <span className="ml-2 text-xs text-neon-orange bg-neon-orange/10 px-1.5 py-0.5 rounded">recommandé</span>
                          )}
                        </div>
                      </div>
                      {active?.model === m.id && <span className="text-xs text-neon-orange font-mono">ACTIF</span>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Config guide */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GlassPanel className="p-5" hoverGlow={false}>
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-neon-cyan mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-white font-medium mb-2">Priorité de sélection automatique</p>
                <div className="space-y-1 text-xs text-white/50 font-mono">
                  <p><span className="text-neon-green">1.</span> Ollama (local) → gratuit, privé, offline</p>
                  <p><span className="text-neon-orange">2.</span> Groq (cloud) → gratuit, rapide, 14k req/j</p>
                  <p><span className="text-neon-violet">3.</span> OpenAI → payant, meilleure qualité</p>
                  <p><span className="text-white/30">4.</span> Mode simulation → aucune IA disponible</p>
                </div>
                <p className="text-xs text-white/30 mt-3">
                  Fichier de config : <code className="text-neon-cyan">server/.env</code> — variable <code className="text-neon-cyan">LLM_PROVIDER=auto</code>
                </p>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      </main>
    </div>
  )
}
