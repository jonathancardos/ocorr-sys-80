ALTER TABLE public.ocorrencias
ADD COLUMN user_id UUID REFERENCES auth.users(id);