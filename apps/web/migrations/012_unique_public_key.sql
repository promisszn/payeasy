-- Migration 012: Enforce unique public_key on users table
-- This ensures one Stellar wallet can only be associated with one account.

ALTER TABLE users
  ADD CONSTRAINT unique_public_key UNIQUE (public_key);
