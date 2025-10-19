"use client"

import { Brain, Search, GitCompare, Lightbulb, CheckCircle2, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface ActivityItem {
  id: string
  action: string
  description: string
  status: "in-progress" | "completed" | "waiting"
  timestamp: string
  icon: any
}

const mockActivities: ActivityItem[] = [
  {
    id: "1",
    action: "Analyzing Stack Trace",
    description: "Payment service timeout error",
    status: "in-progress",
    timestamp: "Just now",
    icon: Brain,
  },
  {
    id: "2",
    action: "Searching Knowledge Base",
    description: "Found 3 similar incidents",
    status: "completed",
    timestamp: "1 min ago",
    icon: Search,
  },
  {
    id: "3",
    action: "Comparing Patterns",
    description: "Database connection pool issue detected",
    status: "completed",
    timestamp: "2 min ago",
    icon: GitCompare,
  },
  {
    id: "4",
    action: "Generated Solution",
    description: "Increase connection pool size",
    status: "completed",
    timestamp: "3 min ago",
    icon: Lightbulb,
  },
]

export function AIActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>(mockActivities)
  const [isThinking, setIsThinking] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsThinking(false)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

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
          {isThinking && (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs font-medium mono">Thinking...</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
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
        <button className="btn-secondary w-full px-4 py-2 text-sm font-medium">
          View Full Analysis →
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