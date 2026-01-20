import { motion } from 'framer-motion'

interface HUDOverlayProps {
  show: boolean
}

export function HUDOverlay({ show }: HUDOverlayProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Scan line */}
      <motion.div
        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neon-cyan to-transparent"
        initial={{ top: '-2px' }}
        animate={{ top: '100vh' }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{ opacity: 0.3 }}
      />

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 text-neon-cyan/50 font-mono text-xs">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div>SYS::INIT</div>
          <div className="text-white/30">v1.0.0</div>
        </motion.div>
      </div>

      <div className="absolute top-4 right-4 text-neon-cyan/50 font-mono text-xs text-right">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div>ABEL::ONLINE</div>
          <div className="text-white/30">{new Date().toISOString().split('T')[0]}</div>
        </motion.div>
      </div>

      <div className="absolute bottom-4 left-4 text-neon-cyan/50 font-mono text-xs">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
            <span>CONNEXION SÉCURISÉE</span>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-4 right-4 text-neon-cyan/50 font-mono text-xs text-right">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div>BIOMETRIC::READY</div>
        </motion.div>
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 245, 255, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 245, 255, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  )
}
