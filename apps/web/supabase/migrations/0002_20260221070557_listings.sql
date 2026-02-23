-- LISTINGS
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  landlord_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT NULL,
  description TEXT DEFAULT NULL,
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
