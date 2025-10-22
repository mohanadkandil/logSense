"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Brain,
  Building2,
  Users,
  Zap,
  Shield,
  Database,
  CheckCircle,
  ArrowRight,
  Github,
  Slack,
  AlertTriangle,
  Code,
  Loader2,
} from "lucide-react";

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const steps = [
  {
    id: "welcome",
    title: "Welcome to LogSense!",
    description: "Let's get you set up with AI-powered incident management",
  },
  {
    id: "role",
    title: "What's your role?",
    description: "Help us personalize your experience",
  },
  {
    id: "team-size",
    title: "How big is your team?",
    description: "This helps us optimize your dashboard",
  },
  {
    id: "tools",
    title: "What tools do you use?",
    description: "We'll help you integrate with your existing stack",
  },
  {
    id: "connect-sentry",
    title: "Connect to Sentry",
    description: "Start monitoring your incidents with AI analysis",
  },
  {
    id: "complete",
    title: "You're all set!",
    description: "Welcome to the future of incident management",
  },
];

const roles = [
  { id: "developer", label: "Developer", icon: Code, description: "I write code and fix bugs" },
  { id: "devops", label: "DevOps Engineer", icon: Database, description: "I manage infrastructure and deployments" },
  { id: "sre", label: "SRE", icon: Shield, description: "I ensure system reliability and performance" },
  { id: "manager", label: "Engineering Manager", icon: Users, description: "I lead engineering teams" },
];

const teamSizes = [
  { id: "solo", label: "Just me", icon: "👤", description: "Solo developer or freelancer" },
  { id: "small", label: "2-10 people", icon: "👥", description: "Small team or startup" },
  { id: "medium", label: "11-50 people", icon: "👨‍👩‍👧‍👦", description: "Growing company" },
  { id: "large", label: "50+ people", icon: "🏢", description: "Large organization" },
];

const tools = [
  { id: "sentry", label: "Sentry", icon: AlertTriangle },
  { id: "github", label: "GitHub", icon: Github },
  { id: "slack", label: "Slack", icon: Slack },
  { id: "datadog", label: "Datadog", icon: Database },
];

export function OnboardingDialog({ open, onOpenChange, onComplete }: OnboardingDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedTeamSize, setSelectedTeamSize] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleToolToggle = (toolId: string) => {
    setSelectedTools(prev =>
      prev.includes(toolId)
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  };

  const handleConnectSentry = async () => {
    setIsConnecting(true);
    // Simulate connection process
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsConnecting(false);
    handleNext();
  };

  const renderStepContent = () => {
    switch (currentStepData.id) {
      case "welcome":
        return (
          <div className="text-center py-8">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-gray-900 rounded-2xl flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to LogSense!</h2>
              <p className="text-gray-600">AI-powered incident management that helps you fix issues before users notice.</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Zap className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Instant Analysis</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Shield className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Smart Insights</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <CheckCircle className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Auto Resolution</p>
              </div>
            </div>
          </div>
        );

      case "role":
        return (
          <div className="py-4">
            <div className="grid grid-cols-1 gap-3">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedRole === role.id
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      selectedRole === role.id ? "bg-gray-900" : "bg-gray-100"
                    }`}>
                      <role.icon className={`w-5 h-5 ${
                        selectedRole === role.id ? "text-white" : "text-gray-600"
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{role.label}</h3>
                      <p className="text-sm text-gray-500">{role.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case "team-size":
        return (
          <div className="py-4">
            <div className="grid grid-cols-2 gap-3">
              {teamSizes.map((size) => (
                <button
                  key={size.id}
                  onClick={() => setSelectedTeamSize(size.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    selectedTeamSize === size.id
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-2xl mb-2">{size.icon}</div>
                  <h3 className="font-medium text-gray-900 mb-1">{size.label}</h3>
                  <p className="text-xs text-gray-500">{size.description}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case "tools":
        return (
          <div className="py-4">
            <div className="grid grid-cols-2 gap-3">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleToolToggle(tool.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    selectedTools.includes(tool.id)
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <tool.icon className={`w-8 h-8 mx-auto mb-2 ${
                    selectedTools.includes(tool.id) ? "text-gray-900" : "text-gray-600"
                  }`} />
                  <h3 className="font-medium text-gray-900">{tool.label}</h3>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
              Select all that apply. We'll help you integrate later.
            </p>
          </div>
        );

      case "connect-sentry":
        return (
          <div className="text-center py-8">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-gray-700" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Connect to Sentry</h2>
              <p className="text-gray-600 mb-6">We'll start analyzing your incidents with AI as soon as you connect.</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-medium text-gray-900 mb-4">What you'll get:</h3>
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-gray-700" />
                  <span className="text-sm text-gray-700">Real-time incident detection</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-gray-700" />
                  <span className="text-sm text-gray-700">AI-powered root cause analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-gray-700" />
                  <span className="text-sm text-gray-700">Automated fix suggestions</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-gray-700" />
                  <span className="text-sm text-gray-700">Smart incident prioritization</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleConnectSentry}
              disabled={isConnecting}
              className="w-full px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting to Sentry...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Connect Sentry Account
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 mt-3">
              Don't have Sentry? <a href="#" className="text-gray-700 hover:underline">Skip for now</a>
            </p>
          </div>
        );

      case "complete":
        return (
          <div className="text-center py-8">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-gray-700" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h2>
              <p className="text-gray-600">Welcome to the future of incident management. Let's start monitoring your applications.</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">What's next?</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Explore your AI-powered dashboard</li>
                <li>• Set up monitoring for your services</li>
                <li>• Configure alert preferences</li>
                <li>• Invite your team members</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index <= currentStep ? "bg-gray-900" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
              {currentStep + 1} of {steps.length}
            </span>
          </div>
          <DialogTitle className="text-left">{currentStepData.title}</DialogTitle>
          <DialogDescription className="text-left">
            {currentStepData.description}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {currentStepData.id !== "connect-sentry" && currentStepData.id !== "complete" && (
          <div className="flex justify-end pt-4">
            <button
              onClick={handleNext}
              disabled={
                (currentStepData.id === "role" && !selectedRole) ||
                (currentStepData.id === "team-size" && !selectedTeamSize)
              }
              className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep === steps.length - 1 ? "Get Started" : "Continue"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {currentStepData.id === "complete" && (
          <div className="flex justify-center pt-4">
            <button
              onClick={onComplete}
              className="px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition flex items-center gap-2"
            >
              Enter LogSense
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}