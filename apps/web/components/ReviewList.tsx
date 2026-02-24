'use client'

import React from 'react'
import RatingStars from './RatingStars'
import { BadgeCheck, User } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export interface Review {
    id: string
    rater_id: string
    rating: number
    review_text?: string
    is_verified: boolean
    created_at: string
    rater?: {
        full_name?: string
        avatar_url?: string
    }
}

interface ReviewListProps {
    reviews: Review[]
    isLoading?: boolean
}

export default function ReviewList({ reviews, isLoading }: ReviewListProps) {
    if (isLoading) {
        return (
            <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex flex-col gap-4 p-6 bg-white border border-gray-100 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full" />
                            <div className="space-y-2">
                                <div className="w-32 h-4 bg-gray-200 rounded" />
                                <div className="w-24 h-3 bg-gray-100 rounded" />
                            </div>
                        </div>
                        <div className="w-full h-20 bg-gray-50 rounded-lg" />
                    </div>
                ))}
            </div>
        )
    }

    if (reviews.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                <p className="text-gray-500 text-sm">No reviews yet. Be the first to leave one!</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {reviews.map((review) => (
                <div key={review.id} className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 overflow-hidden">
                                {review.rater?.avatar_url ? (
                                    <img src={review.rater.avatar_url} alt={review.rater.full_name || 'User'} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={20} />
                                )}
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 leading-tight">
                                    {review.rater?.full_name || 'Anonymous User'}
                                </h4>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {new Date(review.created_at).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                        {review.is_verified && (
                            <div className="flex items-center gap-1.5 text-primary bg-primary/5 px-2.5 py-1 rounded-full text-xs font-semibold">
                                <BadgeCheck size={14} />
                                <span>Verified</span>
                            </div>
                        )}
                    </div>

                    <RatingStars rating={review.rating} size={16} className="mb-3" />

                    {review.review_text && (
                        <p className="text-gray-600 text-sm leading-relaxed">
                            {review.review_text}
                        </p>
                    )}
                </div>
            ))}
        </div>
    )
}
