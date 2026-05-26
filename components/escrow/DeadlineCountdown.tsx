"use client";

import { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeadlineCountdownProps {
  deadlineEpoch: number; // Unix timestamp in seconds
  className?: string;
}

export function DeadlineCountdown({ deadlineEpoch, className }: DeadlineCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [status, setStatus] = useState<"normal" | "warning" | "expired">("normal");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000);
      const difference = deadlineEpoch - now;

      if (difference <= 0) {
        setTimeLeft("EXPIRED");
        setStatus("expired");
        return;
      }

      const days = Math.floor(difference / (24 * 3600));
      const hours = Math.floor((difference % (24 * 3600)) / 3600);
      const minutes = Math.floor((difference % 3600) / 60);

      if (days === 0 && hours < 24) {
        setStatus("warning");
      } else {
        setStatus("normal");
      }

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      parts.push(`${minutes}m`);

      setTimeLeft(parts.join(" "));
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [deadlineEpoch]);

  return (
    <div 
      className={cn(
        "inline-flex items-center gap-2.5 px-4 py-2 rounded-xl border transition-all duration-500",
        status === "expired" 
          ? "bg-red-500/10 border-red-500/20 text-red-400" 
          : status === "warning"
          ? "bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
          : "bg-white/5 border-white/10 text-dark-300",
        className
      )}
    >
      {status === "expired" ? (
        <AlertTriangle className="w-4 h-4" />
      ) : (
        <Clock className={cn("w-4 h-4", status === "warning" && "animate-pulse")} />
      )}
      <div className="flex flex-col">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50 leading-none mb-1">
          {status === "expired" ? "Agreement" : "Time Remaining"}
        </span>
        <span className="text-sm font-black tracking-tight font-mono leading-none">
          {timeLeft}
        </span>
      </div>
    </div>
  );
}
