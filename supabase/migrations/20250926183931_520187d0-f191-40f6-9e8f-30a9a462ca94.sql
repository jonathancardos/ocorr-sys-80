-- Ensure vehicles table exists with proper structure
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    plate TEXT NOT NULL UNIQUE,
    model TEXT NOT NULL,
    technology TEXT[] DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS if not already enabled
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "vehicles_select_policy" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_insert_policy" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_update_policy" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_delete_policy" ON public.vehicles;

-- Create policies for authenticated users
CREATE POLICY "vehicles_select_policy" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "vehicles_insert_policy" ON public.vehicles FOR INSERT WITH CHECK (true);
CREATE POLICY "vehicles_update_policy" ON public.vehicles FOR UPDATE USING (true);
CREATE POLICY "vehicles_delete_policy" ON public.vehicles FOR DELETE USING (true);

-- Create trigger for automatic timestamp updates if it doesn't exist
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON public.vehicles;
CREATE TRIGGER update_vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();