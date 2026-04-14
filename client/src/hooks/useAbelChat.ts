import { useState, useRef, useCallback, useEffect } from 'react'
import { useStore } from '@/store/useStore'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

interface UseAbelChatOptions {
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
  onMessage?: (message: Message) => void
}

interface UseAbelChatReturn {
  messages: Message[]
  isConnected: boolean
  isThinking: boolean
  sendMessage: (content: string) => void
  clearHistory: () => void
  reconnect: () => void
  sessionId: string
}

const generateId = () => Math.random().toString(36).substring(2, 15)

// Determine WebSocket URL based on current location
function getWsUrl(sessionId: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.hostname
  const port = import.meta.env.VITE_BACKEND_PORT || '8000'
  // In dev, backend is proxied via vite — use relative path
  if (import.meta.env.DEV) {
    return `ws://${host}:${port}/ws/chat/${sessionId}`
  }
  return `${protocol}//${window.location.host}/ws/chat/${sessionId}`
}

export function useAbelChat(options: UseAbelChatOptions = {}): UseAbelChatReturn {
  const { onConnect, onDisconnect, onError, onMessage } = options

  const sessionId = useStore((s) => s.sessionId)
  const incrementMessageCount = useStore((s) => s.incrementMessageCount)

  const [messages, setMessages] = useState<Message[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const streamingContentRef = useRef<string>('')

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const url = getWsUrl(sessionId)

    try {
      const ws = new WebSocket(url)

      ws.onopen = () => {
        setIsConnected(true)
        reconnectAttemptsRef.current = 0
        onConnect?.()
      }

      ws.onclose = () => {
        setIsConnected(false)
        onDisconnect?.()

        // Exponential backoff reconnect (max 30s)
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
        reconnectAttemptsRef.current++
        reconnectTimeoutRef.current = setTimeout(connect, delay)
      }

      ws.onerror = () => {
        onError?.(new Error('WebSocket connection error'))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleServerMessage(data)
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e)
        }
      }

      wsRef.current = ws
    } catch (e) {
      onError?.(e as Error)
    }
  }, [sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleServerMessage = useCallback((data: Record<string, unknown>) => {
    switch (data.type) {
      case 'system': {
        const msg: Message = {
          id: generateId(),
          role: 'system',
          content: data.content as string,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, msg])
        setIsThinking(false)
        onMessage?.(msg)
        break
      }

      case 'thinking':
        setIsThinking(true)
        break

      case 'stream': {
        streamingContentRef.current += data.content as string
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last?.isStreaming) {
            return [
              ...prev.slice(0, -1),
              { ...last, content: streamingContentRef.current },
            ]
          }
          return [
            ...prev,
            {
              id: generateId(),
              role: 'assistant',
              content: streamingContentRef.current,
              timestamp: new Date(),
              isStreaming: true,
            },
          ]
        })
        setIsThinking(false)
        break
      }

      case 'assistant': {
        if (data.complete) {
          setMessages((prev) => {
            const last = prev[prev.length - 1]
            if (last?.isStreaming) {
              const finalized = {
                ...last,
                content: (data.content as string) || last.content,
                isStreaming: false,
              }
              onMessage?.(finalized)
              return [...prev.slice(0, -1), finalized]
            }
            // Non-streaming response
            const msg: Message = {
              id: generateId(),
              role: 'assistant',
              content: data.content as string,
              timestamp: new Date(),
            }
            onMessage?.(msg)
            return [...prev, msg]
          })
          streamingContentRef.current = ''
        }
        setIsThinking(false)
        break
      }

      case 'pong':
        break

      case 'status':
        break
    }
  }, [onMessage])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
    wsRef.current?.close()
    wsRef.current = null
  }, [])

  const sendMessage = useCallback((content: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    const msg: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, msg])
    streamingContentRef.current = ''
    incrementMessageCount()

    wsRef.current.send(JSON.stringify({ type: 'message', content }))
  }, [incrementMessageCount])

  const clearHistory = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'clear' }))
    }
    setMessages([])
    streamingContentRef.current = ''
  }, [])

  const reconnect = useCallback(() => {
    disconnect()
    reconnectAttemptsRef.current = 0
    connect()
  }, [connect, disconnect])

  // Connect on mount
  useEffect(() => {
    connect()
    return () => disconnect()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Heartbeat every 25 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }))
      }
    }, 25000)
    return () => clearInterval(interval)
  }, [])

  return {
    messages,
    isConnected,
    isThinking,
    sendMessage,
    clearHistory,
    reconnect,
    sessionId,
  }
}
