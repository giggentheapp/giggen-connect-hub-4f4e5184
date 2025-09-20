-- Migration: Clean up Mapbox-related configurations after migration to Leaflet
-- This removes the Mapbox-specific columns from profile_settings since we're now using Leaflet

-- Remove Mapbox access token and style URL columns from profile_settings
-- These are no longer needed with Leaflet which uses free OpenStreetMap tiles
ALTER TABLE public.profile_settings 
DROP COLUMN IF EXISTS mapbox_access_token,
DROP COLUMN IF EXISTS mapbox_style_url;

-- Update any audit logs to reflect the migration
INSERT INTO public.audit_logs (
  user_id,
  action,
  table_name,
  record_id,
  sensitive_fields
) 
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid as user_id,
  'MAPBOX_TO_LEAFLET_MIGRATION' as action,
  'profile_settings' as table_name,
  null as record_id,
  ARRAY['mapbox_access_token', 'mapbox_style_url'] as sensitive_fields;