import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/utils/cn'
import { forwardRef } from 'react'

interface GlassPanelProps extends HTMLMotionProps<'div'> {
  intensity?: 'light' | 'medium' | 'heavy'
  neonBorder?: boolean
  hoverGlow?: boolean
}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, children, intensity = 'medium', neonBorder = false, hoverGlow = true, ...props }, ref) => {
    const intensityStyles = {
      light: 'bg-white/[0.02] backdrop-blur-sm',
      medium: 'bg-white/[0.05] backdrop-blur-md',
      heavy: 'bg-white/[0.08] backdrop-blur-lg',
    }

    return (
      <motion.div
        ref={ref}
        className={cn(
          'relative rounded-xl border border-white/10',
          intensityStyles[intensity],
          neonBorder && 'neon-border',
          hoverGlow && 'transition-shadow duration-300 hover:shadow-neon-cyan/20',
          className
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

GlassPanel.displayName = 'GlassPanel'
