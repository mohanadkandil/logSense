"use client"

import { useState } from "react"
import { Brain, Sparkles, Play, Pause, RotateCcw, CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { AIReasoningStep } from "@/components/ai-reasoning-step"
import { cn } from "@/lib/utils"

const reasoningSteps = [
  {
    id: "1",
    title: "Fetching Error Details",
    description: "Retrieving complete error information from Sentry",
    status: "completed" as const,
    timestamp: "14:32:01",
    details: {
      tool: "get_sentry_issue",
      input: { issue_id: "SENTRY-2B4K" },
      output: {
        error_type: "DatabaseConnectionError",
        occurrences: 127,
        stack_trace: "at PaymentService.processPayment()",
      }
    },
    duration: "230ms",
  },
  {
    id: "2",
    title: "Analyzing Stack Trace",
    description: "Examining error patterns and call stack",
    status: "completed" as const,
    timestamp: "14:32:02",
    details: {
      analysis: "Connection pool exhaustion detected",
      pattern: "Timeout after 30000ms",
      affected_methods: ["processPayment", "validateTransaction", "updateInventory"],
    },
    duration: "450ms",
  },
  {
    id: "3",
    title: "Searching Knowledge Base",
    description: "Looking for similar incidents in historical data",
    status: "completed" as const,
    timestamp: "14:32:03",
    details: {
      tool: "query_knowledge_base",
      similar_incidents: [
        { id: "INC-892", similarity: 0.94, resolution: "Increased connection pool size" },
        { id: "INC-721", similarity: 0.87, resolution: "Optimized slow queries" },
        { id: "INC-654", similarity: 0.82, resolution: "Added connection retry logic" },
      ]
    },
    duration: "180ms",
  },
  {
    id: "4",
    title: "Checking Service Dependencies",
    description: "Analyzing upstream and downstream service health",
    status: "in-progress" as const,
    timestamp: "14:32:04",
    details: {
      services_checked: ["inventory-service", "notification-service", "database"],
      findings: "Database showing high connection count (298/300)",
    },
    duration: "320ms",
  },
  {
    id: "5",
    title: "Generating Solution",
    description: "Creating remediation plan based on analysis",
    status: "pending" as const,
    timestamp: "",
    details: {},
    duration: "",
  },
]

export default function AIAnalysisPage() {
  const [isRunning, setIsRunning] = useState(true)
  const [selectedIncident, setSelectedIncident] = useState("INC-001")

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Agent Analysis</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time reasoning and decision making</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedIncident}
            onChange={(e) => setSelectedIncident(e.target.value)}
            className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="INC-001">INC-001 - Database timeout</option>
            <option value="INC-002">INC-002 - Auth latency</option>
            <option value="INC-003">INC-003 - Memory leak</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Reasoning Process - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          {/* Control Panel */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Agent Reasoning Process</h2>
                  <p className="text-xs text-gray-500">Step-by-step analysis</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    isRunning
                      ? "bg-red-50 text-red-600 hover:bg-red-100"
                      : "bg-green-50 text-green-600 hover:bg-green-100"
                  )}
                >
                  {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Reasoning Steps */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="space-y-4">
              {reasoningSteps.map((step, index) => (
                <AIReasoningStep
                  key={step.id}
                  step={step}
                  isLast={index === reasoningSteps.length - 1}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Analysis Results - Takes 1 column */}
        <div className="lg:col-span-1 space-y-4">
          {/* Confidence Score */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="h-5 w-5 text-violet-600" />
              <h3 className="font-semibold text-gray-900">Analysis Confidence</h3>
            </div>
            <div className="relative">
              <div className="flex items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg className="transform -rotate-90 w-32 h-32">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#e5e7eb"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="url(#gradient)"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={351.86}
                      strokeDashoffset={351.86 * (1 - 0.92)}
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">92%</span>
                  </div>
                </div>
              </div>
              <p className="text-center text-sm text-gray-600 mt-4">
                High confidence in root cause analysis
              </p>
            </div>
          </div>

          {/* Findings Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Key Findings</h3>
            <div className="space-y-3">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Root Cause Identified</p>
                    <p className="text-xs text-red-700 mt-1">
                      Database connection pool exhausted (298/300 connections)
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-medium text-amber-900">Contributing Factors</p>
                <ul className="mt-2 space-y-1">
                  <li className="text-xs text-amber-700">• Slow queries in payment service</li>
                  <li className="text-xs text-amber-700">• Missing connection timeout</li>
                  <li className="text-xs text-amber-700">• No retry mechanism</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl border border-violet-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Recommended Actions</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Immediate Fix</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Increase connection pool from 300 to 500
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Long-term Solution</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Optimize payment service queries with indexes
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Prevention</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Implement connection pooling monitoring alerts
                  </p>
                </div>
              </div>
            </div>
            <button className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-all duration-200 text-sm font-medium">
              Apply Recommended Fix
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}