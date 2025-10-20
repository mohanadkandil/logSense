"use client"

import { Brain, Search, GitCompare, Lightbulb, CheckCircle2, Loader2, AlertTriangle, BarChart3, FileText } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { AnalysisStep } from "@/hooks/useWebSocket"

interface ActivityItem {
  id: string
  action: string
  description: string
  status: "in-progress" | "completed" | "waiting"
  timestamp: string
  icon: any
}

const getIconForStep = (step: string, tool?: string): any => {
  if (tool === "MCP") return FileText
  if (tool === "AI") return Brain
  if (tool === "RAG") return Search

  if (step.toLowerCase().includes("stack trace") || step.toLowerCase().includes("analyzing")) return Brain
  if (step.toLowerCase().includes("knowledge") || step.toLowerCase().includes("searching")) return Search
  if (step.toLowerCase().includes("pattern") || step.toLowerCase().includes("comparing")) return GitCompare
  if (step.toLowerCase().includes("solution") || step.toLowerCase().includes("fix")) return Lightbulb
  if (step.toLowerCase().includes("frequency") || step.toLowerCase().includes("trend")) return BarChart3
  if (step.toLowerCase().includes("impact") || step.toLowerCase().includes("user")) return AlertTriangle

  return Brain
}

const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diff < 10) return "Just now"
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
  } catch {
    return timestamp
  }
}

const convertStepsToActivities = (steps: AnalysisStep[]): ActivityItem[] => {
  return steps.map((step, index) => ({
    id: `step-${index}`,
    action: step.step,
    description: step.output || "Processing...",
    status: "completed" as const,
    timestamp: formatTimestamp(step.timestamp),
    icon: getIconForStep(step.step, step.tool)
  }))
}

interface AIActivityFeedProps {
  steps?: AnalysisStep[]
  isAnalyzing?: boolean
  error?: string | null
  result?: any
}

export function AIActivityFeed({ steps = [], isAnalyzing = false, error = null, result = null }: AIActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const router = useRouter()

  useEffect(() => {
    if (steps.length > 0) {
      const newActivities = convertStepsToActivities(steps)
      // Add "in-progress" indicator for the latest step if analyzing
      if (isAnalyzing && newActivities.length > 0) {
        newActivities[newActivities.length - 1].status = "in-progress"
      }
      setActivities(newActivities)
    } else if (!isAnalyzing) {
      // Show empty state when not analyzing and no steps
      setActivities([])
    }
  }, [steps, isAnalyzing])

  return (
    <div className="card h-full">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="icon-container-purple p-2 rounded-lg">
              <Brain className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Agent Activity</h2>
              <p className="text-xs text-gray-500 mono">Real-time reasoning process</p>
            </div>
          </div>
          {isAnalyzing && (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs font-medium mono">Analyzing...</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
        {error && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="p-2 rounded-lg bg-red-100">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-900">Analysis Failed</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        {!error && activities.length === 0 && !isAnalyzing && (
          <div className="text-center py-8 text-gray-500">
            <Brain className="h-8 w-8 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No active analysis</p>
            <p className="text-xs">Start an AI investigation to see real-time progress</p>
          </div>
        )}

        {activities.map((activity, index) => {
          const Icon = activity.icon
          return (
            <div
              key={activity.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg transition-all duration-300",
                activity.status === "in-progress"
                  ? "bg-blue-50 border border-blue-200"
                  : "bg-gray-50 border border-transparent"
              )}
              style={{
                animation: `fadeIn 0.5s ease-in-out ${index * 0.1}s both`,
              }}
            >
              <div className={cn(
                "p-2 rounded-lg",
                activity.status === "in-progress"
                  ? "bg-white shadow-sm"
                  : activity.status === "completed"
                  ? "bg-emerald-100"
                  : "bg-gray-100"
              )}>
                {activity.status === "in-progress" ? (
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                ) : activity.status === "completed" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Icon className="h-4 w-4 text-gray-600" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                <p className="text-xs text-gray-600 mt-1">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-2 mono">{activity.timestamp}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => {
            if (result?.analysis_id) {
              // Navigate to AI Analysis page with specific analysis
              router.push(`/ai-analysis?analysis=${result.analysis_id}`)
            } else {
              // Navigate to AI Analysis page
              router.push('/ai-analysis')
            }
          }}
          disabled={!result && activities.length === 0}
          className="btn-secondary w-full px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {result ? 'View Full Analysis →' : 'Go to AI Analysis'}
        </button>
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