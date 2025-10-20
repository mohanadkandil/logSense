"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Users, Zap, Activity, Terminal, Shield, Database, Cpu, Loader2, RefreshCw } from "lucide-react"
import { StatsCard } from "@/components/stats-card"
import { IncidentCard } from "@/components/incident-card"
import { AIActivityFeed } from "@/components/ai-activity-feed"
import { SystemHealthChart } from "@/components/system-health-chart"
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

export default function DashboardPage() {
  const [incidents, setIncidents] = useState<SentryIncident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIncident, setSelectedIncident] = useState<SentryIncident | null>(null)
  const [systemStats, setSystemStats] = useState({
    totalIncidents: 0,
    criticalIncidents: 0,
    avgConfidence: 0,
    highConfidenceAnalyses: 0,
    analysesToday: 0,
    knowledgeBaseSize: 0
  })
  const [stats, setStats] = useState([
    {
      title: "Active Incidents",
      value: "0",
      change: "",
      changeType: "neutral" as const,
      icon: AlertTriangle,
      color: "critical" as const,
      description: "Critical issues requiring attention",
    },
    {
      title: "AI Analyses",
      value: "0",
      change: "",
      changeType: "neutral" as const,
      icon: Shield,
      color: "info" as const,
      description: "Total investigations completed",
    },
    {
      title: "Avg Confidence",
      value: "0%",
      change: "",
      changeType: "neutral" as const,
      icon: CheckCircle,
      color: "success" as const,
      description: "AI analysis confidence score",
    },
    {
      title: "Resolved Today",
      value: "0",
      change: "",
      changeType: "neutral" as const,
      icon: Clock,
      color: "success" as const,
      description: "High-confidence resolutions today",
    },
  ])

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
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Fetch incidents and analyses
      const [incidentsRes, analysesRes] = await Promise.all([
        fetch('http://localhost:8000/api/incidents?limit=100'),
        fetch('http://localhost:8000/api/analyses?limit=100')
      ])

      const incidents = incidentsRes.ok ? await incidentsRes.json() : []
      const analyses = analysesRes.ok ? await analysesRes.json() : []

      // Filter real analyses (not test ones)
      const realAnalyses = analyses.filter(a => a.issue_id !== 'test-123')

      // Calculate stats
      const activeIncidents = incidents.length
      const totalAnalyses = realAnalyses.length
      const avgConfidence = realAnalyses.length > 0
        ? Math.round((realAnalyses.reduce((sum, a) => sum + a.confidence, 0) / realAnalyses.length) * 100)
        : 0

      // Count resolved today (high confidence analyses)
      const today = new Date().toDateString()
      const resolvedToday = realAnalyses.filter(a =>
        new Date(a.created_at).toDateString() === today && a.confidence >= 0.8
      ).length

      // Additional system stats
      const criticalIncidents = incidents.filter(i => i.level === 'error' || i.level === 'fatal').length
      const highConfidenceAnalyses = realAnalyses.filter(a => a.confidence >= 0.8).length
      const analysesToday = realAnalyses.filter(a =>
        new Date(a.created_at).toDateString() === today
      ).length

      // Update system stats
      setSystemStats({
        totalIncidents: activeIncidents,
        criticalIncidents,
        avgConfidence,
        highConfidenceAnalyses,
        analysesToday,
        knowledgeBaseSize: realAnalyses.length
      })

      // Update stats with real data
      setStats([
        {
          title: "Active Incidents",
          value: activeIncidents.toString(),
          change: "",
          changeType: "neutral" as const,
          icon: AlertTriangle,
          color: "critical" as const,
          description: "Critical issues requiring attention",
        },
        {
          title: "AI Analyses",
          value: totalAnalyses.toString(),
          change: "",
          changeType: "neutral" as const,
          icon: Shield,
          color: "info" as const,
          description: "Total investigations completed",
        },
        {
          title: "Avg Confidence",
          value: `${avgConfidence}%`,
          change: "",
          changeType: "neutral" as const,
          icon: CheckCircle,
          color: "success" as const,
          description: "AI analysis confidence score",
        },
        {
          title: "Resolved Today",
          value: resolvedToday.toString(),
          change: "",
          changeType: "neutral" as const,
          icon: Clock,
          color: "success" as const,
          description: "High-confidence resolutions today",
        },
      ])
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchIncidents = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('http://localhost:8000/api/incidents')
      if (!response.ok) {
        throw new Error('Failed to fetch incidents')
      }
      const data = await response.json()
      setIncidents(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setIncidents([])
    } finally {
      setLoading(false)
    }
  }

  const mapSeverity = (level: string): "critical" | "error" | "warning" => {
    if (level === 'fatal' || level === 'critical') return 'critical'
    if (level === 'error') return 'error'
    return 'warning'
  }

  const mapStatus = (status: string): "analyzing" | "investigating" | "resolved" => {
    if (status === 'resolved') return 'resolved'
    if (status === 'ignored') return 'resolved'
    return Math.random() > 0.5 ? 'analyzing' : 'investigating'
  }

  const getTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diff < 60) return `${diff} seconds ago`
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
    return `${Math.floor(diff / 86400)} days ago`
  }

  const getServiceName = (incident: SentryIncident) => {
    if (incident.metadata?.sdk?.name) {
      return incident.metadata.sdk.name.replace('sentry.', '').replace('.', '-')
    }
    return incident.culprit || 'unknown-service'
  }

  const handleStartAnalysis = () => {
    if (isAnalyzing) return

    // Use the first available incident for analysis
    const incident = selectedIncident || incidents[0]
    if (!incident) {
      alert('No incidents available for analysis')
      return
    }

    console.log('Starting analysis for incident:', incident.id, incident.title)
    setSelectedIncident(incident)
    startAnalysis(incident.id, incident.title)
  }

  const handleIncidentClick = (incident: SentryIncident) => {
    if (isAnalyzing) return

    console.log('Selecting incident for analysis:', incident.id, incident.title)
    setSelectedIncident(incident)
    startAnalysis(incident.id, incident.title)
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-full">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Real-time monitoring and AI-powered incident intelligence
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className="flex items-center gap-2 text-xs">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className="text-gray-500 mono">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Clear Analysis Button */}
          {(steps.length > 0 || result) && (
            <button
              onClick={clearAnalysis}
              className="btn-secondary px-3 py-2 flex items-center gap-2 text-xs"
            >
              <RefreshCw className="h-3 w-3" />
              Clear
            </button>
          )}

          <button className="btn-secondary px-4 py-2 flex items-center gap-2 text-sm">
            <Terminal className="h-4 w-4" />
            Export Report
          </button>
          <button
            onClick={handleStartAnalysis}
            disabled={isAnalyzing || incidents.length === 0}
            className="btn-gradient-blue px-4 py-2 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Start AI Investigation
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Incidents - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          {/* Recent Incidents Card */}
          <div className="card-elevated p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Recent Incidents
                  </h2>
                  <p className="text-xs text-gray-500 mono">
                    Live from Sentry
                  </p>
                </div>
              </div>
              <button
                onClick={fetchIncidents}
                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            <div className="space-y-3">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              )}
              {!loading && incidents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No incidents found
                </div>
              )}
              {!loading && incidents.slice(0, 5).map((incident) => (
                <div
                  key={incident.id}
                  onClick={() => handleIncidentClick(incident)}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedIncident?.id === incident.id
                      ? 'ring-2 ring-blue-500 ring-offset-2'
                      : ''
                  } ${isAnalyzing ? 'pointer-events-none opacity-50' : 'hover:scale-[1.02]'}`}
                >
                  <IncidentCard
                    id={incident.id}
                    title={incident.title}
                    severity={mapSeverity(incident.level)}
                    service={getServiceName(incident)}
                    status={mapStatus(incident.status)}
                    occurrences={incident.count}
                    lastSeen={getTimeAgo(incident.last_seen)}
                    aiConfidence={Math.random() * 0.3 + 0.7}
                    affectedUsers={Math.floor(Math.random() * 1000)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* System Health Chart */}
          <SystemHealthChart />
        </div>

        {/* AI Activity Feed - Takes 1 column */}
        <div className="lg:col-span-1">
          <AIActivityFeed
            steps={steps}
            isAnalyzing={isAnalyzing}
            error={analysisError}
            result={result}
          />
        </div>
      </div>

      {/* System Overview Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Incident Status */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-gray-900">
              Incident Status
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                Total Active
              </span>
              <span className="text-sm font-bold text-blue-600 mono">
                {systemStats.totalIncidents}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                Critical/Error
              </span>
              <span className="text-sm font-bold text-red-600 mono">
                {systemStats.criticalIncidents}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                Non-Critical
              </span>
              <span className="text-sm font-bold text-emerald-600 mono">
                {systemStats.totalIncidents - systemStats.criticalIncidents}
              </span>
            </div>
          </div>
        </div>

        {/* Analysis Performance */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">
              Analysis Performance
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                Avg Confidence
              </span>
              <span className="text-sm font-bold text-emerald-600 mono">
                {systemStats.avgConfidence}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                High Confidence
              </span>
              <span className="text-sm font-bold text-blue-600 mono">
                {systemStats.highConfidenceAnalyses}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                Analyzed Today
              </span>
              <span className="text-sm font-bold text-purple-600 mono">
                {systemStats.analysesToday}
              </span>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">
              AI Knowledge
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                Knowledge Base
              </span>
              <span className="text-sm font-bold text-emerald-600 mono">
                {systemStats.knowledgeBaseSize} entries
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                Confidence Rate
              </span>
              <span className="text-sm font-bold text-purple-600 mono">
                {systemStats.knowledgeBaseSize > 0 ? Math.round((systemStats.highConfidenceAnalyses / systemStats.knowledgeBaseSize) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                Status
              </span>
              <span className="text-sm font-bold text-blue-600 mono">
                {systemStats.knowledgeBaseSize > 0 ? 'Learning' : 'Idle'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}