import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, profile, loading } = useAuth();

  // Mostra o spinner de carregamento enquanto verifica o estado de autenticação
  // OU se o acesso de administrador é necessário e o perfil ainda não foi carregado.
  if (loading || (requireAdmin && !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redireciona para o login se não estiver autenticado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se o acesso de administrador é necessário, mas o usuário não é admin, redireciona para a página inicial
  if (requireAdmin && profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;