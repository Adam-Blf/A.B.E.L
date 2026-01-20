import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface LogoRevealProps {
  onComplete?: () => void
  className?: string
}

export function LogoReveal({ onComplete, className }: LogoRevealProps) {
  const letters = ['A', '.', 'B', '.', 'E', '.', 'L']

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.5,
      },
    },
  }

  const letterVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.5,
      rotateX: -90,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 200,
      },
    },
  }

  const glowVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: [0, 1, 0.5],
      scale: [0.8, 1.2, 1],
      transition: {
        duration: 1,
        delay: 1.5,
        onComplete,
      },
    },
  }

  return (
    <div className={cn('relative', className)}>
      {/* Background glow */}
      <motion.div
        className="absolute inset-0 blur-3xl"
        variants={glowVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="w-full h-full bg-gradient-to-r from-neon-cyan/30 via-neon-violet/30 to-neon-magenta/30 rounded-full" />
      </motion.div>

      {/* Letters */}
      <motion.div
        className="relative flex items-center justify-center gap-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {letters.map((letter, index) => (
          <motion.span
            key={index}
            className={cn(
              'font-display font-black text-6xl md:text-8xl lg:text-9xl',
              letter === '.' ? 'text-neon-cyan mx-1' : 'text-white'
            )}
            variants={letterVariants}
            style={{
              textShadow: letter !== '.'
                ? '0 0 40px rgba(0, 245, 255, 0.5), 0 0 80px rgba(139, 92, 246, 0.3)'
                : '0 0 20px rgba(0, 245, 255, 1)',
            }}
          >
            {letter}
          </motion.span>
        ))}
      </motion.div>

      {/* HUD corners */}
      <motion.div
        className="absolute -inset-8 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.5 }}
      >
        {/* Top left */}
        <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-neon-cyan" />
        {/* Top right */}
        <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-neon-cyan" />
        {/* Bottom left */}
        <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-neon-cyan" />
        {/* Bottom right */}
        <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-neon-cyan" />
      </motion.div>
    </div>
  )
}
