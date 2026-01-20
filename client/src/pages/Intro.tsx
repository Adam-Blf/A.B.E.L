import { useNavigate } from 'react-router-dom'
import { IntroSequence } from '@/components/intro'

interface IntroProps {
  onComplete: () => void
}

export default function Intro({ onComplete }: IntroProps) {
  const navigate = useNavigate()

  const handleComplete = () => {
    onComplete()
    navigate('/', { replace: true })
  }

  return <IntroSequence onComplete={handleComplete} />
}
