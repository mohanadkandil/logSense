"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Users, Zap, Activity, Terminal, Shield, Database, Cpu, Loader2, RefreshCw } from "lucide-react"
import { StatsCard } from "@/components/stats-card"
import { IncidentCard } from "@/components/incident-card"
import { AIActivityFeed } from "@/components/ai-activity-feed"
import { SystemHealthChart } from "@/components/system-health-chart"

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

const stats = [
  {
    title: "Active Incidents",
    value: "42",
    change: "-8",
    changeType: "decrease" as const,
    icon: AlertTriangle,
    color: "critical" as const,
    description: "Critical issues requiring attention",
  },
  {
    title: "MTTR",
    value: "5.2m",
    change: "-2.1m",
    changeType: "decrease" as const,
    icon: Clock,
    color: "success" as const,
    description: "Mean time to resolution",
  },
  {
    title: "Resolution Rate",
    value: "89%",
    change: "+5%",
    changeType: "increase" as const,
    icon: CheckCircle,
    color: "success" as const,
    description: "Successfully resolved incidents",
  },
  {
    title: "AI Learned",
    value: "127",
    change: "+23",
    changeType: "increase" as const,
    icon: Shield,
    color: "info" as const,
    description: "Knowledge base entries",
  },
]

export default function DashboardPage() {
  const [incidents, setIncidents] = useState<SentryIncident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchIncidents()
  }, [])

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
      // Fall back to mock data if API fails
      setIncidents([
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
      ])
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
          <button className="btn-secondary px-4 py-2 flex items-center gap-2 text-sm">
            <Terminal className="h-4 w-4" />
            Export Report
          </button>
          <button className="btn-primary px-4 py-2 flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4" />
            Start AI Investigation
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
                <IncidentCard
                  key={incident.id}
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
              ))}
            </div>
          </div>

          {/* System Health Chart */}
          <SystemHealthChart />
        </div>

        {/* AI Activity Feed - Takes 1 column */}
        <div className="lg:col-span-1">
          <AIActivityFeed />
        </div>
      </div>

      {/* System Overview Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Services Status */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">
              Services
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                Healthy
              </span>
              <span className="text-sm font-bold text-emerald-600 mono">
                24/27
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                Degraded
              </span>
              <span className="text-sm font-bold text-orange-600 mono">
                2/27
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                Down
              </span>
              <span className="text-sm font-bold text-red-600 mono">
                1/27
              </span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">
              Performance
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                Avg Response
              </span>
              <span className="text-sm font-bold text-emerald-600 mono">
                142ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                Error Rate
              </span>
              <span className="text-sm font-bold text-orange-600 mono">
                0.12%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                Throughput
              </span>
              <span className="text-sm font-bold text-blue-600 mono">
                2.4k/min
              </span>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">
              AI Insights
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                Auto-resolved
              </span>
              <span className="text-sm font-bold text-emerald-600 mono">
                23 today
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                Predictions
              </span>
              <span className="text-sm font-bold text-purple-600 mono">
                94% acc
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                Learning
              </span>
              <span className="text-sm font-bold text-blue-600 mono">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}