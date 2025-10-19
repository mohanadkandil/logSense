import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string
  change: string
  changeType: "increase" | "decrease"
  icon: LucideIcon
  color: "critical" | "success" | "info" | "warning"
  description?: string
}

const colorClasses = {
  critical: {
    container: "icon-container-pink",
    text: "text-pink-600"
  },
  success: {
    container: "icon-container-mint",
    text: "text-mint-600"
  },
  info: {
    container: "icon-container-blue",
    text: "text-blue-600"
  },
  warning: {
    container: "icon-container-yellow",
    text: "text-yellow-600"
  },
}

export function StatsCard({ title, value, change, changeType, icon: Icon, color, description }: StatsCardProps) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-600 mono">
              {title}
            </p>
            {description && (
              <div className="group relative">
                <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gray-800 text-white border border-gray-200">
                  {description}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-baseline gap-3">
            <p className="text-4xl font-bold text-gray-900 mono">
              {value}
            </p>
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg",
              changeType === "increase"
                ? "text-emerald-600 bg-emerald-50"
                : "text-red-600 bg-red-50"
            )}>
              {changeType === "increase" ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span className="mono">{change}</span>
            </div>
          </div>
        </div>

        <div className={cn("p-3 rounded-xl", colorClasses[color].container)}>
          <Icon className={cn("h-6 w-6", colorClasses[color].text)} />
        </div>
      </div>
    </div>
  )
}