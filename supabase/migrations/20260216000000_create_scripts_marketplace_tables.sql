-- ============================================================
-- Scripts Marketplace Database Schema
-- Tables: scripts, script_reviews, script_purchases, creator_profiles
-- ============================================================

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. Creator Profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.creator_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  stripe_account_id TEXT,
  total_earnings_cents INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view creator profiles"
  ON public.creator_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.creator_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own profile"
  ON public.creator_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 2. Scripts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  full_description TEXT,
  category TEXT NOT NULL DEFAULT 'task-management',
  pricing TEXT DEFAULT 'free' CHECK (pricing IN ('free', 'paid', 'premium')),
  price_cents INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'usd',
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
  complexity TEXT DEFAULT 'beginner' CHECK (complexity IN ('beginner', 'intermediate', 'advanced')),
  tags TEXT[] DEFAULT '{}',
  required_integrations TEXT[] DEFAULT '{}',
  time_saved_estimate TEXT,
  -- Content stored as JSONB for flexibility
  tasks JSONB DEFAULT '[]'::jsonb,
  goals JSONB DEFAULT '[]'::jsonb,
  events JSONB DEFAULT '[]'::jsonb,
  phone_actions JSONB DEFAULT '[]'::jsonb,
  adaptable_params JSONB DEFAULT '[]'::jsonb,
  resources JSONB DEFAULT '[]'::jsonb,
  -- Stats
  uses_count INTEGER DEFAULT 0,
  rating_avg NUMERIC(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  -- Marketplace flags
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

CREATE INDEX idx_scripts_creator ON public.scripts(creator_id);
CREATE INDEX idx_scripts_category ON public.scripts(category);
CREATE INDEX idx_scripts_pricing ON public.scripts(pricing);
CREATE INDEX idx_scripts_visibility ON public.scripts(visibility);
CREATE INDEX idx_scripts_rating ON public.scripts(rating_avg DESC);
CREATE INDEX idx_scripts_uses ON public.scripts(uses_count DESC);
CREATE INDEX idx_scripts_tags ON public.scripts USING GIN(tags);
CREATE INDEX idx_scripts_published ON public.scripts(published_at DESC) WHERE published_at IS NOT NULL;

ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

-- Combined SELECT policy: public published scripts OR your own scripts
CREATE POLICY "Users can view scripts"
  ON public.scripts FOR SELECT
  USING (
    (visibility = 'public' AND published_at IS NOT NULL)
    OR (auth.uid() = creator_id)
  );

CREATE POLICY "Authenticated users can create scripts"
  ON public.scripts FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own scripts"
  ON public.scripts FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own scripts"
  ON public.scripts FOR DELETE
  USING (auth.uid() = creator_id);

-- ============================================================
-- 3. Script Reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS public.script_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(script_id, user_id)
);

CREATE INDEX idx_script_reviews_script ON public.script_reviews(script_id);
CREATE INDEX idx_script_reviews_user ON public.script_reviews(user_id);
CREATE INDEX idx_script_reviews_rating ON public.script_reviews(rating);

ALTER TABLE public.script_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON public.script_reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON public.script_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON public.script_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON public.script_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 4. Script Purchases
-- ============================================================
CREATE TABLE IF NOT EXISTS public.script_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES public.scripts(id) ON DELETE RESTRICT,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  price_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL,
  creator_payout_cents INTEGER NOT NULL,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_script_purchases_script ON public.script_purchases(script_id);
CREATE INDEX idx_script_purchases_buyer ON public.script_purchases(buyer_id);
CREATE INDEX idx_script_purchases_creator ON public.script_purchases(creator_id);
CREATE INDEX idx_script_purchases_status ON public.script_purchases(status);

ALTER TABLE public.script_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own purchases"
  ON public.script_purchases FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Creators can view sales of own scripts"
  ON public.script_purchases FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Service role creates purchases"
  ON public.script_purchases FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 5. Auto-update rating averages on review change
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_script_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.scripts
  SET
    rating_avg = (SELECT COALESCE(AVG(rating)::NUMERIC(2,1), 0) FROM public.script_reviews WHERE script_id = COALESCE(NEW.script_id, OLD.script_id)),
    review_count = (SELECT COUNT(*) FROM public.script_reviews WHERE script_id = COALESCE(NEW.script_id, OLD.script_id)),
    updated_at = now()
  WHERE id = COALESCE(NEW.script_id, OLD.script_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_script_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.script_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_script_rating();

-- ============================================================
-- 6. Increment uses count
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_script_uses(script_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.scripts
  SET uses_count = uses_count + 1, updated_at = now()
  WHERE id = script_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. Auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_scripts_updated_at
  BEFORE UPDATE ON public.scripts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_creator_profiles_updated_at
  BEFORE UPDATE ON public.creator_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_script_reviews_updated_at
  BEFORE UPDATE ON public.script_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
