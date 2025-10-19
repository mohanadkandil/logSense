"use client"

import { useState } from "react"
import { Activity, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"

const data = [
  { time: "00:00", errors: 4, warnings: 12, resolved: 8 },
  { time: "04:00", errors: 3, warnings: 8, resolved: 12 },
  { time: "08:00", errors: 8, warnings: 15, resolved: 6 },
  { time: "12:00", errors: 12, warnings: 20, resolved: 10 },
  { time: "16:00", errors: 6, warnings: 10, resolved: 15 },
  { time: "20:00", errors: 5, warnings: 8, resolved: 18 },
  { time: "24:00", errors: 2, warnings: 5, resolved: 20 },
]

export function SystemHealthChart() {
  const [timeRange, setTimeRange] = useState("24h")

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="icon-container-mint p-2 rounded-lg">
            <Activity className="h-5 w-5 text-mint-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">System Health</h2>
            <p className="text-xs text-gray-500 mono">Incident trends over time</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {["24h", "7d", "30d"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-lg transition-colors mono",
                timeRange === range
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorWarnings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="time" stroke="#9ca3af" fontSize={11} />
          <YAxis stroke="#9ca3af" fontSize={11} />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Area
            type="monotone"
            dataKey="errors"
            stroke="#ef4444"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorErrors)"
          />
          <Area
            type="monotone"
            dataKey="warnings"
            stroke="#f59e0b"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorWarnings)"
          />
          <Area
            type="monotone"
            dataKey="resolved"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorResolved)"
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500"></div>
          <span className="text-xs text-gray-600 mono">Errors</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-orange-500"></div>
          <span className="text-xs text-gray-600 mono">Warnings</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
          <span className="text-xs text-gray-600 mono">Resolved</span>
        </div>
      </div>
    </div>
  )
}