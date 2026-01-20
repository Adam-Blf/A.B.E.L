import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface NeonBorderProps {
  children: React.ReactNode
  className?: string
  color?: 'cyan' | 'magenta' | 'violet' | 'gradient'
  animated?: boolean
  intensity?: 'subtle' | 'medium' | 'intense'
}

export function NeonBorder({
  children,
  className,
  color = 'cyan',
  animated = true,
  intensity = 'medium',
}: NeonBorderProps) {
  const colors = {
    cyan: 'from-neon-cyan to-neon-cyan',
    magenta: 'from-neon-magenta to-neon-magenta',
    violet: 'from-neon-violet to-neon-violet',
    gradient: 'from-neon-cyan via-neon-violet to-neon-magenta',
  }

  const intensities = {
    subtle: 'opacity-30',
    medium: 'opacity-50',
    intense: 'opacity-80',
  }

  return (
    <div className={cn('relative', className)}>
      {/* Neon glow background */}
      <motion.div
        className={cn(
          'absolute -inset-[1px] rounded-xl bg-gradient-to-r blur-sm',
          colors[color],
          intensities[intensity]
        )}
        animate={animated ? {
          opacity: [0.3, 0.6, 0.3],
        } : undefined}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Border */}
      <div
        className={cn(
          'absolute inset-0 rounded-xl bg-gradient-to-r p-[1px]',
          colors[color],
          intensities[intensity]
        )}
      >
        <div className="h-full w-full rounded-xl bg-abel-dark" />
      </div>

      {/* Content */}
      <div className="relative">{children}</div>
    </div>
  )
}
