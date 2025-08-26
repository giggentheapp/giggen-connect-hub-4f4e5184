-- Enable RLS on events_market table
ALTER TABLE events_market ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for events_market
CREATE POLICY "Everyone can view public events in market" 
ON events_market 
FOR SELECT 
USING (is_public = true);

CREATE POLICY "Users can view their own events in market" 
ON events_market 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can create events in market" 
ON events_market 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own events in market" 
ON events_market 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own events in market" 
ON events_market 
FOR DELETE 
USING (auth.uid() = created_by);