-- Create booking_status enum type first
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE public.booking_status AS ENUM (
      'draft',
      'pending', 
      'allowed',
      'approved', 
      'published',
      'rejected',
      'cancelled',
      'confirmed',
      'deleted'
    );
  END IF;
END $$;

-- Update bookings table status column to use enum (if it's currently text)
DO $$
BEGIN
  -- Check if status column exists and is text type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' 
    AND column_name = 'status' 
    AND data_type = 'text'
  ) THEN
    -- First update any existing values to match enum values
    UPDATE public.bookings SET status = 'pending' WHERE status = 'draft';
    
    -- Add the enum values to existing text column by creating new column and copying
    ALTER TABLE public.bookings ADD COLUMN status_new public.booking_status DEFAULT 'pending';
    UPDATE public.bookings SET status_new = status::public.booking_status;
    ALTER TABLE public.bookings DROP COLUMN status;
    ALTER TABLE public.bookings RENAME COLUMN status_new TO status;
  END IF;
END $$;

-- Add new columns for workflow tracking
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS allowed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS published_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS receiver_allowed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS requires_approval boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_modified_by uuid,
ADD COLUMN IF NOT EXISTS last_modified_at timestamp with time zone;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_parties ON public.bookings(sender_id, receiver_id);

-- Update booking_changes table to support approval workflow  
ALTER TABLE public.booking_changes
ADD COLUMN IF NOT EXISTS requires_approval boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS approved_by uuid,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rejected_by uuid,
ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rejection_reason text;