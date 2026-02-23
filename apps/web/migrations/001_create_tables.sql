-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For location features

-- USERS TABLE (Public Profile)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  username TEXT UNIQUE,
  avatar_url TEXT NULL, 
  first_name TEXT NULL,
  last_name TEXT NULL,
  bio TEXT NULL,
  public_key TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LISTINGS TABLE
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  landlord_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT NULL,
  description TEXT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  location TEXT DEFAULT NULL,
  category TEXT DEFAULT NULL,
  address TEXT NOT NULL,
  rent_xlm NUMERIC NOT NULL,
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  amenities TEXT[] DEFAULT '{}', -- Denormalized for easy fetch
  status TEXT CHECK (status IN ('active', 'inactive', 'deleted')) DEFAULT 'active',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- LISTING IMAGES
CREATE TABLE IF NOT EXISTS listing_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  is_cover BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AMENITIES (Master List)
CREATE TABLE IF NOT EXISTS amenities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  icon TEXT,
  category TEXT
);

-- LISTING AMENITIES (Join Table)
CREATE TABLE IF NOT EXISTS listing_amenities (
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  amenity TEXT NOT NULL, -- Storing name directly for simplicity or UUID if referencing amenities table
  PRIMARY KEY (listing_id, amenity)
);

-- MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENT RECORDS
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  amount_paid NUMERIC NOT NULL,
  transaction_hash TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'failed', 'refunded')) DEFAULT 'pending',
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RENT AGREEMENTS
CREATE TABLE IF NOT EXISTS rent_agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES users(id) ON DELETE CASCADE,
  contract_id TEXT, -- Stellar contract ID
  status TEXT CHECK (status IN ('pending', 'active', 'expired', 'terminated')) DEFAULT 'pending',
  start_date DATE,
  end_date DATE,
  deposit_xlm NUMERIC,
  terms JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a trigger to sync auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'username');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
