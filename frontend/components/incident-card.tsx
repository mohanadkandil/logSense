import { AlertCircle, AlertTriangle, XCircle, Brain, Clock, Users, Terminal } from "lucide-react"
import { cn } from "@/lib/utils"

interface IncidentCardProps {
  id: string
  title: string
  severity: "critical" | "error" | "warning"
  service: string
  status: "analyzing" | "investigating" | "resolved"
  occurrences: number
  lastSeen: string
  aiConfidence: number
  affectedUsers: number
}

const severityConfig = {
  critical: {
    icon: XCircle,
    color: "text-pink-600",
    container: "icon-container-pink",
    bgColor: "bg-gradient-to-r from-pink-50 to-red-50",
    borderColor: "border-pink-200",
    label: "CRITICAL",
  },
  error: {
    icon: AlertCircle,
    color: "text-pink-500",
    container: "icon-container-pink",
    bgColor: "bg-gradient-to-r from-pink-50 to-red-50",
    borderColor: "border-pink-200",
    label: "ERROR",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-yellow-600",
    container: "icon-container-yellow",
    bgColor: "bg-gradient-to-r from-yellow-50 to-orange-50",
    borderColor: "border-yellow-200",
    label: "WARNING",
  },
}

const statusConfig = {
  analyzing: {
    text: "AI Analyzing",
    color: "text-purple-700",
    bgColor: "bg-gradient-to-r from-purple-50 to-indigo-50",
    borderColor: "border-purple-200",
    container: "icon-container-purple",
  },
  investigating: {
    text: "Investigating",
    color: "text-blue-700",
    bgColor: "bg-gradient-to-r from-blue-50 to-cyan-50",
    borderColor: "border-blue-200",
    container: "icon-container-blue",
  },
  resolved: {
    text: "Resolved",
    color: "text-mint-700",
    bgColor: "bg-gradient-to-r from-mint-50 to-emerald-50",
    borderColor: "border-mint-200",
    container: "icon-container-mint",
  },
}

export function IncidentCard(props: IncidentCardProps) {
  const SeverityIcon = severityConfig[props.severity].icon

  return (
    <div className={cn(
      "p-4 rounded-lg border bg-white hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4",
      severityConfig[props.severity].borderColor
    )}>
      <div className="flex items-start justify-between">
        {/* Left Side - Incident Info */}
        <div className="flex items-start gap-3 flex-1">
          <div className={cn("p-2 rounded-lg", severityConfig[props.severity].container)}>
            <SeverityIcon className={cn("h-4 w-4", severityConfig[props.severity].color)} />
          </div>
          <div className="flex-1 min-w-0">
            {/* Incident ID and Title */}
            <div className="flex items-center gap-2 mb-2">
              <span className={cn(
                "text-xs font-bold mono px-2 py-1 rounded",
                severityConfig[props.severity].bgColor,
                severityConfig[props.severity].color
              )}>
                {props.id}
              </span>
              <span className={cn(
                "text-xs font-bold mono px-2 py-1 rounded",
                severityConfig[props.severity].bgColor,
                severityConfig[props.severity].color
              )}>
                {severityConfig[props.severity].label}
              </span>
            </div>
            <h3 className="font-medium text-sm mb-2 text-gray-900">
              {props.title}
            </h3>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span className="mono">{props.service}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {props.lastSeen}
              </span>
              <span className="flex items-center gap-1">
                <Terminal className="h-3 w-3" />
                {props.occurrences} times
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {props.affectedUsers} users
              </span>
            </div>
          </div>
        </div>

        {/* Right Side - Status and AI */}
        <div className="flex items-center gap-3">
          {/* AI Confidence Badge */}
          <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-50 border border-purple-200">
            <Brain className="h-3 w-3 text-purple-600" />
            <span className="text-xs font-bold mono text-purple-600">
              {Math.round(props.aiConfidence * 100)}%
            </span>
          </div>

          {/* Status Badge */}
          <span className={cn(
            "px-3 py-1 text-xs font-bold mono rounded-lg border",
            statusConfig[props.status].color,
            statusConfig[props.status].bgColor,
            statusConfig[props.status].borderColor
          )}>
            {statusConfig[props.status].text}
          </span>
        </div>
      </div>
    </div>
  )
}