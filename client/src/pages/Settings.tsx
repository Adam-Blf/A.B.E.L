import { useEffect } from 'react'
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
  RotateCcw,
  Mic,
  Zap,
  Eye,
  Clock,
  Languages,
} from 'lucide-react'
import { toast } from 'sonner'
import { GlassPanel, Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { useStore } from '@/store/useStore'
import { cn } from '@/utils/cn'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none',
        checked ? 'bg-neon-cyan' : 'bg-white/20'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  )
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-white font-medium text-sm">{label}</p>
        {description && <p className="text-white/40 text-xs mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

const voices = [
  { id: 'onyx', name: 'Onyx', description: 'Grave & professionnel' },
  { id: 'nova', name: 'Nova', description: 'Féminin & clair' },
  { id: 'echo', name: 'Echo', description: 'Neutre & calme' },
  { id: 'alloy', name: 'Alloy', description: 'Versatile' },
]

export default function Settings() {
  const { settings, updateSetting, resetSettings } = useStore()

  // Settings are auto-persisted by Zustand persist middleware
  const handleSave = () => {
    toast.success('Paramètres sauvegardés', { duration: 2000 })
  }

  const handleReset = () => {
    resetSettings()
    toast.info('Paramètres réinitialisés', { duration: 2000 })
  }

  return (
    <div className="min-h-screen bg-abel-dark cyber-grid">
      {/* Header */}
      <header className="border-b border-white/5 bg-abel-surface/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold text-white">Paramètres</h1>
              <p className="text-xs text-white/30">Sauvegarde automatique</p>
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-neon-violet/10 text-neon-violet">
                  <Palette className="w-5 h-5" />
                </div>
                <CardTitle>Apparence</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <SettingRow label="Thème" description="Mode sombre (défaut cyberpunk) ou clair">
                <div className="flex gap-2">
                  <Button
                    variant={settings.theme === 'light' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => updateSetting('theme', 'light')}
                  >
                    <Sun className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={settings.theme === 'dark' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => updateSetting('theme', 'dark')}
                  >
                    <Moon className="w-4 h-4" />
                  </Button>
                </div>
              </SettingRow>

              <SettingRow label="Mode compact" description="Réduire l'espacement de l'interface">
                <Toggle
                  checked={settings.compactMode}
                  onChange={(v) => updateSetting('compactMode', v)}
                />
              </SettingRow>

              <SettingRow label="Afficher les timestamps" description="Heure de chaque message">
                <Toggle
                  checked={settings.showTimestamps}
                  onChange={(v) => updateSetting('showTimestamps', v)}
                />
              </SettingRow>
            </CardContent>
          </Card>
        </motion.div>

        {/* Language */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-neon-cyan/10 text-neon-cyan">
                  <Languages className="w-5 h-5" />
                </div>
                <CardTitle>Langue</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <SettingRow label="Langue de l'interface" description="Affecte la reconnaissance vocale">
                <select
                  value={settings.language}
                  onChange={(e) => updateSetting('language', e.target.value as 'fr' | 'en')}
                  className="px-3 py-2 bg-abel-surface border border-white/10 rounded-lg text-white outline-none focus:border-neon-cyan/50 text-sm"
                >
                  <option value="fr">🇫🇷 Français</option>
                  <option value="en">🇬🇧 English</option>
                </select>
              </SettingRow>
            </CardContent>
          </Card>
        </motion.div>

        {/* Voice */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-neon-cyan/10 text-neon-cyan">
                  <Volume2 className="w-5 h-5" />
                </div>
                <CardTitle>Voix & Audio</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <SettingRow label="Activer la voix" description="Synthèse vocale (TTS) des réponses">
                <Toggle
                  checked={settings.voiceEnabled}
                  onChange={(v) => updateSetting('voiceEnabled', v)}
                />
              </SettingRow>

              <SettingRow
                label="Lecture automatique"
                description="Lire automatiquement chaque réponse d'A.B.E.L"
              >
                <Toggle
                  checked={settings.autoSpeak}
                  onChange={(v) => updateSetting('autoSpeak', v)}
                />
              </SettingRow>

              <div>
                <p className="text-white font-medium text-sm mb-3">Personnage vocal</p>
                <div className="grid grid-cols-2 gap-2">
                  {voices.map((voice) => (
                    <button
                      key={voice.id}
                      onClick={() => updateSetting('voiceType', voice.id)}
                      className={cn(
                        'p-3 rounded-xl border text-left transition-all',
                        settings.voiceType === voice.id
                          ? 'bg-neon-cyan/10 border-neon-cyan/40 text-neon-cyan'
                          : 'bg-white/[0.03] border-white/10 text-white/70 hover:border-white/20'
                      )}
                    >
                      <p className="font-medium text-sm">{voice.name}</p>
                      <p className="text-xs opacity-60 mt-0.5">{voice.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white font-medium text-sm">Vitesse de parole</p>
                  <span className="text-neon-cyan font-mono text-sm">{settings.voiceSpeed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={settings.voiceSpeed}
                  onChange={(e) => updateSetting('voiceSpeed', parseFloat(e.target.value))}
                  className="w-full accent-neon-cyan"
                />
                <div className="flex justify-between text-xs text-white/30 mt-1">
                  <span>0.5x</span>
                  <span>1.0x</span>
                  <span>2.0x</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-neon-orange/10 text-neon-orange">
                  <Bell className="w-5 h-5" />
                </div>
                <CardTitle>Notifications</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <SettingRow label="Notifications push" description="Alertes système">
                <Toggle
                  checked={settings.notifications}
                  onChange={(v) => updateSetting('notifications', v)}
                />
              </SettingRow>

              <SettingRow label="Effets sonores" description="Sons de l'interface">
                <Toggle
                  checked={settings.soundEffects}
                  onChange={(v) => updateSetting('soundEffects', v)}
                />
              </SettingRow>
            </CardContent>
          </Card>
        </motion.div>

        {/* Info */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <GlassPanel className="p-4" hoverGlow={false}>
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-neon-cyan/50" />
              <p className="text-white/30 text-xs">
                Les paramètres sont sauvegardés automatiquement dans votre navigateur via Zustand persist.
                Utilisez <kbd className="px-1 py-0.5 bg-white/10 rounded text-white/50 font-mono">Ctrl+K</kbd> pour accéder aux commandes rapides.
              </p>
            </div>
          </GlassPanel>
        </motion.div>
      </main>
    </div>
  )
}
