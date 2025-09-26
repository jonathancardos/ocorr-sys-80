-- Função para criar usuário administrador
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Primeiro vamos tentar encontrar o usuário pelo email
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'cardoso@admin.com';
  
  -- Se não encontrou, vamos criar um ID fixo para usar
  IF admin_user_id IS NULL THEN
    admin_user_id := '12345678-1234-5678-9012-123456789012';
  END IF;

  -- Inserir/atualizar perfil
  INSERT INTO public.profiles (
    user_id,
    username,
    full_name,
    role,
    is_active
  )
  VALUES (
    admin_user_id,
    'cardoso',
    'Administrador Cardoso',
    'admin',
    true
  )
  ON CONFLICT (user_id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = now();

END $$;

-- Executar a função
SELECT create_admin_user();