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
            <div className="icon-container-purple p-3 rounded-xl">
              <Database className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                LogSense
              </h1>
              <p className="text-xs text-purple-600 font-medium">
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
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-purple-light text-purple-600 border border-gray-200"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg",
                  isActive
                    ? "icon-container-purple text-purple-600"
                    : "bg-gray-100 text-gray-400"
                )}>
                  <item.icon className="h-4 w-4" />
                </div>
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
          <div className="space-y-2">
            {statusItems.map((item, index) => {
              const colors = ['mint', 'blue', 'purple']
              const colorClass = colors[index]
              return (
                <div key={item.name} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className={`icon-container-${colorClass} p-1.5 rounded-lg`}>
                      <item.icon className="h-3 w-3" />
                    </div>
                    <span className="text-sm text-gray-600">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-md mono">
                    {item.count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* User Section */}
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="icon-container-blue p-2 rounded-lg">
              <Terminal className="h-4 w-4 text-blue-600" />
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