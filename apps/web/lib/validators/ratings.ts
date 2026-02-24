export interface RatingValidationError {
    field: string;
    message: string;
}

export interface ValidatedSubmitRating {
    ratee_id: string;
    rating: number;
    review_text?: string;
    listing_id?: string;
    interaction_id?: string;
}

const MIN_REVIEW_LENGTH = 3;
const MAX_REVIEW_LENGTH = 1000;

/**
 * Validates the body of a POST /api/ratings request.
 */
export function validateSubmitRating(
    body: Record<string, unknown>,
    raterId: string
): { data?: ValidatedSubmitRating; errors?: RatingValidationError[] } {
    const errors: RatingValidationError[] = [];

    // --- ratee_id ---
    const rateeId = typeof body.ratee_id === 'string' ? body.ratee_id.trim() : undefined;
    if (!rateeId) {
        errors.push({ field: 'ratee_id', message: 'Ratee ID is required.' });
    } else if (rateeId === raterId) {
        errors.push({ field: 'ratee_id', message: 'You cannot rate yourself.' });
    }

    // --- rating ---
    const rating = typeof body.rating === 'number' ? body.rating : undefined;
    if (rating === undefined) {
        errors.push({ field: 'rating', message: 'Rating is required.' });
    } else if (rating < 1 || rating > 5) {
        errors.push({ field: 'rating', message: 'Rating must be between 1 and 5.' });
    }

    // --- review_text ---
    const reviewText = typeof body.review_text === 'string' ? body.review_text.trim() : undefined;
    if (reviewText) {
        if (reviewText.length < MIN_REVIEW_LENGTH) {
            errors.push({ field: 'review_text', message: `Review must be at least ${MIN_REVIEW_LENGTH} characters.` });
        } else if (reviewText.length > MAX_REVIEW_LENGTH) {
            errors.push({ field: 'review_text', message: `Review must be at most ${MAX_REVIEW_LENGTH} characters.` });
        }
    }

    // --- listing_id ---
    const listingId = typeof body.listing_id === 'string' ? body.listing_id.trim() : undefined;

    // --- interaction_id ---
    const interactionId = typeof body.interaction_id === 'string' ? body.interaction_id.trim() : undefined;

    if (errors.length > 0) {
        return { errors };
    }

    return {
        data: {
            ratee_id: rateeId!,
            rating: rating!,
            review_text: reviewText,
            listing_id: listingId,
            interaction_id: interactionId,
        },
    };
}
