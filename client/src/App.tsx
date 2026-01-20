import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, useState, useEffect } from 'react'
import { Toaster } from 'sonner'

// Lazy load pages
const Intro = lazy(() => import('@/pages/Intro'))
const Home = lazy(() => import('@/pages/Home'))
const Chat = lazy(() => import('@/pages/Chat'))
const System = lazy(() => import('@/pages/System'))
const Settings = lazy(() => import('@/pages/Settings'))

// Loading fallback
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-abel-dark">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
        <p className="text-white/50 font-mono text-sm">Chargement...</p>
      </div>
    </div>
  )
}

function App() {
  const [hasSeenIntro, setHasSeenIntro] = useState<boolean | null>(null)

  useEffect(() => {
    // Check if user has seen intro
    const seen = localStorage.getItem('abel-intro-seen')
    setHasSeenIntro(seen === 'true')
  }, [])

  const handleIntroComplete = () => {
    localStorage.setItem('abel-intro-seen', 'true')
    setHasSeenIntro(true)
  }

  // Wait for localStorage check
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
            background: 'rgba(18, 18, 26, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white',
            backdropFilter: 'blur(10px)',
          },
        }}
      />

      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Intro route */}
          <Route
            path="/intro"
            element={<Intro onComplete={handleIntroComplete} />}
          />

          {/* Main routes */}
          <Route
            path="/"
            element={hasSeenIntro ? <Home /> : <Navigate to="/intro" replace />}
          />
          <Route path="/chat" element={<Chat />} />
          <Route path="/system" element={<System />} />
          <Route path="/settings" element={<Settings />} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default App
