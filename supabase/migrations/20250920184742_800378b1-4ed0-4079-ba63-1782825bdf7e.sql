-- Security enhancement: Add audit logging for sensitive data access
-- Create audit log table for tracking access to sensitive data
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    sensitive_fields TEXT[],
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only allow users to view their own audit logs, admins can view all
CREATE POLICY "Users can view their own audit logs"
ON public.audit_logs FOR SELECT
USING (auth.uid() = user_id);

-- Create function to log sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
    p_user_id UUID,
    p_action TEXT,
    p_table_name TEXT DEFAULT NULL,
    p_record_id UUID DEFAULT NULL,
    p_sensitive_fields TEXT[] DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        sensitive_fields
    ) VALUES (
        p_user_id,
        p_action,
        p_table_name,
        p_record_id,
        p_sensitive_fields
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to enhance contact info protection
CREATE OR REPLACE FUNCTION public.get_contact_info_with_audit(
    target_user_id UUID,
    requesting_user_id UUID DEFAULT auth.uid()
) RETURNS JSONB AS $$
DECLARE
    contact_data JSONB;
    has_access BOOLEAN := false;
BEGIN
    -- Check if user has access (own profile or active booking)
    IF requesting_user_id = target_user_id THEN
        has_access := true;
    ELSE
        has_access := public.has_active_booking_with_user(target_user_id, requesting_user_id);
    END IF;
    
    IF NOT has_access THEN
        -- Log unauthorized access attempt
        PERFORM public.log_sensitive_access(
            requesting_user_id,
            'UNAUTHORIZED_CONTACT_ACCESS_ATTEMPT',
            'profiles',
            target_user_id,
            ARRAY['contact_info']
        );
        RETURN NULL;
    END IF;
    
    -- Get contact info
    SELECT contact_info INTO contact_data
    FROM public.profiles
    WHERE user_id = target_user_id;
    
    -- Log legitimate access
    IF contact_data IS NOT NULL THEN
        PERFORM public.log_sensitive_access(
            requesting_user_id,
            'CONTACT_INFO_ACCESS',
            'profiles',
            target_user_id,
            ARRAY['contact_info']
        );
    END IF;
    
    RETURN contact_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to log profile updates with sensitive data
CREATE OR REPLACE FUNCTION public.log_profile_sensitive_updates()
RETURNS TRIGGER AS $$
BEGIN
    -- Log when contact_info is updated
    IF OLD.contact_info IS DISTINCT FROM NEW.contact_info THEN
        PERFORM public.log_sensitive_access(
            auth.uid(),
            'CONTACT_INFO_UPDATE',
            'profiles',
            NEW.user_id,
            ARRAY['contact_info']
        );
    END IF;
    
    -- Log when location data is updated
    IF (OLD.latitude IS DISTINCT FROM NEW.latitude) OR 
       (OLD.longitude IS DISTINCT FROM NEW.longitude) OR
       (OLD.address IS DISTINCT FROM NEW.address) THEN
        PERFORM public.log_sensitive_access(
            auth.uid(),
            'LOCATION_DATA_UPDATE',
            'profiles',
            NEW.user_id,
            ARRAY['latitude', 'longitude', 'address']
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for profile updates
DROP TRIGGER IF EXISTS audit_profile_sensitive_updates ON public.profiles;
CREATE TRIGGER audit_profile_sensitive_updates
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.log_profile_sensitive_updates();