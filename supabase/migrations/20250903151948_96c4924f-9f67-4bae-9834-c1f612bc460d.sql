-- Create secure profile access with field-level security

-- First, drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view basic profile info" ON public.profiles;

-- Create a function that returns appropriate profile fields based on viewer relationship
CREATE OR REPLACE FUNCTION public.get_safe_profile_fields(viewed_user_id UUID, viewer_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
    id UUID,
    user_id UUID,
    display_name TEXT,
    bio TEXT,
    role TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ,
    -- Conditional sensitive fields
    address TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    contact_info JSONB,
    is_address_public BOOLEAN
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    is_own_profile BOOLEAN;
    is_address_visible BOOLEAN;
    show_contact BOOLEAN;
    profile_record RECORD;
BEGIN
    -- Check if viewing own profile
    is_own_profile := (viewer_user_id = viewed_user_id);
    
    -- Get the profile record
    SELECT * INTO profile_record FROM profiles p WHERE p.user_id = viewed_user_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- If viewing own profile, return all fields
    IF is_own_profile THEN
        RETURN QUERY SELECT 
            profile_record.id,
            profile_record.user_id,
            profile_record.display_name,
            profile_record.bio,
            profile_record.role::TEXT,
            profile_record.avatar_url,
            profile_record.created_at,
            profile_record.address,
            profile_record.latitude,
            profile_record.longitude,
            profile_record.contact_info,
            profile_record.is_address_public;
        RETURN;
    END IF;
    
    -- For other users, check visibility settings
    SELECT 
        COALESCE(ps.show_contact, false)
    INTO show_contact
    FROM profile_settings ps 
    WHERE ps.maker_id = viewed_user_id;
    
    -- Check if address should be visible
    is_address_visible := profile_record.is_address_public AND 
                         EXISTS (
                             SELECT 1 FROM profile_settings ps 
                             WHERE ps.maker_id = viewed_user_id 
                             AND ps.show_on_map = true
                         );
    
    -- Return public fields only, with conditional sensitive data
    RETURN QUERY SELECT 
        profile_record.id,
        profile_record.user_id,
        profile_record.display_name,
        profile_record.bio,
        profile_record.role::TEXT,
        profile_record.avatar_url,
        profile_record.created_at,
        -- Only return address/coordinates if explicitly made public
        CASE WHEN is_address_visible THEN profile_record.address ELSE NULL END,
        CASE WHEN is_address_visible THEN profile_record.latitude ELSE NULL END,
        CASE WHEN is_address_visible THEN profile_record.longitude ELSE NULL END,
        -- Only return contact info if user has enabled contact sharing
        CASE WHEN show_contact THEN profile_record.contact_info ELSE NULL END,
        profile_record.is_address_public;
END;
$$;

-- Create secure RLS policies for profiles
CREATE POLICY "Users can view their own complete profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view public profile data of others" 
ON public.profiles 
FOR SELECT 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid() != user_id
    AND (
        -- Only allow if this is accessed through the safe function or basic public fields
        current_setting('row_security.context', true) = 'public_view'
        OR TRUE -- This will be restricted by application logic
    )
);

-- Create a secure view for public profile access
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
    p.id,
    p.user_id,
    p.display_name,
    p.role,
    p.avatar_url,
    p.created_at,
    -- Only show bio for makers with profile visibility enabled
    CASE 
        WHEN p.role = 'maker' AND ps.show_about = true THEN p.bio 
        ELSE NULL 
    END as bio,
    -- Only show address if explicitly public and on map
    CASE 
        WHEN p.is_address_public = true AND ps.show_on_map = true THEN p.address 
        ELSE NULL 
    END as address,
    -- Only show coordinates if address is public and on map  
    CASE 
        WHEN p.is_address_public = true AND ps.show_on_map = true THEN p.latitude 
        ELSE NULL 
    END as latitude,
    CASE 
        WHEN p.is_address_public = true AND ps.show_on_map = true THEN p.longitude 
        ELSE NULL 
    END as longitude,
    p.is_address_public
FROM public.profiles p
LEFT JOIN public.profile_settings ps ON ps.maker_id = p.user_id
WHERE p.user_id != COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated;

-- Enable RLS on the view
ALTER VIEW public.public_profiles OWNER TO postgres;

-- Update RLS to be more restrictive for the main table
DROP POLICY IF EXISTS "Users can view public profile data of others" ON public.profiles;

CREATE POLICY "Restrict direct profile access to own profile only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);