'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Instrument_Serif } from 'next/font/google'

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400']
})
import {
  Brain,
  Zap,
  Shield,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Code2,
  GitBranch,
  Timer,
  BarChart3,
  Users,
  Layers,
  Cpu,
  Globe,
  Lock,
  Star,
  Play,
  Monitor,
  Activity,
  Lightbulb
} from 'lucide-react'

export default function LandingPage() {
  const [email, setEmail] = useState('')

  return (
    <div className="min-h-screen bg-white">
      {/* Beautiful gradient background inspired by Plumb */}
      <div className="fixed inset-0 bg-gradient-to-br from-orange-200/30 via-purple-200/20 to-green-200/30">
        <div className="absolute inset-0 bg-gradient-to-tr from-pink-100/20 via-transparent to-blue-100/20" />
      </div>

      {/* Hero Section - full screen stunning experience */}
      <section className="relative min-h-screen flex items-center justify-center px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Floating brand */}
            <div className="flex justify-center mb-12">
              <div className="flex items-center space-x-3 px-6 py-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-gray-200/50">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-sm">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className={`text-xl font-normal text-gray-900 ${instrumentSerif.className}`}>LogSense</span>
              </div>
            </div>

            {/* Main heading with beautiful typography */}
            <h1 className={`text-3xl lg:text-5xl font-normal text-gray-900 mb-6 leading-tight ${instrumentSerif.className}`}>
              Fix Production Issues
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-transparent bg-clip-text italic">
                Before Users Notice
              </span>
            </h1>

            <p className="text-base lg:text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              LogSense uses advanced AI to analyze your microservices logs, identify root causes,
              and suggest fixes in real-time. Reduce MTTR by 70% with intelligent incident management.
            </p>

            {/* Beautiful floating indicators */}
            <div className="relative mb-12">
              <div className="space-y-3">
                <div className="flex justify-center">
                  <div className="flex items-center px-4 py-2 bg-white/90 backdrop-blur-md rounded-full shadow-sm border border-gray-200/50">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700">AI-Powered Incident Analysis</span>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="flex items-center px-4 py-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-gray-200/40">
                    <Sparkles className="w-3 h-3 text-purple-500 mr-2" />
                    <span className="text-sm font-medium text-gray-600">Real-time Log Analysis</span>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="flex items-center px-4 py-2 bg-white/70 backdrop-blur-md rounded-full shadow-sm border border-gray-200/30">
                    <span className="text-sm text-gray-500">Intelligent Root Cause Detection</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA buttons - normal size */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
              <button className="px-8 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition flex items-center shadow-lg">
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
              <button className="px-8 py-3 bg-white/90 backdrop-blur-md border border-gray-300 rounded-lg font-medium hover:bg-white transition flex items-center shadow-sm">
                <Play className="w-4 h-4 mr-2" />
                Watch Demo
              </button>
            </div>

            {/* Trust indicators - normal size */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-1 text-green-500" />
                <span>SOC2 Compliant</span>
              </div>
              <div className="flex items-center">
                <Lock className="w-4 h-4 mr-1 text-blue-500" />
                <span>Enterprise Security</span>
              </div>
              <div className="flex items-center">
                <Star className="w-4 h-4 mr-1 text-yellow-500" />
                <span>99.9% Uptime SLA</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section - cleaner cards */}
      <section className="relative px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'MTTR Reduction', value: '70%', icon: Timer },
              { label: 'Issues Analyzed', value: '1M+', icon: BarChart3 },
              { label: 'Active Teams', value: '500+', icon: Users },
              { label: 'Accuracy Rate', value: '95%', icon: TrendingUp }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50"
              >
                <stat.icon className="w-6 h-6 text-gray-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - modern cards */}
      <section id="features" className="relative px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Intelligent Features
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage incidents like a pro
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Brain,
                title: 'AI Root Cause Analysis',
                description: 'Advanced ML models analyze patterns across your entire stack to identify root causes instantly.'
              },
              {
                icon: Zap,
                title: 'Real-Time Processing',
                description: 'WebSocket connections provide instant analysis as incidents occur, not minutes later.'
              },
              {
                icon: GitBranch,
                title: 'Multi-Service Correlation',
                description: 'Automatically correlate issues across microservices to understand cascade failures.'
              },
              {
                icon: Code2,
                title: 'Suggested Fixes',
                description: 'Get actionable code-level suggestions with confidence scores and implementation steps.'
              },
              {
                icon: Layers,
                title: 'Knowledge Base',
                description: 'RAG-powered system learns from your past incidents to improve future analysis.'
              },
              {
                icon: Cpu,
                title: 'MCP Integration',
                description: 'Native Model Context Protocol support for seamless tool orchestration.'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group relative"
              >
                <div className="h-full bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
                    <feature.icon className="w-6 h-6 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="relative px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Ready to Transform Your Incident Management?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Start your free trial today. No credit card required.
              </p>

              <div className="max-w-md mx-auto mb-8">
                <div className="flex space-x-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 transition"
                  />
                  <button className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition">
                    Get Started
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                  14-day free trial
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                  No credit card required
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                  Cancel anytime
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative px-6 py-12 bg-gray-50/50">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 rounded bg-gray-900 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">LogSense</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <Link href="#" className="hover:text-gray-900 transition">Privacy</Link>
              <Link href="#" className="hover:text-gray-900 transition">Terms</Link>
              <Link href="#" className="hover:text-gray-900 transition">Contact</Link>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-gray-500">
            © 2024 LogSense. Built with ❤️ for the AI Agent & Infrastructure Engineer Internship
          </div>
        </div>
      </footer>
    </div>
  )
}