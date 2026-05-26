"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, Wallet, FilePlus, History } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

export interface OnboardingStep {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
}

export const DEFAULT_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    icon: Wallet,
    title: "Fund your testnet wallet",
    description: "Use the Friendbot button to load test XLM and explore without risk.",
  },
  {
    icon: FilePlus,
    title: "Create your first escrow",
    description: "Split rent with roommates through a trustless Stellar contract.",
  },
  {
    icon: History,
    title: "Track agreements in history",
    description: "Review funding progress, contributions, and releases any time.",
  },
];

interface OnboardingCardProps {
  onDismiss: () => void;
  steps?: OnboardingStep[];
}

export function OnboardingCard({
  onDismiss,
  steps = DEFAULT_ONBOARDING_STEPS,
}: OnboardingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35 }}
      role="dialog"
      aria-labelledby="onboarding-card-title"
      data-testid="onboarding-card"
      className="w-full glass-card p-5 space-y-5 hover:!transform-none"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-brand-500/10 border border-brand-500/20">
          <Sparkles className="w-5 h-5 text-brand-400" />
        </div>
        <div>
          <h3
            id="onboarding-card-title"
            className="text-white font-semibold text-sm mb-1 font-display"
          >
            Welcome to PayEasy
          </h3>
          <p className="text-dark-500 text-sm leading-relaxed">
            You&apos;re connected. Here are three things to try next.
          </p>
        </div>
      </div>

      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 border border-brand-500/20 shrink-0">
              <step.icon className="w-4 h-4 text-brand-400" />
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-semibold font-display">
                <span className="text-dark-500 mr-2">{index + 1}.</span>
                {step.title}
              </p>
              <p className="text-dark-500 text-xs mt-0.5 leading-relaxed">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={onDismiss}
        className="btn-primary w-full !justify-center !rounded-xl !py-3 text-sm"
      >
        <Check size={16} />
        Got it
      </button>
    </motion.div>
  );
}
