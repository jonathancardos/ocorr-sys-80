-- Criar tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  department TEXT,
  position TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL
);

-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Criar tabela de incidentes/ocorrências
CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('safety', 'environmental', 'quality', 'security', 'operational')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'moderate', 'grave', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  location TEXT,
  date_occurred TIMESTAMP WITH TIME ZONE NOT NULL,
  reported_by UUID REFERENCES auth.users(id) NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  root_cause TEXT,
  corrective_actions TEXT,
  preventive_actions TEXT,
  evidence_files TEXT[], -- Array para armazenar URLs dos arquivos
  witnesses TEXT[],
  cost_estimate DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS na tabela incidents
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para incidents
CREATE POLICY "Users can view all incidents" 
ON public.incidents 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create incidents" 
ON public.incidents 
FOR INSERT 
WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Users can update their own incidents" 
ON public.incidents 
FOR UPDATE 
USING (auth.uid() = reported_by);

CREATE POLICY "Admins can update all incidents" 
ON public.incidents 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Criar tabela de histórico de ações
CREATE TABLE public.action_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('created', 'updated', 'status_changed', 'assigned', 'commented', 'resolved')),
  description TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Habilitar RLS na tabela action_history
ALTER TABLE public.action_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para action_history
CREATE POLICY "Users can view action history" 
ON public.action_history 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create action history" 
ON public.action_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Criar tabela de comentários
CREATE TABLE public.incident_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Habilitar RLS na tabela incident_comments
ALTER TABLE public.incident_comments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para incident_comments
CREATE POLICY "Users can view comments" 
ON public.incident_comments 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create comments" 
ON public.incident_comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.incident_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Criar função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar triggers para atualizar timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_incident_comments_updated_at
  BEFORE UPDATE ON public.incident_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar histórico automaticamente
CREATE OR REPLACE FUNCTION public.create_incident_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.action_history (incident_id, user_id, action_type, description, new_values)
    VALUES (NEW.id, NEW.reported_by, 'created', 'Incidente criado', row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Verificar se o status mudou
    IF OLD.status != NEW.status THEN
      INSERT INTO public.action_history (incident_id, user_id, action_type, description, old_values, new_values)
      VALUES (NEW.id, auth.uid(), 'status_changed', 
              'Status alterado de ' || OLD.status || ' para ' || NEW.status,
              jsonb_build_object('status', OLD.status),
              jsonb_build_object('status', NEW.status));
    END IF;
    
    -- Verificar se foi atribuído a alguém
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
      INSERT INTO public.action_history (incident_id, user_id, action_type, description, old_values, new_values)
      VALUES (NEW.id, auth.uid(), 'assigned', 
              'Incidente atribuído',
              jsonb_build_object('assigned_to', OLD.assigned_to),
              jsonb_build_object('assigned_to', NEW.assigned_to));
    END IF;
    
    -- Verificar se foi resolvido
    IF OLD.resolved_at IS NULL AND NEW.resolved_at IS NOT NULL THEN
      INSERT INTO public.action_history (incident_id, user_id, action_type, description, new_values)
      VALUES (NEW.id, auth.uid(), 'resolved', 'Incidente resolvido', 
              jsonb_build_object('resolved_at', NEW.resolved_at));
    END IF;
    
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar trigger para histórico automático
CREATE TRIGGER incident_history_trigger
  AFTER INSERT OR UPDATE ON public.incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.create_incident_history();

-- Função para criar perfil automaticamente após criação de usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, full_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();