import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  MessageSquare,
  Settings,
  FileText,
  Cpu,
  Wifi,
  Shield,
  Activity,
  Zap
} from 'lucide-react'
import { GlassPanel, Button, Card, CardHeader, CardTitle } from '@/components/ui'

export default function Home() {
  const stats = [
    { label: 'Connexion', value: 'Active', icon: Wifi, color: 'text-neon-green' },
    { label: 'Statut IA', value: 'Prêt', icon: Cpu, color: 'text-neon-cyan' },
    { label: 'Sécurité', value: 'Optimal', icon: Shield, color: 'text-neon-violet' },
    { label: 'APIs', value: '1,400+', icon: Zap, color: 'text-neon-orange' },
  ]

  const quickActions = [
    { label: 'Chat', icon: MessageSquare, href: '/chat', description: 'Parler avec A.B.E.L' },
    { label: 'Système', icon: FileText, href: '/system', description: 'Documentation' },
    { label: 'Paramètres', icon: Settings, href: '/settings', description: 'Configuration' },
  ]

  return (
    <div className="min-h-screen bg-abel-dark cyber-grid">
      {/* Header */}
      <header className="border-b border-white/5 bg-abel-surface/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center">
              <span className="font-display font-bold text-white">A</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-white">A.B.E.L</h1>
              <p className="text-xs text-white/40">Command Center</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-green/10 border border-neon-green/30">
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              <span className="text-xs text-neon-green font-medium">En ligne</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-display font-bold text-white mb-2">
            Bienvenue, <span className="text-gradient-cyber">Adam</span>
          </h2>
          <p className="text-white/60">
            Votre assistant personnel est prêt à vous aider.
          </p>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {stats.map((stat, index) => (
            <GlassPanel
              key={stat.label}
              className="p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-white/40">{stat.label}</p>
                  <p className={`font-semibold ${stat.color}`}>{stat.value}</p>
                </div>
              </div>
            </GlassPanel>
          ))}
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-neon-cyan" />
            Actions Rapides
          </h3>

          <div className="grid md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Link key={action.label} to={action.href}>
                <Card
                  className="h-full cursor-pointer group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-neon-cyan/10 text-neon-cyan group-hover:bg-neon-cyan/20 transition-colors">
                        <action.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle>{action.label}</CardTitle>
                        <p className="text-sm text-white/40">{action.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Main CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassPanel className="p-8 text-center neon-border" neonBorder>
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-violet mx-auto mb-4 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-display font-bold text-white mb-2">
                Commencer une conversation
              </h3>
              <p className="text-white/60 mb-6">
                A.B.E.L est prêt à répondre à vos questions, gérer vos tâches et vous assister au quotidien.
              </p>
              <Link to="/chat">
                <Button size="lg" className="min-w-[200px]">
                  <MessageSquare className="w-5 h-5" />
                  Ouvrir le Chat
                </Button>
              </Link>
            </div>
          </GlassPanel>
        </motion.div>
      </main>
    </div>
  )
}
