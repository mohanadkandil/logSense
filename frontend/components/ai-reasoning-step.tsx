import { CheckCircle2, Loader2, Circle, ChevronRight, Terminal } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface AIReasoningStepProps {
  step: {
    id: string
    title: string
    description: string
    status: "completed" | "in-progress" | "pending"
    timestamp: string
    details: any
    duration: string
  }
  isLast: boolean
}

export function AIReasoningStep({ step, isLast }: AIReasoningStepProps) {
  const [isExpanded, setIsExpanded] = useState(step.status === "in-progress")

  return (
    <div className="relative">
      {/* Connection Line */}
      {!isLast && (
        <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gray-200"></div>
      )}

      <div className="flex gap-4">
        {/* Status Indicator */}
        <div className="relative z-10">
          {step.status === "completed" ? (
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          ) : step.status === "in-progress" ? (
            <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-violet-600 animate-spin" />
            </div>
          ) : (
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <Circle className="h-5 w-5 text-gray-400" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 pb-6">
          <div
            className={cn(
              "p-4 rounded-lg border transition-all duration-200 cursor-pointer",
              step.status === "in-progress"
                ? "bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-200"
                : step.status === "completed"
                ? "bg-white border-gray-200 hover:border-gray-300"
                : "bg-gray-50 border-gray-200 opacity-60"
            )}
            onClick={() => step.status !== "pending" && setIsExpanded(!isExpanded)}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900">{step.title}</h4>
                  {step.duration && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {step.duration}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                {step.timestamp && (
                  <p className="text-xs text-gray-400 mt-2">{step.timestamp}</p>
                )}
              </div>
              {step.status !== "pending" && (
                <ChevronRight
                  className={cn(
                    "h-4 w-4 text-gray-400 transition-transform",
                    isExpanded && "transform rotate-90"
                  )}
                />
              )}
            </div>

            {/* Expanded Details */}
            {isExpanded && step.status !== "pending" && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                {step.details.tool && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">Tool Called:</p>
                    <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-xs">
                      <div className="flex items-center gap-2 mb-2">
                        <Terminal className="h-3 w-3" />
                        <span className="text-green-400">{step.details.tool}</span>
                      </div>
                      {step.details.input && (
                        <pre className="text-gray-300">
                          {JSON.stringify(step.details.input, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                )}

                {step.details.output && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">Output:</p>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                        {JSON.stringify(step.details.output, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {step.details.similar_incidents && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">Similar Incidents Found:</p>
                    <div className="space-y-2">
                      {step.details.similar_incidents.map((incident: any) => (
                        <div
                          key={incident.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <span className="text-xs font-medium text-gray-900">{incident.id}</span>
                            <span className="text-xs text-gray-600 ml-2">{incident.resolution}</span>
                          </div>
                          <span className="text-xs text-violet-600 font-medium">
                            {Math.round(incident.similarity * 100)}% match
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {step.details.findings && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-900">{step.details.findings}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}