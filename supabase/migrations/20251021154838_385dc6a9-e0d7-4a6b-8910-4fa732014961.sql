-- Add foreign key constraint from tickets to events_market
ALTER TABLE public.tickets
ADD CONSTRAINT tickets_event_id_fkey
FOREIGN KEY (event_id)
REFERENCES public.events_market(id)
ON DELETE SET NULL;