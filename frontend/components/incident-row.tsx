import { AlertCircle, AlertTriangle, XCircle, Brain, Clock, Users, Eye, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface IncidentRowProps {
  incident: {
    id: string
    title: string
    severity: "critical" | "error" | "warning"
    service: string
    environment: string
    status: "investigating" | "analyzed" | "resolved" | "monitoring"
    occurrences: number
    affectedUsers: number
    firstSeen: string
    lastSeen: string
    aiConfidence: number
    rootCause?: string
  }
}

const severityConfig = {
  critical: {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    label: "Critical",
  },
  error: {
    icon: AlertCircle,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    label: "Error",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    label: "Warning",
  },
}

const statusConfig = {
  investigating: {
    label: "Investigating",
    color: "text-blue-700 bg-blue-50",
  },
  analyzed: {
    label: "AI Analyzed",
    color: "text-purple-700 bg-purple-50",
  },
  resolved: {
    label: "Resolved",
    color: "text-green-700 bg-green-50",
  },
  monitoring: {
    label: "Monitoring",
    color: "text-gray-700 bg-gray-50",
  },
}

export function IncidentRow({ incident }: IncidentRowProps) {
  const SeverityIcon = severityConfig[incident.severity].icon

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* Incident Info */}
      <td className="px-6 py-4">
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg", severityConfig[incident.severity].bgColor)}>
            <SeverityIcon className={cn("h-4 w-4", severityConfig[incident.severity].color)} />
          </div>
          <div>
            <Link
              href={`/incidents/${incident.id}`}
              className="font-medium text-gray-900 hover:text-violet-600 transition-colors"
            >
              {incident.id}
            </Link>
            <p className="text-sm text-gray-500 mt-1 max-w-md truncate">{incident.title}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {incident.lastSeen}
              </span>
            </div>
          </div>
        </div>
      </td>

      {/* Service */}
      <td className="px-6 py-4">
        <div>
          <p className="text-sm font-medium text-gray-900">{incident.service}</p>
          <p className="text-xs text-gray-500 mt-1">{incident.environment}</p>
        </div>
      </td>

      {/* Impact */}
      <td className="px-6 py-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">{incident.occurrences}</span>
            <span className="text-xs text-gray-500">occurrences</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-600">{incident.affectedUsers} users</span>
          </div>
        </div>
      </td>

      {/* AI Analysis */}
      <td className="px-6 py-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-lg">
              <Brain className="h-3 w-3 text-violet-600" />
              <span className="text-xs font-medium text-violet-700">
                {Math.round(incident.aiConfidence * 100)}% confidence
              </span>
            </div>
          </div>
          {incident.rootCause && (
            <p className="text-xs text-gray-600 max-w-xs truncate">{incident.rootCause}</p>
          )}
        </div>
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <span className={cn(
          "inline-flex px-2 py-1 text-xs font-medium rounded-lg",
          statusConfig[incident.status].color
        )}>
          {statusConfig[incident.status].label}
        </span>
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Link
            href={`/incidents/${incident.id}`}
            className="p-1.5 text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <button className="p-1.5 text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all">
            <Play className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}