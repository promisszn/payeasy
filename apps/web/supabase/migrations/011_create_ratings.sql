-- ============================================================
-- Migration: 011_create_ratings.sql
-- Description: Create ratings and reviews table
-- ============================================================

CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rater_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ratee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    interaction_id UUID, -- Optional link to agreement or payment
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'published' CHECK (status IN ('published', 'flagged', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ratings_rater_id ON ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_ratings_ratee_id ON ratings(ratee_id);
CREATE INDEX IF NOT EXISTS idx_ratings_listing_id ON ratings(listing_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ratings_updated_at
    BEFORE UPDATE ON ratings
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Anyone can read published ratings
CREATE POLICY "ratings_select_published"
    ON ratings FOR SELECT
    USING (status = 'published');

-- Authenticated users can create ratings (must be the rater)
CREATE POLICY "ratings_insert_own"
    ON ratings FOR INSERT
    WITH CHECK (auth.uid() = rater_id);

-- Users can update their own ratings (e.g., within 24 hours)
CREATE POLICY "ratings_update_own"
    ON ratings FOR UPDATE
    USING (auth.uid() = rater_id AND created_at > NOW() - INTERVAL '24 hours')
    WITH CHECK (auth.uid() = rater_id);

-- Users can delete their own ratings
CREATE POLICY "ratings_delete_own"
    ON ratings FOR DELETE
    USING (auth.uid() = rater_id);

-- GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON ratings TO authenticated;
