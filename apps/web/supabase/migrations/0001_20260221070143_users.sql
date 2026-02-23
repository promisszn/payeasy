-- USERS
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  username TEXT UNIQUE,
  avatar_url TEXT,
  public_key TEXT NULL,
  first_name TEXT NULL,
  last_name TEXT NULL,
  bio TEXT,
  public_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
comment on table public.users is 'Profile data for each user.';
comment on column public.users.id is 'References the internal Supabase Auth user.';
