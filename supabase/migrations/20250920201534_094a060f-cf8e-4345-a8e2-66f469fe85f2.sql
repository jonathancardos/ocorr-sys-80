-- Criar usuário administrador padrão
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Inserir no auth.users se não existir
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_sent_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    is_super_admin
  ) 
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'cardoso@admin.com',
    crypt('123456', gen_salt('bf')),
    now(),
    now(),
    now(),
    now(),
    '{"username": "cardoso", "full_name": "Administrador Cardoso"}',
    false
  )
  ON CONFLICT (email) DO UPDATE SET
    encrypted_password = EXCLUDED.encrypted_password,
    updated_at = now()
  RETURNING id INTO admin_user_id;

  -- Se o usuário já existia, pegar seu ID
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'cardoso@admin.com';
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