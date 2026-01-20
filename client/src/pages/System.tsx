import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  Download,
  ExternalLink,
  Cpu,
  Database,
  Globe,
  Shield,
  Code,
  BookOpen
} from 'lucide-react'
import { GlassPanel, Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

export default function System() {
  const [activeDoc, setActiveDoc] = useState<string | null>(null)

  const docs = [
    {
      id: 'readme',
      title: 'README.md',
      description: 'Installation et démarrage rapide',
      icon: BookOpen,
    },
    {
      id: 'architecture',
      title: 'ARCHITECTURE.md',
      description: 'Stack technique et architecture',
      icon: Code,
    },
    {
      id: 'prompt',
      title: 'ABEL_PROMPT.md',
      description: 'Prompt système complet',
      icon: FileText,
    },
  ]

  const systemInfo = [
    { label: 'Frontend', value: 'React 18 + Vite 6', icon: Code },
    { label: 'Backend', value: 'FastAPI', icon: Cpu },
    { label: 'Database', value: 'Supabase + pgvector', icon: Database },
    { label: 'APIs', value: '1,400+ intégrées', icon: Globe },
    { label: 'Sécurité', value: 'JWT + Encryption', icon: Shield },
  ]

  const handleDownload = (docId: string) => {
    // TODO: Implement download from backend
    console.log('Download:', docId)
  }

  return (
    <div className="min-h-screen bg-abel-dark cyber-grid">
      {/* Header */}
      <header className="border-b border-white/5 bg-abel-surface/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>

          <div>
            <h1 className="font-semibold text-white">Système</h1>
            <p className="text-xs text-white/40">Documentation & Informations</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* System Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-neon-cyan" />
            Informations Système
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {systemInfo.map((info, index) => (
              <GlassPanel
                key={info.label}
                className="p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-neon-cyan/10 text-neon-cyan">
                    <info.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-white/40">{info.label}</p>
                    <p className="text-sm font-medium text-white">{info.value}</p>
                  </div>
                </div>
              </GlassPanel>
            ))}
          </div>
        </motion.div>

        {/* Documentation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-neon-violet" />
            Documentation
          </h2>

          <div className="space-y-4">
            {docs.map((doc, index) => (
              <Card
                key={doc.id}
                className="cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                onClick={() => setActiveDoc(activeDoc === doc.id ? null : doc.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-neon-violet/10 text-neon-violet">
                        <doc.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle>{doc.title}</CardTitle>
                        <p className="text-sm text-white/40">{doc.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownload(doc.id)
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(`/api/docs/${doc.id}`, '_blank')
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {activeDoc === doc.id && (
                  <CardContent>
                    <div className="p-4 rounded-lg bg-abel-darker border border-white/5 font-mono text-sm text-white/70">
                      <p className="text-neon-cyan"># {doc.title}</p>
                      <p className="mt-2 text-white/50">
                        Contenu du fichier {doc.title}...
                      </p>
                      <p className="mt-2 text-white/30">
                        (Le contenu sera chargé depuis le backend)
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Version info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-white/30 text-sm font-mono">
            A.B.E.L v1.0.0 • Adam Beloucif Est Là
          </p>
          <p className="text-white/20 text-xs mt-1">
            Propulsé par React, FastAPI & Supabase
          </p>
        </motion.div>
      </main>
    </div>
  )
}
