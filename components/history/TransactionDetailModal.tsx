"use client";

import { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  ExternalLink, 
  Calendar, 
  Hash, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  User,
  Activity,
  CreditCard,
  Layers
} from "lucide-react";
import { type Transaction } from "./TransactionCard";
import { getExplorerLink } from "@/lib/stellar/explorer";

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TransactionDetailModal({
  transaction,
  isOpen,
  onClose,
}: TransactionDetailModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const explorerLink = useMemo(() => {
    if (!transaction) return "#";
    return getExplorerLink("transaction", transaction.txHash);
  }, [transaction]);

  const formattedDate = useMemo(() => {
    if (!transaction) return "";
    return new Date(transaction.timestamp).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [transaction]);

  if (!transaction) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-dark-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${
                  transaction.status === "success" ? "bg-accent-500/10 text-accent-400" : "bg-red-500/10 text-red-400"
                } border border-white/5`}>
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-display tracking-tight">
                    Transaction Details
                  </h3>
                  <p className="text-[10px] text-dark-500 uppercase tracking-widest font-black">
                    Stellar Network Record
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/5 text-dark-400 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-6">
                  <DetailItem
                    icon={<Hash size={16} />}
                    label="Transaction Hash"
                    value={
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-dark-300 font-mono break-all bg-dark-900 rounded-lg p-2 border border-white/5">
                          {transaction.txHash}
                        </code>
                        <a
                          href={explorerLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-colors shrink-0"
                          title="View on Stellar Expert"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    }
                  />

                  <DetailItem
                    icon={<Calendar size={16} />}
                    label="Date & Time"
                    value={<span className="text-sm text-dark-200">{formattedDate}</span>}
                  />

                  <DetailItem
                    icon={<CreditCard size={16} />}
                    label="Amount & Fee"
                    value={
                      <div className="space-y-1">
                        <div className="text-xl font-black text-brand-400">
                          {transaction.amount}
                        </div>
                        <div className="text-[10px] text-dark-500 uppercase font-black tracking-wider">
                          Fee: {transaction.fee ? `${transaction.fee} Stroops` : "N/A"}
                        </div>
                      </div>
                    }
                  />
                </div>

                {/* Technical Details */}
                <div className="space-y-6">
                  <DetailItem
                    icon={<Layers size={16} />}
                    label="Operation Summary"
                    value={
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-dark-200">
                          <span className="capitalize">{transaction.type}</span>
                          <span className="text-dark-500">•</span>
                          <span>{transaction.operationCount} Operations</span>
                        </div>
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border ${
                          transaction.status === "success" 
                            ? "bg-accent-500/10 text-accent-300 border-accent-500/20" 
                            : "bg-red-500/10 text-red-300 border-red-500/20"
                        }`}>
                          {transaction.status === "success" ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                          {transaction.status}
                        </div>
                      </div>
                    }
                  />

                  <DetailItem
                    icon={<User size={16} />}
                    label="Source Account"
                    value={
                      <code className="text-[11px] text-dark-400 font-mono break-all bg-dark-900 rounded-lg p-2 border border-white/5 block">
                        {transaction.sourceAccount || "N/A"}
                      </code>
                    }
                  />

                  {transaction.operations && transaction.operations.length > 0 && (
                    <DetailItem
                      icon={<Activity size={16} />}
                      label="Key Participants"
                      value={
                        <div className="space-y-2">
                          {transaction.operations[0].from && (
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] text-dark-600 uppercase font-black">From</span>
                              <code className="text-[10px] text-dark-400 font-mono truncate bg-dark-900 rounded-md p-1.5 border border-white/5">
                                {transaction.operations[0].from}
                              </code>
                            </div>
                          )}
                          {transaction.operations[0].to && (
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] text-dark-600 uppercase font-black">To</span>
                              <code className="text-[10px] text-dark-400 font-mono truncate bg-dark-900 rounded-md p-1.5 border border-white/5">
                                {transaction.operations[0].to}
                              </code>
                            </div>
                          )}
                        </div>
                      }
                    />
                  )}
                </div>
              </div>

              {/* Operations List Placeholder / More Details */}
              {transaction.memo && (
                <div className="mt-8 pt-6 border-t border-white/5">
                  <h4 className="text-xs font-black text-dark-500 uppercase tracking-[0.2em] mb-3">
                    Transaction Memo
                  </h4>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-sm text-dark-300 italic">
                    &ldquo;{transaction.memo}&rdquo;
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[10px] text-dark-500 font-medium">
                <Clock size={12} />
                <span>Verified by Stellar Consensus Protocol</span>
              </div>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-dark-900 border border-white/10 text-white text-sm font-bold hover:bg-dark-800 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-dark-500">
        {icon}
        <span className="text-[10px] uppercase font-black tracking-widest">{label}</span>
      </div>
      <div className="pl-6">{value}</div>
    </div>
  );
}
