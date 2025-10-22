"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  AlertCircle,
  Brain,
  Activity,
  Zap,
  Shield,
  Database,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/app", icon: LayoutDashboard },
  { name: "Incidents", href: "/app/incidents", icon: AlertCircle },
  { name: "AI Analysis", href: "/app/ai-analysis", icon: Brain },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const [stats, setStats] = useState({
    activeIncidents: 0,
    totalAnalyses: 0,
    resolvedToday: 0,
  });
  const [serverOnline, setServerOnline] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch real incident counts with timeout
        const incidentsResponse = await fetch(
          "http://localhost:8000/api/incidents?limit=100",
          { signal: AbortSignal.timeout(5000) }
        ).catch(() => ({ ok: false }));

        const incidents = incidentsResponse.ok
          ? await incidentsResponse.json()
          : [];

        // Fetch real analysis counts with timeout
        const analysesResponse = await fetch(
          "http://localhost:8000/api/analyses?limit=100",
          { signal: AbortSignal.timeout(5000) }
        ).catch(() => ({ ok: false }));

        const analyses = analysesResponse.ok
          ? await analysesResponse.json()
          : [];

        // Check if server is responding
        const serverResponding = incidentsResponse.ok || analysesResponse.ok;
        setServerOnline(serverResponding);

        // Filter real analyses (not test ones)
        const realAnalyses = analyses.filter((a) => a.issue_id !== "test-123");

        // Count resolved today (analyses with high confidence)
        const today = new Date().toDateString();
        const resolvedToday = realAnalyses.filter(
          (a) =>
            new Date(a.created_at).toDateString() === today &&
            a.confidence >= 0.8
        ).length;

        setStats({
          activeIncidents: incidents.length || 0,
          totalAnalyses: realAnalyses.length || 0,
          resolvedToday: resolvedToday || 0,
        });
      } catch (error) {
        console.error("Failed to fetch sidebar stats:", error);
        setServerOnline(false);
      }
    };

    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusItems = [
    {
      name: "Active Incidents",
      count: stats.activeIncidents,
      icon: Activity,
      color: "text-red-600",
    },
    {
      name: "AI Analyses",
      count: stats.totalAnalyses,
      icon: Brain,
      color: "text-blue-600",
    },
    {
      name: "Resolved Today",
      count: stats.resolvedToday,
      icon: Shield,
      color: "text-purple-600",
    },
  ];

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
              <h1 className="text-xl font-bold text-gray-900">LogSense</h1>
              <p className="text-xs text-purple-600 font-medium">
                AI Incident Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
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
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    isActive
                      ? "icon-container-purple text-purple-600"
                      : "bg-gray-100 text-gray-400"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </div>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* System Status */}
        <div className="px-4 py-4 border-t border-gray-200">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            System Status
          </h3>
          {/* Server Status Indicator */}
          <div className="px-3 py-2 rounded-lg mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-600">
                {serverOnline ? 'Backend Online' : 'Backend Offline'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {statusItems.map((item, index) => {
              const colors = ["mint", "blue", "purple"];
              const colorClass = colors[index];
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`icon-container-${colorClass} p-1.5 rounded-lg`}
                    >
                      <item.icon className="h-3 w-3" />
                    </div>
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                  <span className={`text-sm font-bold px-2 py-1 rounded-md mono ${
                    serverOnline ? 'text-gray-900 bg-gray-100' : 'text-gray-400 bg-gray-50'
                  }`}>
                    {serverOnline ? item.count : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Section */}
        <div className="px-4 py-4 border-t border-gray-200">
          {isLoaded && user ? (
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8"
                  }
                }}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {user.fullName || user.firstName || 'User'}
                </p>
                <p className="text-xs text-gray-500 mono">
                  {user.primaryEmailAddress?.emailAddress || 'No email'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-lg">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
