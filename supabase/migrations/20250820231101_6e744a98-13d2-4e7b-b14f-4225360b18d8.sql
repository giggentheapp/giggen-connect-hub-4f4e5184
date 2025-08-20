-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('maker', 'goer');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  contact_info JSONB, -- Email, phone etc - only visible to makers and profile owner
  role user_role NOT NULL DEFAULT 'goer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create concepts table for maker projects/ideas
CREATE TABLE public.concepts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  maker_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft', -- draft, active, completed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create portfolio items table for maker content
CREATE TABLE public.portfolio_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  maker_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT, -- URL to image/video
  media_type TEXT, -- 'image' or 'video'
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events table for upcoming events
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  maker_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  is_public BOOLEAN DEFAULT true,
  max_participants INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is a maker
CREATE OR REPLACE FUNCTION public.is_maker(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid AND role = 'maker'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
BEGIN
  RETURN (
    SELECT role FROM public.profiles 
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- RLS Policies for profiles table
CREATE POLICY "Users can view public profile info" 
ON public.profiles FOR SELECT 
USING (true); -- Everyone can see basic profile info

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for concepts table
CREATE POLICY "Everyone can view concepts" 
ON public.concepts FOR SELECT 
USING (true);

CREATE POLICY "Only makers can create concepts" 
ON public.concepts FOR INSERT 
WITH CHECK (
  auth.uid() = maker_id 
  AND public.is_maker(auth.uid())
);

CREATE POLICY "Only concept owners can update their concepts" 
ON public.concepts FOR UPDATE 
USING (
  auth.uid() = maker_id 
  AND public.is_maker(auth.uid())
);

CREATE POLICY "Only concept owners can delete their concepts" 
ON public.concepts FOR DELETE 
USING (
  auth.uid() = maker_id 
  AND public.is_maker(auth.uid())
);

-- RLS Policies for portfolio_items table
CREATE POLICY "Everyone can view public portfolio items" 
ON public.portfolio_items FOR SELECT 
USING (is_public = true);

CREATE POLICY "Makers can view their own portfolio items" 
ON public.portfolio_items FOR SELECT 
USING (auth.uid() = maker_id);

CREATE POLICY "Only makers can create portfolio items" 
ON public.portfolio_items FOR INSERT 
WITH CHECK (
  auth.uid() = maker_id 
  AND public.is_maker(auth.uid())
);

CREATE POLICY "Only portfolio owners can update their items" 
ON public.portfolio_items FOR UPDATE 
USING (
  auth.uid() = maker_id 
  AND public.is_maker(auth.uid())
);

CREATE POLICY "Only portfolio owners can delete their items" 
ON public.portfolio_items FOR DELETE 
USING (
  auth.uid() = maker_id 
  AND public.is_maker(auth.uid())
);

-- RLS Policies for events table
CREATE POLICY "Everyone can view public events" 
ON public.events FOR SELECT 
USING (is_public = true);

CREATE POLICY "Makers can view their own events" 
ON public.events FOR SELECT 
USING (auth.uid() = maker_id);

CREATE POLICY "Only makers can create events" 
ON public.events FOR INSERT 
WITH CHECK (
  auth.uid() = maker_id 
  AND public.is_maker(auth.uid())
);

CREATE POLICY "Only event owners can update their events" 
ON public.events FOR UPDATE 
USING (
  auth.uid() = maker_id 
  AND public.is_maker(auth.uid())
);

CREATE POLICY "Only event owners can delete their events" 
ON public.events FOR DELETE 
USING (
  auth.uid() = maker_id 
  AND public.is_maker(auth.uid())
);

-- Create trigger function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_concepts_updated_at
  BEFORE UPDATE ON public.concepts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portfolio_items_updated_at
  BEFORE UPDATE ON public.portfolio_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'goer')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();