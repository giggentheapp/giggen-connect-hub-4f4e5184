-- Create hospitality_riders table
CREATE TABLE public.hospitality_riders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  filename TEXT NOT NULL DEFAULT '',
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  file_type TEXT NOT NULL DEFAULT 'document',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hospitality_riders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for hospitality_riders
CREATE POLICY "Users can create their own hospitality riders" 
ON public.hospitality_riders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own hospitality riders" 
ON public.hospitality_riders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own hospitality riders" 
ON public.hospitality_riders 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hospitality riders" 
ON public.hospitality_riders 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_hospitality_riders_updated_at
BEFORE UPDATE ON public.hospitality_riders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add columns to concepts table for referencing hospitality riders
ALTER TABLE public.concepts 
ADD COLUMN hospitality_rider_reference UUID;