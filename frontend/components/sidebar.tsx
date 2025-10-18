"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  AlertCircle,
  Brain,
  BarChart3,
  Settings,
  Activity,
  Zap,
  Shield,
  Database,
  Terminal,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Incidents", href: "/incidents", icon: AlertCircle },
  { name: "AI Analysis", href: "/ai-analysis", icon: Brain },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
]

const statusItems = [
  { name: "Active Monitors", count: 42, icon: Activity, color: "text-red-600" },
  { name: "AI Agents", count: 3, icon: Zap, color: "text-blue-600" },
  { name: "Learned Issues", count: 127, icon: Shield, color: "text-purple-600" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="flex items-center justify-start px-4 py-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-md">
              <Database className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                LogSense
              </h1>
              <p className="text-xs text-blue-600 font-medium">
                AI Incident Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-blue-700" : "text-gray-400")} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* System Status */}
        <div className="px-4 py-4 border-t border-gray-200">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            System Status
          </h3>
          <div className="space-y-3">
            {statusItems.map((item) => (
              <div key={item.name} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  <item.icon className={cn("h-4 w-4", item.color)} />
                  <span className="text-sm text-gray-600">
                    {item.name}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-md mono">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* User Section */}
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Terminal className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                DevOps Team
              </p>
              <p className="text-xs text-gray-500 mono">
                admin@logsense.dev
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}