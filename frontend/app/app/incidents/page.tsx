"use client"

import { useState } from "react"
import { Search, Filter, Brain, AlertCircle, ChevronDown, ExternalLink } from "lucide-react"
import { IncidentRow } from "@/components/incident-row"
import { cn } from "@/lib/utils"

const incidents = [
  {
    id: "INC-001",
    title: "Database connection timeout in payment service",
    severity: "critical" as const,
    service: "payment-service",
    environment: "production",
    status: "investigating" as const,
    occurrences: 127,
    affectedUsers: 1240,
    firstSeen: "2024-01-20 14:32:00",
    lastSeen: "2 minutes ago",
    aiConfidence: 0.92,
    rootCause: "Connection pool exhaustion due to slow queries",
  },
  {
    id: "INC-002",
    title: "Increased latency in user authentication",
    severity: "warning" as const,
    service: "auth-service",
    environment: "production",
    status: "analyzed" as const,
    occurrences: 45,
    affectedUsers: 320,
    firstSeen: "2024-01-20 13:15:00",
    lastSeen: "15 minutes ago",
    aiConfidence: 0.87,
    rootCause: "Cache miss rate increased after deployment",
  },
  {
    id: "INC-003",
    title: "Memory leak detected in inventory service",
    severity: "error" as const,
    service: "inventory-service",
    environment: "staging",
    status: "resolved" as const,
    occurrences: 12,
    affectedUsers: 0,
    firstSeen: "2024-01-20 10:45:00",
    lastSeen: "1 hour ago",
    aiConfidence: 0.95,
    rootCause: "Unclosed database connections in batch processing",
  },
  {
    id: "INC-004",
    title: "API rate limiting triggered for external service",
    severity: "warning" as const,
    service: "integration-service",
    environment: "production",
    status: "monitoring" as const,
    occurrences: 89,
    affectedUsers: 450,
    firstSeen: "2024-01-20 09:20:00",
    lastSeen: "30 minutes ago",
    aiConfidence: 0.78,
    rootCause: "Spike in user activity exceeded API quota",
  },
  {
    id: "INC-005",
    title: "Null pointer exception in user profile service",
    severity: "error" as const,
    service: "profile-service",
    environment: "production",
    status: "analyzed" as const,
    occurrences: 234,
    affectedUsers: 890,
    firstSeen: "2024-01-19 22:15:00",
    lastSeen: "5 minutes ago",
    aiConfidence: 0.91,
    rootCause: "Missing null check for optional user preferences",
  },
]

const filters = {
  severity: ["All", "Critical", "Error", "Warning"],
  status: ["All", "Investigating", "Analyzed", "Resolved", "Monitoring"],
  environment: ["All", "Production", "Staging", "Development"],
  service: ["All Services", "payment-service", "auth-service", "inventory-service"],
}

export default function IncidentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSeverity, setSelectedSeverity] = useState("All")
  const [selectedStatus, setSelectedStatus] = useState("All")

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incidents</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor and investigate system incidents</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Export Report
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 text-sm">
            <Brain className="h-4 w-4" />
            Bulk AI Analysis
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search incidents by title, service, or error..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          {/* Severity Filter */}
          <div className="relative">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors">
              <Filter className="h-4 w-4" />
              Severity: {selectedSeverity}
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors">
              Status: {selectedStatus}
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-red-500 rounded-full"></div>
            <span className="text-xs text-gray-600">2 Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
            <span className="text-xs text-gray-600">3 Errors</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
            <span className="text-xs text-gray-600">5 Warnings</span>
          </div>
          <div className="ml-auto text-xs text-gray-500">
            Showing {incidents.length} of {incidents.length} incidents
          </div>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Incident
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Impact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AI Analysis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {incidents.map((incident) => (
                <IncidentRow key={incident.id} incident={incident} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}