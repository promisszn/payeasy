'use client'

import React from 'react'
import RatingStars from './RatingStars'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export interface RatingDistribution {
    [key: number]: number
}

interface RatingSummaryProps {
    average: number
    total: number
    distribution?: RatingDistribution
    isLoading?: boolean
}

export default function RatingSummary({
    average,
    total,
    distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    isLoading
}: RatingSummaryProps) {
    if (isLoading) {
        return (
            <div className="bg-white border border-gray-100 rounded-xl p-6 animate-pulse">
                <div className="flex items-center gap-6 mb-8">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg" />
                    <div className="space-y-2 flex-1">
                        <div className="w-24 h-4 bg-gray-200 rounded" />
                        <div className="w-32 h-3 bg-gray-100 rounded" />
                    </div>
                </div>
                <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="w-8 h-3 bg-gray-100 rounded" />
                            <div className="flex-1 h-2 bg-gray-50 rounded" />
                            <div className="w-6 h-3 bg-gray-100 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // Calculate percentages for distribution bars
    const getPercentage = (count: number) => {
        return total > 0 ? (count / total) * 100 : 0
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8 pb-8 border-b border-gray-100">
                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl min-w-[120px]">
                    <span className="text-4xl font-bold text-gray-900">{average.toFixed(1)}</span>
                    <RatingStars rating={Math.round(average)} size={16} className="mt-2" />
                    <span className="text-xs text-gray-500 mt-2 font-medium">{total} reviews</span>
                </div>

                <div className="flex-1 space-y-2.5">
                    {[5, 4, 3, 2, 1].map((stars) => {
                        const count = distribution[stars] || 0
                        const percentage = getPercentage(count)

                        return (
                            <div key={stars} className="flex items-center gap-3">
                                <span className="text-xs font-semibold text-gray-500 w-12">{stars} Stars</span>
                                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-yellow-400 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <span className="text-xs text-gray-400 min-w-[30px] text-right">{count}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div className="bg-blue-50/50 p-4 rounded-lg flex gap-3 items-start border border-blue-100/50">
                    <div className="bg-white p-1.5 rounded-md shadow-sm border border-blue-100">
                        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <div>
                        <h5 className="text-xs font-bold text-blue-900 mb-0.5 uppercase tracking-wider">Secure & Verified</h5>
                        <p className="text-[11px] text-blue-700 leading-normal">
                            Every review on PayEasy is verified for authenticity when linked to a transaction.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
