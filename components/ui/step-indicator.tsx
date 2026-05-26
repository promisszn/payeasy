"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  steps: readonly string[];
  currentStep: number;
  className?: string;
}

/**
 * A multi-step progress bar with connecting lines and checkmarks.
 * Optimized for guided forms and sticky positioning.
 */
export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  return (
    <div className={cn("sticky top-0 z-20 w-full bg-dark-950/80 backdrop-blur-md py-6 mb-8 border-b border-white/5", className)}>
      <div className="max-w-3xl mx-auto px-6">
        <div className="relative flex justify-between">
          {/* Connecting Lines */}
          <div className="absolute top-5 left-0 w-full h-[2px] bg-white/5 -z-10" aria-hidden="true">
            <div 
              className="h-full bg-brand-500 transition-all duration-500 ease-in-out" 
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>

          {/* Steps */}
          {steps.map((label, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            return (
              <div key={label} className="flex flex-col items-center group">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    isCompleted
                      ? "bg-brand-500 border-brand-500 text-white shadow-[0_0_15px_rgba(92,124,250,0.4)]"
                      : isCurrent
                      ? "bg-dark-900 border-brand-500 text-brand-400 shadow-[0_0_10px_rgba(92,124,250,0.2)]"
                      : "bg-dark-900 border-white/10 text-dark-500"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 animate-in zoom-in duration-300" />
                  ) : (
                    <span className="text-sm font-bold">{stepNumber}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "mt-3 text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-300",
                    isCurrent ? "text-brand-400" : isCompleted ? "text-dark-200" : "text-dark-600"
                  )}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
