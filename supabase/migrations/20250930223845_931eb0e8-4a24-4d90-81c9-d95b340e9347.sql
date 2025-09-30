-- Performance improvement: Add missing indexes for frequently queried columns
-- These indexes will significantly improve query performance for common operations

-- Index for concepts lookup by maker_id (frequently used in artist dashboards)
CREATE INDEX IF NOT EXISTS idx_concepts_maker_id ON public.concepts(maker_id);

-- Index for bookings status filtering (used in all booking lists)
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- Index for bookings event_date sorting (used for upcoming events)
CREATE INDEX IF NOT EXISTS idx_bookings_event_date ON public.bookings(event_date) 
WHERE event_date IS NOT NULL;

-- Index for booking_changes lookup by booking_id (foreign key)
CREATE INDEX IF NOT EXISTS idx_booking_changes_booking_id ON public.booking_changes(booking_id);

-- Index for events lookup by maker_id (foreign key)
CREATE INDEX IF NOT EXISTS idx_events_maker_id ON public.events(maker_id);

-- Index for hospitality_riders lookup by user_id (foreign key)
CREATE INDEX IF NOT EXISTS idx_hospitality_riders_user_id ON public.hospitality_riders(user_id);

-- Index for profile_tech_specs lookup by profile_id (foreign key)
CREATE INDEX IF NOT EXISTS idx_profile_tech_specs_profile_id ON public.profile_tech_specs(profile_id);

-- Composite index for bookings public events (frequently used query pattern)
CREATE INDEX IF NOT EXISTS idx_bookings_public_upcoming ON public.bookings(status, is_public_after_approval, event_date)
WHERE status = 'upcoming' AND is_public_after_approval = true;

-- Comment explaining the performance improvements
COMMENT ON INDEX idx_concepts_maker_id IS 'Improves performance for artist concept lookups';
COMMENT ON INDEX idx_bookings_status IS 'Improves performance for booking status filtering';
COMMENT ON INDEX idx_bookings_event_date IS 'Improves performance for upcoming events sorting';
COMMENT ON INDEX idx_booking_changes_booking_id IS 'Improves performance for booking change history';
COMMENT ON INDEX idx_bookings_public_upcoming IS 'Optimizes public upcoming events queries';