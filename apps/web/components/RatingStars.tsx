'use client'

import React, { useState } from 'react'
import { Star } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface RatingStarsProps {
    rating: number
    max?: number
    size?: number
    interactive?: boolean
    onChange?: (rating: number) => void
    className?: string
}

export default function RatingStars({
    rating,
    max = 5,
    size = 20,
    interactive = false,
    onChange,
    className
}: RatingStarsProps) {
    const [hoverRating, setHoverRating] = useState<number | null>(null)

    const stars = Array.from({ length: max }, (_, i) => i + 1)

    const currentRating = hoverRating !== null ? hoverRating : rating

    return (
        <div className={cn('flex items-center gap-1', className)}>
            {stars.map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={!interactive}
                    onClick={() => interactive && onChange?.(star)}
                    onMouseEnter={() => interactive && setHoverRating(star)}
                    onMouseLeave={() => interactive && setHoverRating(null)}
                    className={cn(
                        'transition-all duration-200 outline-none',
                        interactive ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'
                    )}
                >
                    <Star
                        size={size}
                        className={cn(
                            'transition-colors duration-200',
                            star <= currentRating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'fill-gray-200 text-gray-200'
                        )}
                    />
                </button>
            ))}
        </div>
    )
}
