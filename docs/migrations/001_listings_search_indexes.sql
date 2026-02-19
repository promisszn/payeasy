-- Migration: Create indexes for listings search functionality
-- This migration should be run after the listings table is created

-- Enable PostGIS extension for location-based searches
CREATE EXTENSION IF NOT EXISTS postgis;

-- Full-text search index on title and description
-- This enables fast full-text search using PostgreSQL's built-in text search
CREATE INDEX IF NOT EXISTS idx_listings_fts 
ON listings 
USING GIN(to_tsvector('english', title || ' ' || description));

-- Index on rent_xlm for price range queries
CREATE INDEX IF NOT EXISTS idx_listings_rent_xlm 
ON listings(rent_xlm) 
WHERE status = 'active';

-- Index on bedrooms and bathrooms for filtering
CREATE INDEX IF NOT EXISTS idx_listings_bedrooms 
ON listings(bedrooms) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_listings_bathrooms 
ON listings(bathrooms) 
WHERE status = 'active';

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_listings_filters 
ON listings(status, bedrooms, bathrooms, rent_xlm) 
WHERE status = 'active';

-- Index on address for location text search
CREATE INDEX IF NOT EXISTS idx_listings_address 
ON listings USING gin(address gin_trgm_ops);

-- Note: The gin_trgm_ops requires the pg_trgm extension
-- Run this first if not already enabled:
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- If using PostGIS geography column for location:
-- CREATE INDEX IF NOT EXISTS idx_listings_location 
-- ON listings USING GIST(location);

-- Index on listing_amenities for fast amenity filtering
CREATE INDEX IF NOT EXISTS idx_listing_amenities_listing_id 
ON listing_amenities(listing_id);

CREATE INDEX IF NOT EXISTS idx_listing_amenities_amenity 
ON listing_amenities(amenity);

-- Composite index for amenity queries
CREATE INDEX IF NOT EXISTS idx_listing_amenities_composite 
ON listing_amenities(listing_id, amenity);
