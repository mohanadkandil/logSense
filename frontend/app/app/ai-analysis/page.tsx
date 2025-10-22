"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Brain, Sparkles, Play, Pause, RotateCcw, CheckCircle2, Loader2, AlertCircle, ChevronDown, ChevronRight } from "lucide-react"
import { AIReasoningStep } from "@/components/ai-reasoning-step"
import { cn } from "@/lib/utils"
import { useWebSocket } from "@/hooks/useWebSocket"

interface SentryIncident {
  id: string
  title: string
  culprit: string
  level: string
  count: number
  first_seen: string
  last_seen: string
  status: string
  metadata: any
}


export default function AIAnalysisPage() {
  const searchParams = useSearchParams()
  const analysisId = searchParams.get('analysis')

  const [incidents, setIncidents] = useState<SentryIncident[]>([])
  const [selectedIncident, setSelectedIncident] = useState<SentryIncident | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set())
  const [savedAnalysis, setSavedAnalysis] = useState<any>(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // WebSocket for AI analysis
  const {
    isConnected,
    isAnalyzing,
    steps,
    result,
    error: analysisError,
    startAnalysis,
    clearAnalysis
  } = useWebSocket()

  useEffect(() => {
    fetchIncidents()
    loadAnalysisHistory()
    if (analysisId) {
      loadSavedAnalysis(analysisId)
    }
  }, [analysisId])

  // Reload history when a new analysis completes
  useEffect(() => {
    if (result && !isAnalyzing) {
      // Wait a moment for the backend to save the analysis
      setTimeout(() => {
        loadAnalysisHistory()
      }, 1000)
    }
  }, [result, isAnalyzing])

  const fetchIncidents = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/incidents')
      if (!response.ok) {
        throw new Error('Failed to fetch incidents')
      }
      const data = await response.json()
      setIncidents(data)
      if (data.length > 0) {
        setSelectedIncident(data[0])
      }
    } catch (err) {
      console.error('Failed to fetch incidents:', err)
      // Use fallback data for testing
      const fallbackIncidents = [
        {
          id: "INC-2024-001",
          title: "TypeError: Cannot read property 'user' of undefined",
          culprit: "auth-service",
          level: "error",
          count: 127,
          first_seen: new Date(Date.now() - 3600000).toISOString(),
          last_seen: new Date(Date.now() - 120000).toISOString(),
          status: "unresolved",
          metadata: {}
        }
      ]
      setIncidents(fallbackIncidents)
      setSelectedIncident(fallbackIncidents[0])
    } finally {
      setLoading(false)
    }
  }

  const loadSavedAnalysis = async (analysisId: string) => {
    setLoadingAnalysis(true)
    try {
      console.log('Loading analysis with ID:', analysisId)
      const response = await fetch(`http://localhost:8000/api/analyses/${analysisId}`)
      console.log('Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Response error text:', errorText)
        throw new Error(`Failed to fetch analysis: ${response.status} ${response.statusText}`)
      }

      const analysis = await response.json()
      console.log('Successfully loaded analysis:', analysis.id, analysis.error_message)
      setSavedAnalysis(analysis)
    } catch (err) {
      console.error('Failed to fetch saved analysis:', err)
    } finally {
      setLoadingAnalysis(false)
    }
  }

  const loadAnalysisHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await fetch('http://localhost:8000/api/analyses?limit=10')
      if (!response.ok) {
        throw new Error('Failed to fetch analysis history')
      }
      const analyses = await response.json()
      // Filter out test analyses and only show real ones
      const realAnalyses = analyses.filter(analysis => analysis.issue_id !== 'test-123')
      setAnalysisHistory(realAnalyses)
    } catch (err) {
      console.error('Failed to fetch analysis history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleStartAnalysis = () => {
    if (isAnalyzing || !selectedIncident) return
    startAnalysis(selectedIncident.id, selectedIncident.title)
  }

  const handleLoadAnalysis = async (analysisId: string) => {
    // Clear current analysis first
    setSavedAnalysis(null)
    clearAnalysis()

    // Load the selected analysis
    await loadSavedAnalysis(analysisId)

    // Update URL to reflect the loaded analysis
    window.history.pushState({}, '', `/ai-analysis?analysis=${analysisId}`)
  }

  const getConfidenceScore = () => {
    const analysis = getCurrentAnalysis()
    if (analysis?.confidence) {
      return Math.round(analysis.confidence * 100)
    }
    return 0
  }

  const toggleStepExpansion = (index: number) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedSteps(newExpanded)
  }

  // Helper to get current analysis data (live or saved)
  const getCurrentAnalysis = () => {
    return savedAnalysis || result
  }

  // Helper to get current steps (live or saved)
  const getCurrentSteps = () => {
    return savedAnalysis?.steps || steps
  }

  const parseJsonSafely = (jsonString: string) => {
    try {
      return JSON.parse(jsonString)
    } catch {
      return null
    }
  }

  const formatToolOutput = (output: string) => {
    const parsed = parseJsonSafely(output)
    if (parsed && typeof parsed === 'object') {
      // Format key-value pairs nicely
      return Object.entries(parsed)
        .slice(0, 3) // Show first 3 properties
        .map(([key, value]) => `${key}: ${String(value).slice(0, 50)}${String(value).length > 50 ? '...' : ''}`)
        .join(' • ')
    }
    return output.slice(0, 100) + (output.length > 100 ? '...' : '')
  }

  const parseFixSuggestions = (fixes: any) => {
    // Handle case where fixes might be a JSON string
    let parsedFixes = fixes
    if (typeof fixes === 'string') {
      try {
        parsedFixes = JSON.parse(fixes)
      } catch (e) {
        console.error('Failed to parse fixes JSON:', e)
        return []
      }
    }

    if (!Array.isArray(parsedFixes)) return []

    return parsedFixes.map((fix, index) => ({
      title: fix.title || `Fix ${index + 1}`,
      description: fix.steps ? fix.steps.join(' ') : 'No details available',
      confidence: fix.confidence || 0,
      timeEstimate: fix.time_estimate || 'Unknown',
      risk: fix.risk || 'Unknown',
      steps: fix.steps || []
    }))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">AI Agent Analysis</h1>
            {savedAnalysis && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                Viewing Saved Analysis
              </span>
            )}
            {loadingAnalysis && (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading Analysis...
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">Real-time reasoning and decision making</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className="text-gray-500 mono">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <select
            value={selectedIncident?.id || ''}
            onChange={(e) => {
              const incident = incidents.find(inc => inc.id === e.target.value)
              setSelectedIncident(incident || null)
            }}
            disabled={loading || isAnalyzing}
            className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
          >
            {loading ? (
              <option>Loading incidents...</option>
            ) : (
              incidents.map((incident) => (
                <option key={incident.id} value={incident.id}>
                  {incident.id} - {incident.title}
                </option>
              ))
            )}
          </select>

          <button
            onClick={handleStartAnalysis}
            disabled={isAnalyzing || !selectedIncident}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start Analysis
              </>
            )}
          </button>

          {(steps.length > 0 || result) && (
            <button
              onClick={clearAnalysis}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
            >
              <RotateCcw className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Reasoning Process - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          {/* Reasoning Steps */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Agent Reasoning Process</h2>
                <p className="text-xs text-gray-500">Step-by-step analysis</p>
              </div>
            </div>

            <div className="space-y-4">
              {analysisError && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-900">Analysis Failed</p>
                    <p className="text-xs text-red-600 mt-1">{analysisError}</p>
                  </div>
                </div>
              )}

              {!analysisError && steps.length === 0 && !isAnalyzing && (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No active analysis</p>
                  <p className="text-xs">Select an incident and start AI investigation</p>
                </div>
              )}

              {getCurrentSteps().map((step, index) => {
                const isExpanded = expandedSteps.has(index)
                const isCurrentStep = isAnalyzing && index === getCurrentSteps().length - 1

                return (
                  <div
                    key={`step-${index}`}
                    className={cn(
                      "rounded-lg border transition-all duration-300 cursor-pointer",
                      isCurrentStep
                        ? "bg-blue-50 border-blue-200 shadow-sm"
                        : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    )}
                    style={{
                      animation: `fadeIn 0.5s ease-in-out ${index * 0.1}s both`,
                    }}
                    onClick={() => toggleStepExpansion(index)}
                  >
                    {/* Compact Header */}
                    <div className="flex items-center gap-3 p-3">
                      <div className={cn(
                        "p-1.5 rounded-lg flex-shrink-0",
                        isCurrentStep
                          ? "bg-white shadow-sm"
                          : "bg-emerald-100"
                      )}>
                        {isCurrentStep ? (
                          <Loader2 className="h-3 w-3 text-blue-600 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {step.step}
                          </p>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-gray-400 mono">
                              {new Date(step.timestamp).toLocaleTimeString()}
                            </span>
                            {isExpanded ? (
                              <ChevronDown className="h-3 w-3 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-3 w-3 text-gray-400" />
                            )}
                          </div>
                        </div>
                        {!isExpanded && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {formatToolOutput(step.output)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-0 border-t border-gray-100">
                        <div className="mt-3 space-y-2">
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-1">Output:</p>
                            <pre className="text-xs text-gray-600 bg-gray-50 rounded p-2 whitespace-pre-wrap max-h-32 overflow-y-auto">
                              {step.output}
                            </pre>
                          </div>
                          {step.tool && (
                            <div>
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                {step.tool}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Analysis Results - Takes 1 column */}
        <div className="lg:col-span-1 space-y-4">
          {/* Analysis History */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Brain className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Analysis History</h3>
                  <p className="text-xs text-gray-500">Recent investigations</p>
                </div>
              </div>
              <button
                onClick={loadAnalysisHistory}
                disabled={loadingHistory}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <RotateCcw className={`h-4 w-4 ${loadingHistory ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : analysisHistory.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No analyses yet</p>
                  <p className="text-xs">Start an investigation to see history</p>
                </div>
              ) : (
                analysisHistory.map((analysis) => (
                  <div
                    key={analysis.id}
                    onClick={() => handleLoadAnalysis(analysis.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50 ${
                      savedAnalysis?.id === analysis.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {analysis.error_message}
                        </p>
                        <p className="text-xs text-gray-500">
                          Issue #{analysis.issue_id}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(analysis.created_at).toLocaleDateString()} • {Math.round(analysis.confidence * 100)}% confidence
                        </p>
                      </div>
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        analysis.confidence >= 0.8 ? 'bg-green-500' :
                        analysis.confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Confidence Score */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="h-5 w-5 text-violet-600" />
              <h3 className="font-semibold text-gray-900">Analysis Confidence</h3>
            </div>
            <div className="relative">
              <div className="flex items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg className="transform -rotate-90 w-32 h-32">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#e5e7eb"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="url(#gradient)"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={351.86}
                      strokeDashoffset={351.86 * (1 - getConfidenceScore() / 100)}
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">
                      {getConfidenceScore()}%
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-center text-sm text-gray-600 mt-4">
                {result?.confidence
                  ? getConfidenceScore() > 80 ? "High confidence in analysis" :
                    getConfidenceScore() > 60 ? "Medium confidence in analysis" : "Low confidence in analysis"
                  : "No analysis completed"
                }
              </p>
            </div>
          </div>

          {/* Findings Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Key Findings</h3>
            <div className="space-y-3">
              {getCurrentAnalysis()?.root_cause ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="bg-red-100 p-2 rounded-lg flex-shrink-0">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-900 mb-2">Root Cause Analysis</p>
                      <div className="text-sm text-red-800 leading-relaxed">
                        {/* Parse and format the root cause */}
                        {(() => {
                          // First try to parse as JSON
                          try {
                            const parsed = JSON.parse(getCurrentAnalysis().root_cause)
                            if (parsed && typeof parsed === 'object') {
                              return (
                                <div className="space-y-3">
                                  {parsed.root_cause && (
                                    <div>
                                      <p className="font-medium text-red-900">Root Cause:</p>
                                      <p className="mt-1">{parsed.root_cause}</p>
                                    </div>
                                  )}
                                  {parsed.reasoning && (
                                    <div>
                                      <p className="font-medium text-red-900">Analysis:</p>
                                      <p className="mt-1">{parsed.reasoning}</p>
                                    </div>
                                  )}
                                  {parsed.key_evidence && Array.isArray(parsed.key_evidence) && (
                                    <div>
                                      <p className="font-medium text-red-900">Evidence:</p>
                                      <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                                        {parsed.key_evidence.map((evidence: string, i: number) => (
                                          <li key={i} className="text-sm">{evidence}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )
                            }
                          } catch (e) {
                            console.log('Root cause not JSON, displaying as text')
                          }

                          // If not JSON or parsing failed, display as clean text
                          return (
                            <div className="leading-relaxed">
                              {getCurrentAnalysis().root_cause.split('\n').map((line: string, i: number) => (
                                <p key={i} className="mb-2">{line}</p>
                              ))}
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-500 text-center">
                    {isAnalyzing ? "AI is analyzing the root cause..." : "No analysis results yet"}
                  </p>
                </div>
              )}

              {result?.similar_incidents && result.similar_incidents.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Similar Incidents Found</p>
                  <ul className="mt-2 space-y-1">
                    {result.similar_incidents.slice(0, 3).map((incident: any, index: number) => (
                      <li key={index} className="text-xs text-blue-700">
                        • {incident.incident_id || `Incident ${index + 1}`}
                        {incident.similarity && ` (${Math.round(incident.similarity * 100)}% match)`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl border border-violet-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Recommended Actions</h3>
            <div className="space-y-4">
              {getCurrentAnalysis()?.suggested_fixes ? (
                (() => {
                  console.log('Raw suggested_fixes:', getCurrentAnalysis().suggested_fixes)
                  console.log('Type of suggested_fixes:', typeof getCurrentAnalysis().suggested_fixes)
                  const parsedFixes = parseFixSuggestions(getCurrentAnalysis().suggested_fixes)
                  console.log('Parsed fixes:', parsedFixes)
                  return parsedFixes
                })().map((fix, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-violet-200">
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 p-2 rounded-lg flex-shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-2">{fix.title}</h4>

                        <div className="flex items-center gap-4 mb-3 text-xs">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                            {fix.confidence}% confidence
                          </span>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {fix.timeEstimate}
                          </span>
                          <span className={`px-2 py-1 rounded ${
                            fix.risk === 'low' ? 'bg-green-100 text-green-800' :
                            fix.risk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {fix.risk} risk
                          </span>
                        </div>

                        <div className="text-sm text-gray-700 space-y-2">
                          {fix.steps.map((step: string, stepIndex: number) => (
                            <p key={stepIndex} className="flex items-start gap-2">
                              <span className="text-violet-600 font-bold mt-0.5">
                                {stepIndex + 1}.
                              </span>
                              <span>{step}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="bg-white rounded-lg p-4 border border-violet-200">
                    <p className="text-sm text-gray-500">
                      {isAnalyzing ? "AI is generating personalized fix suggestions..." : "No fix suggestions available yet"}
                    </p>
                  </div>
                </div>
              )}
            </div>
            {getCurrentAnalysis()?.suggested_fixes && getCurrentAnalysis().suggested_fixes.length > 0 && (
              <button className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-all duration-200 text-sm font-medium">
                Apply Top Recommendation
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}