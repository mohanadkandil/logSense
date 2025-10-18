"use client"

import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Users, Zap, Activity, Terminal, Shield, Database, Cpu } from "lucide-react"
import { StatsCard } from "@/components/stats-card"
import { IncidentCard } from "@/components/incident-card"
import { AIActivityFeed } from "@/components/ai-activity-feed"
import { SystemHealthChart } from "@/components/system-health-chart"

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

const recentIncidents = [
  {
    id: "INC-2024-001",
    title: "TypeError: Cannot read property 'user' of undefined",
    severity: "critical" as const,
    service: "auth-service",
    status: "analyzing" as const,
    occurrences: 127,
    lastSeen: "2 minutes ago",
    aiConfidence: 0.92,
    affectedUsers: 1204,
  },
  {
    id: "INC-2024-002",
    title: "API timeout /api/orders - 504 Gateway Timeout",
    severity: "error" as const,
    service: "order-service",
    status: "investigating" as const,
    occurrences: 45,
    lastSeen: "5 minutes ago",
    aiConfidence: 0.87,
    affectedUsers: 432,
  },
  {
    id: "INC-2024-003",
    title: "Database connection pool exhaustion",
    severity: "warning" as const,
    service: "payment-service",
    status: "resolved" as const,
    occurrences: 12,
    lastSeen: "8 minutes ago",
    aiConfidence: 0.95,
    affectedUsers: 0,
  },
]

export default function DashboardPage() {
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
                    Real-time incident feed
                  </p>
                </div>
              </div>
              <a
                href="/incidents"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                View all incidents →
              </a>
            </div>
            <div className="space-y-3">
              {recentIncidents.map((incident) => (
                <IncidentCard key={incident.id} {...incident} />
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