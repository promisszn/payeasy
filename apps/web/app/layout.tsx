import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'PayEasy | Shared Rent on Stellar',
    description: 'Secure, blockchain-powered rent sharing.',
}

import { AnalyticsTracker } from '@/components/AnalyticsTracker'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={`${inter.className} bg-slate-950 text-white min-h-screen`}>
                <AnalyticsTracker />
                {children}
            </body>
        </html>
    )
}
