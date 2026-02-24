import { createClient } from '@/lib/superbase/server'
import { NextResponse } from 'next/server'
import { validateSubmitRating } from '@/lib/validators/ratings'
import { Rating } from '@/lib/db/types'

export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { data: validatedData, errors } = validateSubmitRating(body, user.id)

        if (errors) {
            return NextResponse.json({ errors }, { status: 400 })
        }

        const { ratee_id, rating, review_text, listing_id, interaction_id } = validatedData!

        // Check for existing rating to prevent duplicates for same interaction
        if (interaction_id) {
            const { data: existing } = await supabase
                .from('ratings')
                .select('id')
                .eq('rater_id', user.id)
                .eq('interaction_id', interaction_id)
                .single()

            if (existing) {
                return NextResponse.json({ error: 'You have already rated this interaction.' }, { status: 400 })
            }
        }

        // Determine if verified (if interaction_id matches a payment or agreement)
        let is_verified = false
        if (interaction_id) {
            // Simple check: does it exist in payments or agreements?
            const [paymentRes, agreementRes] = await Promise.all([
                supabase.from('payment_records').select('id').eq('id', interaction_id).single(),
                supabase.from('rent_agreements').select('id').eq('id', interaction_id).single()
            ])

            if (paymentRes.data || agreementRes.data) {
                is_verified = true
            }
        }

        const { data, error } = await supabase
            .from('ratings')
            .insert({
                rater_id: user.id,
                ratee_id,
                listing_id,
                interaction_id,
                rating,
                review_text,
                is_verified,
                status: 'published'
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json(data, { status: 201 })
    } catch (err) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function GET(request: Request) {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const rateeId = searchParams.get('ratee_id')
    const listingId = searchParams.get('listing_id')
    const minRating = searchParams.get('min_rating')

    if (!rateeId && !listingId) {
        return NextResponse.json({ error: 'ratee_id or listing_id is required' }, { status: 400 })
    }

    let query = supabase
        .from('ratings')
        .select('*, rater:rater_id(full_name, avatar_url)', { count: 'exact' })
        .eq('status', 'published')

    if (rateeId) query = query.eq('ratee_id', rateeId)
    if (listingId) query = query.eq('listing_id', listingId)
    if (minRating) query = query.gte('rating', parseInt(minRating))

    // Sort by newest
    query = query.order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Calculate average and distribution
    const ratings = (data as unknown as Rating[]) || []
    const totalRating = ratings.reduce((acc: number, curr: Rating) => acc + curr.rating, 0)
    const averageRating = count ? (totalRating / count).toFixed(1) : 0

    const distribution = ratings.reduce((acc: Record<number, number>, curr: Rating) => {
        acc[curr.rating] = (acc[curr.rating] || 0) + 1
        return acc
    }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 })

    return NextResponse.json({
        ratings: data,
        meta: {
            total: count,
            average: parseFloat(averageRating as string),
            distribution
        }
    })
}
