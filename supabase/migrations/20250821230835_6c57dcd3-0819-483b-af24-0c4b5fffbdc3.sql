-- Add title and description columns to portfolio_files table
ALTER TABLE public.portfolio_files 
ADD COLUMN title TEXT,
ADD COLUMN description TEXT;