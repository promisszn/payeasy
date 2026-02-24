import "../lib/env";
import type { Metadata } from "next";
import { Inter } from "@fontsource-variable/inter";
import { ServiceWorkerProvider } from "@/components/providers/ServiceWorkerProvider";
import { ErrorProvider } from "@/components/providers/ErrorProvider";
import NextTopLoader from 'nextjs-toploader';
import WalletProvider from "@/providers/WalletProvider";
import AuthProvider from "@/providers/AuthProvider";
import FavoritesProvider from "@/components/FavoritesProvider";
import ComparisonProvider from "@/components/ComparisonProvider";
import ComparisonBar from "@/components/ComparisonBar";
import { AnalyticsTracker } from '@/components/AnalyticsTracker';
import { Toaster } from 'react-hot-toast';
import "./globals.css";
import "@fontsource-variable/inter";

export const metadata: Metadata = {
  title: "PayEasy | Shared Rent on Stellar",
  description: "Secure, blockchain-powered rent sharing.",
};

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-white font-sans">
        {/* Global error boundary - wraps everything */}
        <ErrorProvider>
          {/* Loading bar at the top */}
          <NextTopLoader color="#7D00FF" showSpinner={false} />
          
          {/* Analytics tracking */}
          <AnalyticsTracker />
          
          {/* Core providers */}
          <ServiceWorkerProvider>
            <WalletProvider>
              <AuthProvider>
                <FavoritesProvider>
                  <ComparisonProvider>
                    {children}
                    <ComparisonBar />
                  </ComparisonProvider>
                </FavoritesProvider>
              </AuthProvider>
            </WalletProvider>
          </ServiceWorkerProvider>
          
          {/* Toast notifications */}
          <Toaster 
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#fff',
                border: '1px solid #334155'
              },
            }}
          />
        </ErrorProvider>
      </body>
    </html>
  );
}