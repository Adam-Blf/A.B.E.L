import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/utils/cn'
import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
  children?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, variant = 'primary', size = 'md', loading = false, icon, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-neon-cyan/10 border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/20 hover:border-neon-cyan hover:shadow-neon-cyan',
      secondary: 'bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/40',
      ghost: 'bg-transparent border-transparent text-white/70 hover:text-white hover:bg-white/5',
      danger: 'bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-500',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-5 py-2.5 text-base',
      lg: 'px-7 py-3 text-lg',
    }

    return (
      <motion.button
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center gap-2',
          'font-medium rounded-lg border transition-all duration-300',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/50',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : icon ? (
          icon
        ) : null}
        {children}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
