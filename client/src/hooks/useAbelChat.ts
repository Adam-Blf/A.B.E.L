import { useState, useRef, useCallback, useEffect } from 'react'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

interface UseAbelChatOptions {
  url?: string
  userId?: string
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
}

interface UseAbelChatReturn {
  messages: Message[]
  isConnected: boolean
  isThinking: boolean
  sendMessage: (content: string) => void
  clearHistory: () => void
  reconnect: () => void
}

const generateId = () => Math.random().toString(36).substring(2, 15)

export function useAbelChat(options: UseAbelChatOptions = {}): UseAbelChatReturn {
  const {
    url = `ws://localhost:8000/ws/chat/${generateId()}`,
    userId,
    onConnect,
    onDisconnect,
    onError
  } = options

  const [messages, setMessages] = useState<Message[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const streamingMessageRef = useRef<string>('')

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      const ws = new WebSocket(url)

      ws.onopen = () => {
        setIsConnected(true)
        onConnect?.()
      }

      ws.onclose = () => {
        setIsConnected(false)
        onDisconnect?.()

        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, 3000)
      }

      ws.onerror = () => {
        onError?.(new Error('WebSocket error'))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          switch (data.type) {
            case 'system':
              setMessages((prev) => [
                ...prev,
                {
                  id: generateId(),
                  role: 'system',
                  content: data.content,
                  timestamp: new Date()
                }
              ])
              setIsThinking(false)
              break

            case 'thinking':
              setIsThinking(true)
              break

            case 'stream':
              // Accumulate streaming content
              streamingMessageRef.current += data.content
              setMessages((prev) => {
                const lastMessage = prev[prev.length - 1]
                if (lastMessage?.isStreaming) {
                  return [
                    ...prev.slice(0, -1),
                    {
                      ...lastMessage,
                      content: streamingMessageRef.current
                    }
                  ]
                } else {
                  return [
                    ...prev,
                    {
                      id: generateId(),
                      role: 'assistant',
                      content: streamingMessageRef.current,
                      timestamp: new Date(),
                      isStreaming: true
                    }
                  ]
                }
              })
              setIsThinking(false)
              break

            case 'assistant':
              if (data.complete) {
                // Finalize streaming message
                setMessages((prev) => {
                  const lastMessage = prev[prev.length - 1]
                  if (lastMessage?.isStreaming) {
                    return [
                      ...prev.slice(0, -1),
                      {
                        ...lastMessage,
                        content: data.content,
                        isStreaming: false
                      }
                    ]
                  }
                  return prev
                })
                streamingMessageRef.current = ''
              } else {
                // Non-streaming response
                setMessages((prev) => [
                  ...prev,
                  {
                    id: generateId(),
                    role: 'assistant',
                    content: data.content,
                    timestamp: new Date()
                  }
                ])
              }
              setIsThinking(false)
              break

            case 'pong':
              // Heartbeat response
              break
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e)
        }
      }

      wsRef.current = ws
    } catch (e) {
      onError?.(e as Error)
    }
  }, [url, onConnect, onDisconnect, onError])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    wsRef.current?.close()
    wsRef.current = null
  }, [])

  const sendMessage = useCallback((content: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected')
      return
    }

    // Add user message immediately
    setMessages((prev) => [
      ...prev,
      {
        id: generateId(),
        role: 'user',
        content,
        timestamp: new Date()
      }
    ])

    // Reset streaming ref
    streamingMessageRef.current = ''

    // Send to server
    wsRef.current.send(
      JSON.stringify({
        type: 'message',
        content,
        user_id: userId
      })
    )
  }, [userId])

  const clearHistory = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'clear' }))
    }
    setMessages([])
  }, [])

  const reconnect = useCallback(() => {
    disconnect()
    connect()
  }, [connect, disconnect])

  // Connect on mount
  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  // Ping/heartbeat every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  return {
    messages,
    isConnected,
    isThinking,
    sendMessage,
    clearHistory,
    reconnect
  }
}
