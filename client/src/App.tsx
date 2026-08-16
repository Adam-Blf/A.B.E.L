import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { lazy, Suspense, useState, useEffect, useRef } from 'react'
import { Toaster } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'
import { CommandPalette } from '@/components/CommandPalette'
import { useStore } from '@/store/useStore'

// Lazy load pages
const Intro = lazy(() => import('@/pages/Intro'))
const Home = lazy(() => import('@/pages/Home'))
const Chat = lazy(() => import('@/pages/Chat'))
const System = lazy(() => import('@/pages/System'))
const Settings = lazy(() => import('@/pages/Settings'))
const Models = lazy(() => import('@/pages/Models'))

// Loading fallback with HUD style
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-abel-dark">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-neon-cyan/20 border-t-neon-cyan rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 bg-neon-cyan/20 rounded-full animate-pulse" />
          </div>
        </div>
        <p className="text-white/30 font-mono text-xs tracking-widest uppercase">
          A.B.E.L chargement...
        </p>
      </div>
    </div>
  )
}

// Page transition wrapper
function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}

function App() {
  const [hasSeenIntro, setHasSeenIntro] = useState<boolean | null>(null)
  const { setCommandPaletteOpen, commandPaletteOpen } = useStore()
  const location = useLocation()

  // Check intro state
  useEffect(() => {
    const seen = localStorage.getItem('abel-intro-seen')
    setHasSeenIntro(seen === 'true')
  }, [])

  const handleIntroComplete = () => {
    localStorage.setItem('abel-intro-seen', 'true')
    setHasSeenIntro(true)
  }

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K: command palette (handled in CommandPalette too, but ensure it's global)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }

      // Escape: close palette
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [commandPaletteOpen, setCommandPaletteOpen])

  if (hasSeenIntro === null) {
    return <LoadingFallback />
  }

  return (
    <>
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(18, 18, 26, 0.95)',
            border: '1px solid rgba(0, 245, 255, 0.15)',
            color: 'white',
            backdropFilter: 'blur(20px)',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '14px',
          },
        }}
      />

      {/* Global command palette */}
      <CommandPalette />

      {/* Routes */}
      <Suspense fallback={<LoadingFallback />}>
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route
              path="/intro"
              element={
                <PageTransition>
                  <Intro onComplete={handleIntroComplete} />
                </PageTransition>
              }
            />
            <Route
              path="/"
              element={
                hasSeenIntro ? (
                  <PageTransition>
                    <Home />
                  </PageTransition>
                ) : (
                  <Navigate to="/intro" replace />
                )
              }
            />
            <Route
              path="/chat"
              element={
                <PageTransition>
                  <Chat />
                </PageTransition>
              }
            />
            <Route
              path="/system"
              element={
                <PageTransition>
                  <System />
                </PageTransition>
              }
            />
            <Route
              path="/settings"
              element={
                <PageTransition>
                  <Settings />
                </PageTransition>
              }
            />
            <Route
              path="/models"
              element={
                <PageTransition>
                  <Models />
                </PageTransition>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </>
  )
}

export default App
