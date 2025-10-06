-- Garantir que existe um constraint único para user_id
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- Inserir perfil do administrador (o usuário auth será criado manualmente)
INSERT INTO public.profiles (
  user_id,
  username,
  full_name,
  role,
  is_active
)
SELECT 
  '12345678-1234-5678-9012-123456789012'::uuid,
  'cardoso',
  'Administrador Cardoso',
  'admin',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE username = 'cardoso'
);