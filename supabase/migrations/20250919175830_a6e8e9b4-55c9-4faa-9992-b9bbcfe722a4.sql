-- Criar usuário administrador padrão
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  role,
  aud,
  confirmation_token
) VALUES (
  gen_random_uuid(),
  'cardoso@admin.com',
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"username": "cardoso", "full_name": "Administrador Cardoso", "role": "admin"}',
  'authenticated',
  'authenticated',
  ''
) ON CONFLICT (email) DO NOTHING;