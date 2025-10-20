import { useCallback, useEffect, useRef, useState } from 'react'

export interface WebSocketMessage {
  type: 'step' | 'complete' | 'error'
  content: any
}

export interface AnalysisStep {
  step: string
  tool?: string
  output: string
  timestamp: string
}

export interface AnalysisResult {
  issue_id: string
  error_message: string
  root_cause: string
  confidence: number
  suggested_fixes: Array<{
    title: string
    steps: string[]
    confidence: number
    time_estimate: string
    risk: string
  }>
  similar_incidents: any[]
  duration_seconds: number
  status: string
}

interface UseWebSocketReturn {
  isConnected: boolean
  isAnalyzing: boolean
  steps: AnalysisStep[]
  result: AnalysisResult | null
  error: string | null
  startAnalysis: (issueId: string, errorMessage: string) => void
  clearAnalysis: () => void
}

export function useWebSocket(): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [steps, setSteps] = useState<AnalysisStep[]>([])
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback((issueId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    const wsUrl = `ws://localhost:8000/ws/analyze/${issueId}`
    console.log('Connecting to WebSocket:', wsUrl)

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        setError(null)
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          console.log('WebSocket message:', message)

          switch (message.type) {
            case 'step':
              setSteps(prev => [...prev, message.content])
              break
            case 'complete':
              setResult(message.content)
              setIsAnalyzing(false)
              break
            case 'error':
              setError(message.content.error || 'Analysis failed')
              setIsAnalyzing(false)
              break
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
          setError('Failed to parse server response')
        }
      }

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        setIsConnected(false)
        if (!event.wasClean && isAnalyzing) {
          // Attempt to reconnect if connection was lost during analysis
          reconnectTimeoutRef.current = setTimeout(() => {
            connect(issueId)
          }, 3000)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setError('Connection error occurred')
        setIsConnected(false)
      }

    } catch (err) {
      console.error('Failed to create WebSocket connection:', err)
      setError('Failed to establish connection')
    }
  }, [isAnalyzing])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }, [])

  const startAnalysis = useCallback((issueId: string, errorMessage: string) => {
    if (isAnalyzing) {
      console.log('Analysis already in progress')
      return
    }

    console.log('Starting analysis for issue:', issueId)
    setIsAnalyzing(true)
    setSteps([])
    setResult(null)
    setError(null)

    connect(issueId)
  }, [connect, isAnalyzing])

  const clearAnalysis = useCallback(() => {
    setSteps([])
    setResult(null)
    setError(null)
    setIsAnalyzing(false)
    disconnect()
  }, [disconnect])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    isConnected,
    isAnalyzing,
    steps,
    result,
    error,
    startAnalysis,
    clearAnalysis
  }
}