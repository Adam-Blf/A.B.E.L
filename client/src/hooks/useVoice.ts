import { useState, useRef, useCallback, useEffect } from 'react'

interface UseVoiceOptions {
  language?: string
  onTranscript?: (text: string) => void
  onError?: (error: string) => void
}

interface UseVoiceReturn {
  isListening: boolean
  isSpeaking: boolean
  isSupported: boolean
  startListening: () => void
  stopListening: () => void
  speak: (text: string, speed?: number, voiceType?: string) => void
  cancelSpeech: () => void
}

// Strip markdown for TTS (cleaner speech output)
function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, 'bloc de code')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .trim()
}

export function useVoice({
  language = 'fr-FR',
  onTranscript,
  onError,
}: UseVoiceOptions = {}): UseVoiceReturn {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) &&
    'speechSynthesis' in window

  const startListening = useCallback(() => {
    if (!isSupported || isListening) return

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = language
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[event.results.length - 1]
        const transcript = result[0].transcript

        if (result.isFinal) {
          onTranscript?.(transcript)
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        const errorMessages: Record<string, string> = {
          'no-speech': 'Aucune parole détectée',
          'audio-capture': 'Microphone non disponible',
          'not-allowed': 'Permission micro refusée',
          'network': 'Erreur réseau',
        }
        onError?.(errorMessages[event.error] || `Erreur: ${event.error}`)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
      recognitionRef.current = recognition
    } catch (e) {
      onError?.('Reconnaissance vocale non disponible')
      setIsListening(false)
    }
  }, [isSupported, isListening, language, onTranscript, onError])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const speak = useCallback((text: string, speed = 1, voiceType = 'default') => {
    if (!('speechSynthesis' in window)) return

    const synth = window.speechSynthesis
    synth.cancel()

    const clean = stripMarkdown(text)
    if (!clean.trim()) return

    const utterance = new SpeechSynthesisUtterance(clean)
    utterance.rate = Math.max(0.5, Math.min(2, speed))
    utterance.pitch = 1
    utterance.volume = 1
    utterance.lang = language

    // Try to select an appropriate voice
    const loadVoices = () => {
      const voices = synth.getVoices()
      if (voices.length > 0) {
        // Prefer French voices
        const frenchVoice = voices.find(
          (v) => v.lang.startsWith('fr') && !v.name.includes('Google')
        ) || voices.find((v) => v.lang.startsWith('fr'))

        if (frenchVoice) {
          utterance.voice = frenchVoice
        }
      }
    }

    if (synth.getVoices().length > 0) {
      loadVoices()
    } else {
      synth.onvoiceschanged = loadVoices
    }

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    synth.speak(utterance)
  }, [language])

  const cancelSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
      window.speechSynthesis?.cancel()
    }
  }, [])

  return {
    isListening,
    isSpeaking,
    isSupported,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
  }
}
