import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Palette,
  Bell,
  Volume2,
  Moon,
  Sun,
  Save,
  RotateCcw
} from 'lucide-react'
import { GlassPanel, Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { cn } from '@/utils/cn'

export default function Settings() {
  const [settings, setSettings] = useState({
    theme: 'dark',
    language: 'fr',
    notifications: true,
    soundEffects: true,
    voiceSpeed: 1,
    voiceType: 'onyx'
  })

  const voices = [
    { id: 'onyx', name: 'Onyx', description: 'Voix grave et professionnelle' },
    { id: 'nova', name: 'Nova', description: 'Voix féminine claire' },
    { id: 'echo', name: 'Echo', description: 'Voix neutre et calme' },
    { id: 'alloy', name: 'Alloy', description: 'Voix versatile' },
  ]

  const handleSave = () => {
    localStorage.setItem('abel-settings', JSON.stringify(settings))
    // TODO: Sync with backend
  }

  const handleReset = () => {
    setSettings({
      theme: 'dark',
      language: 'fr',
      notifications: true,
      soundEffects: true,
      voiceSpeed: 1,
      voiceType: 'onyx'
    })
  }

  return (
    <div className="min-h-screen bg-abel-dark cyber-grid">
      {/* Header */}
      <header className="border-b border-white/5 bg-abel-surface/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>

            <div>
              <h1 className="font-semibold text-white">Paramètres</h1>
              <p className="text-xs text-white/40">Personnalisation</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="w-4 h-4" />
              Sauvegarder
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Appearance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-neon-violet/10 text-neon-violet">
                  <Palette className="w-5 h-5" />
                </div>
                <CardTitle>Apparence</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Thème</p>
                  <p className="text-sm text-white/40">Mode sombre ou clair</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={settings.theme === 'light' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setSettings({ ...settings, theme: 'light' })}
                  >
                    <Sun className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={settings.theme === 'dark' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setSettings({ ...settings, theme: 'dark' })}
                  >
                    <Moon className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Langue</p>
                  <p className="text-sm text-white/40">Langue de l'interface</p>
                </div>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  className="px-3 py-2 bg-abel-surface border border-white/10 rounded-lg text-white outline-none focus:border-neon-cyan/50"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Voice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-neon-cyan/10 text-neon-cyan">
                  <Volume2 className="w-5 h-5" />
                </div>
                <CardTitle>Voix & Audio</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-white font-medium mb-3">Type de voix</p>
                <div className="grid grid-cols-2 gap-3">
                  {voices.map((voice) => (
                    <GlassPanel
                      key={voice.id}
                      className={cn(
                        'p-3 cursor-pointer transition-all',
                        settings.voiceType === voice.id && 'border-neon-cyan/50 bg-neon-cyan/10'
                      )}
                      onClick={() => setSettings({ ...settings, voiceType: voice.id })}
                      hoverGlow={false}
                    >
                      <p className="font-medium text-white">{voice.name}</p>
                      <p className="text-xs text-white/40">{voice.description}</p>
                    </GlassPanel>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white font-medium">Vitesse de parole</p>
                  <span className="text-neon-cyan font-mono">{settings.voiceSpeed}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={settings.voiceSpeed}
                  onChange={(e) => setSettings({ ...settings, voiceSpeed: parseFloat(e.target.value) })}
                  className="w-full accent-neon-cyan"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-neon-orange/10 text-neon-orange">
                  <Bell className="w-5 h-5" />
                </div>
                <CardTitle>Notifications</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Notifications push</p>
                  <p className="text-sm text-white/40">Recevoir des alertes</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, notifications: !settings.notifications })}
                  className={cn(
                    'w-12 h-6 rounded-full transition-colors relative',
                    settings.notifications ? 'bg-neon-cyan' : 'bg-white/20'
                  )}
                >
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform',
                      settings.notifications ? 'translate-x-6' : 'translate-x-0.5'
                    )}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Sons</p>
                  <p className="text-sm text-white/40">Effets sonores de l'interface</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, soundEffects: !settings.soundEffects })}
                  className={cn(
                    'w-12 h-6 rounded-full transition-colors relative',
                    settings.soundEffects ? 'bg-neon-cyan' : 'bg-white/20'
                  )}
                >
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform',
                      settings.soundEffects ? 'translate-x-6' : 'translate-x-0.5'
                    )}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
