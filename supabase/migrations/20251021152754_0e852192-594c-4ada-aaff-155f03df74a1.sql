-- Create tickets table if it doesn't exist
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events_market(id) ON DELETE CASCADE,
  stripe_payment_id TEXT,
  qr_code TEXT UNIQUE,
  ticket_code TEXT NOT NULL,
  status TEXT DEFAULT 'valid',
  purchased_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP DEFAULT NULL,
  checked_in_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  qr_code_data TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can insert own tickets" ON tickets;

-- Policy: Users can view their own tickets
CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own tickets
CREATE POLICY "Users can insert own tickets"
  ON tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);