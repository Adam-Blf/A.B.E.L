import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogoReveal } from './LogoReveal'
import { GlitchText } from './GlitchText'
import { HUDOverlay } from './HUDOverlay'

interface IntroSequenceProps {
  onComplete: () => void
}

type Phase = 'black' | 'logo' | 'subtitle' | 'transition' | 'complete'

export function IntroSequence({ onComplete }: IntroSequenceProps) {
  const [phase, setPhase] = useState<Phase>('black')
  const [showHUD, setShowHUD] = useState(false)

  useEffect(() => {
    const timers: NodeJS.Timeout[] = []

    // Phase 1: Black screen (1s)
    timers.push(setTimeout(() => setPhase('logo'), 1000))

    // Phase 2: Show HUD elements
    timers.push(setTimeout(() => setShowHUD(true), 1500))

    // Phase 3: Show subtitle after logo animation (3s)
    timers.push(setTimeout(() => setPhase('subtitle'), 3000))

    // Phase 4: Start transition (5s)
    timers.push(setTimeout(() => setPhase('transition'), 5500))

    // Phase 5: Complete (6s)
    timers.push(setTimeout(() => {
      setPhase('complete')
      onComplete()
    }, 6500))

    return () => timers.forEach(clearTimeout)
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-abel-darker z-50 overflow-hidden">
      {/* HUD Overlay */}
      <HUDOverlay show={showHUD} />

      {/* Background effects */}
      <div className="absolute inset-0">
        {/* Radial gradient */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase !== 'black' ? 1 : 0 }}
          transition={{ duration: 1 }}
          style={{
            background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
        <AnimatePresence mode="wait">
          {/* Logo phase */}
          {(phase === 'logo' || phase === 'subtitle' || phase === 'transition') && (
            <motion.div
              key="logo"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0, filter: 'blur(20px)' }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-8"
            >
              <LogoReveal />

              {/* Subtitle */}
              <AnimatePresence>
                {(phase === 'subtitle' || phase === 'transition') && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                  >
                    <div className="flex items-center gap-3 font-display text-xl md:text-2xl tracking-[0.3em] text-white/80">
                      <GlitchText text="ADAM" delay={0} />
                      <span className="text-neon-cyan">•</span>
                      <GlitchText text="BELOUCIF" delay={0.2} />
                      <span className="text-neon-cyan">•</span>
                      <GlitchText text="EST" delay={0.4} />
                      <span className="text-neon-cyan">•</span>
                      <GlitchText text="LÀ" delay={0.6} />
                    </div>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                      className="mt-6 text-white/40 font-mono text-sm tracking-wider"
                    >
                      ASSISTANT PERSONNEL INTELLIGENT
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading indicator */}
        {phase === 'transition' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-20 flex flex-col items-center gap-3"
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-neon-cyan"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
            <span className="text-white/30 font-mono text-xs">INITIALISATION...</span>
          </motion.div>
        )}
      </div>

      {/* Transition overlay */}
      <AnimatePresence>
        {phase === 'transition' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="absolute inset-0 bg-abel-dark z-20"
          />
        )}
      </AnimatePresence>
    </div>
  )
}
