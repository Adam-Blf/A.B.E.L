import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface GlitchTextProps {
  text: string
  className?: string
  delay?: number
  glitchIntensity?: 'light' | 'medium' | 'heavy'
}

export function GlitchText({
  text,
  className,
  delay = 0,
  glitchIntensity = 'medium'
}: GlitchTextProps) {
  const intensityValues = {
    light: { x: 1, y: 1 },
    medium: { x: 2, y: 2 },
    heavy: { x: 4, y: 3 },
  }

  const { x, y } = intensityValues[glitchIntensity]

  return (
    <motion.div
      className={cn('relative inline-block', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.1 }}
    >
      {/* Main text */}
      <motion.span
        className="relative z-10"
        animate={{
          x: [0, -x, x, -x, 0],
          y: [0, y, -y, y, 0],
        }}
        transition={{
          duration: 0.2,
          delay: delay + 0.1,
          times: [0, 0.2, 0.4, 0.6, 1],
        }}
      >
        {text}
      </motion.span>

      {/* Cyan glitch layer */}
      <motion.span
        className="absolute inset-0 text-neon-cyan z-0"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)' }}
        animate={{
          x: [0, x * 2, -x, x, 0],
          opacity: [0, 1, 0.5, 1, 0],
        }}
        transition={{
          duration: 0.3,
          delay: delay + 0.05,
          times: [0, 0.25, 0.5, 0.75, 1],
        }}
      >
        {text}
      </motion.span>

      {/* Magenta glitch layer */}
      <motion.span
        className="absolute inset-0 text-neon-magenta z-0"
        style={{ clipPath: 'polygon(0 55%, 100% 55%, 100% 100%, 0 100%)' }}
        animate={{
          x: [0, -x * 2, x, -x, 0],
          opacity: [0, 1, 0.5, 1, 0],
        }}
        transition={{
          duration: 0.3,
          delay: delay + 0.08,
          times: [0, 0.25, 0.5, 0.75, 1],
        }}
      >
        {text}
      </motion.span>
    </motion.div>
  )
}
