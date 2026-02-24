'use client'

import React, { useState } from 'react'
import RatingStars from './RatingStars'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

interface RatingFormProps {
    rateeId: string
    listingId?: string
    interactionId?: string
    onSuccess?: (rating: any) => void
}

export default function RatingForm({
    rateeId,
    listingId,
    interactionId,
    onSuccess
}: RatingFormProps) {
    const [rating, setRating] = useState(0)
    const [reviewText, setReviewText] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (rating === 0) {
            setError('Please select a star rating.')
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            const response = await fetch('/api/ratings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ratee_id: rateeId,
                    listing_id: listingId,
                    interaction_id: interactionId,
                    rating,
                    review_text: reviewText
                })
            })

            const data = await response.json()

            if (!response.ok) {
                if (data.errors) {
                    setError(data.errors[0].message)
                } else {
                    setError(data.error || 'Failed to submit rating.')
                }
                return
            }

            setSuccess(true)
            onSuccess?.(data)

            // Reset form after success
            setRating(0)
            setReviewText('')
        } catch (err) {
            setError('An unexpected error occurred.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (success) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <div className="flex justify-center mb-3">
                    <CheckCircle2 className="text-green-500" size={40} />
                </div>
                <h3 className="text-lg font-semibold text-green-900 mb-1">Thank you!</h3>
                <p className="text-green-700 text-sm">Your review has been submitted successfully.</p>
                <button
                    onClick={() => setSuccess(false)}
                    className="mt-4 text-sm font-medium text-green-600 hover:text-green-700 underline"
                >
                    Submit another review
                </button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave a Review</h3>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                </label>
                <RatingStars
                    rating={rating}
                    interactive
                    onChange={setRating}
                    size={32}
                />
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review (optional)
                </label>
                <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your experience..."
                    className="w-full min-h-[120px] px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-sm group-hover:border-gray-400"
                    maxLength={1000}
                />
                <div className="flex justify-end mt-1">
                    <span className="text-xs text-gray-400">{reviewText.length}/1000</span>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex gap-3 items-start text-red-700 text-sm">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <p>{error}</p>
                </div>
            )}

            <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="animate-spin" size={20} />
                        Submitting...
                    </>
                ) : (
                    'Submit Review'
                )}
            </button>
        </form>
    )
}
