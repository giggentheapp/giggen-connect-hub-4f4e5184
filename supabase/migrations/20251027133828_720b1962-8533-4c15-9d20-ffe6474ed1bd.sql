-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_band_permanently(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_band_permanently(uuid) TO anon;