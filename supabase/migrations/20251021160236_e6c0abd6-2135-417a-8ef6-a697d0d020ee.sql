-- Add user_id to admin_whitelist for better performance
ALTER TABLE public.admin_whitelist 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add can_scan_tickets column
ALTER TABLE public.admin_whitelist 
ADD COLUMN IF NOT EXISTS can_scan_tickets BOOLEAN DEFAULT FALSE;

-- Create index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_admin_whitelist_user_id ON public.admin_whitelist(user_id);

-- Add scanned_at and scanned_by to tickets
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS scanned_at TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS scanned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create RLS policy for admins to update tickets
CREATE POLICY "Admins can update tickets for scanning"
  ON public.tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_whitelist 
      WHERE admin_whitelist.user_id = auth.uid() 
      AND admin_whitelist.can_scan_tickets = true
    )
  );