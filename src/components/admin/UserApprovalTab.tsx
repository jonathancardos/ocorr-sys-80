import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserCheck, UserX, Shield, Users as UsersIcon, CheckCircle, MailCheck, MailWarning } from "lucide-react"; // Adicionado MailCheck, MailWarning
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { errorService } from '@/services/errorService';
import { Tables } from "@/integrations/supabase/types";
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Profile = Tables<'profiles'>;
// Extend Profile type to include auth_user_data for email confirmation status
type ProfileWithAuth = Profile & { auth_user_data?: { email_confirmed_at: string | null } };

export const UserApprovalTab = () => {
  const { profile: adminProfile, session } = useAuth();
  const queryClient = useQueryClient();

  if (adminProfile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Acesso Negado</h3>
          <p className="text-muted-foreground">Apenas administradores podem acessar esta área.</p>
        </div>
      </div>
    );
  }

  // Busca usuários inativos (aguardando aprovação)
  const { data: inactiveProfiles, isLoading: isLoadingInactiveProfiles, error: inactiveProfilesError } = useQuery<Profile[], Error>({
    queryKey: ['inactiveUsers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: adminProfile?.role === 'admin',
  });

  // Fetch auth.users to get email confirmation status for inactive users
  const { data: authUsers, isLoading: isLoadingAuthUsers, error: authUsersError } = useQuery<any[], Error>({
    queryKey: ['authUsersForApproval'],
    queryFn: async () => {
      if (!session?.access_token) {
        throw new Error("No active session found. Cannot fetch auth users for approval.");
      }
      const edgeFunctionUrl = `https://iywrcosymxjynxspzjmi.supabase.co/functions/v1/list-auth-users`; // Use your project ID

      const response = await fetch(edgeFunctionUrl, {
        method: 'GET', // Changed to GET
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const responseData = await response.json();

      if (!response.ok || responseData.error) {
        throw new Error(responseData.error || 'Failed to list auth users for approval via Edge Function');
      }
      return responseData.users;
    },
    enabled: adminProfile?.role === 'admin' && !!session, // Only fetch if admin and session exists
  });

  // Combine inactive profiles with auth user data
  const usersPendingApprovalWithAuthStatus = useMemo(() => {
    if (!inactiveProfiles || !authUsers) return [];
    const authUsersMap = new Map(authUsers.map(u => [u.id, u]));
    return inactiveProfiles.map(profile => ({
      ...profile,
      auth_user_data: authUsersMap.get(profile.id),
    }));
  }, [inactiveProfiles, authUsers]);

  // Mutação para aprovar um usuário (definir is_active como true e confirmar e-mail via Edge Function)
  const approveUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!session?.access_token) {
        throw new Error("No active session found. Please log in again.");
      }

      const edgeFunctionUrl = `https://iywrcosymxjynxspzjmi.supabase.co/functions/v1/approve-user-and-confirm-email`;

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to approve user via Edge Function');
      }
      return responseData;
    },
    onSuccess: (data, userId) => {
      queryClient.invalidateQueries({ queryKey: ['inactiveUsers'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['authUsersForApproval'] }); // Invalidate auth users too
      toast.success("Usuário aprovado!", {
        description: "O usuário agora tem acesso ao sistema e o e-mail foi confirmado.",
      });
    },
    onError: (err: any) => {
      errorService.log('Erro ao aprovar usuário:', err);
      toast.error("Erro ao aprovar usuário", {
        description: err.message || "Não foi possível aprovar o usuário.",
      });
    },
  });

  // Mutação para rejeitar/excluir um perfil de usuário
  const rejectUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Por simplicidade, apenas removemos o perfil. A remoção do usuário de auth.users
      // exigiria privilégios de administrador e seria melhor feita via Edge Function.
      // A remoção do perfil já impede o acesso ao sistema.
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inactiveUsers'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['authUsersForApproval'] }); // Invalidate auth users too
      toast.success("Usuário rejeitado!", {
        description: "O perfil do usuário foi removido.",
      });
    },
    onError: (err: any) => {
      errorService.log('Erro ao rejeitar usuário:', err);
      toast.error("Erro ao rejeitar usuário", {
        description: err.message || "Não foi possível rejeitar o usuário.",
      });
    },
  });

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  if (isLoadingInactiveProfiles || isLoadingAuthUsers) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (inactiveProfilesError || authUsersError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-destructive">
          <p>Erro ao carregar usuários pendentes: {inactiveProfilesError?.message || authUsersError?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="modern-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UsersIcon className="h-5 w-5 text-primary" />
          Aprovação de Novos Usuários
        </CardTitle>
        <CardDescription>
          Gerencie os usuários que se cadastraram e aguardam sua aprovação para acessar o sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome Completo</TableHead>
                <TableHead>Nome de Usuário</TableHead>
                <TableHead>Papel Sugerido</TableHead>
                <TableHead>Email</TableHead> {/* Nova coluna */}
                <TableHead>Data de Cadastro</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersPendingApprovalWithAuthStatus && usersPendingApprovalWithAuthStatus.length > 0 ? (
                usersPendingApprovalWithAuthStatus.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name || '-'}</TableCell>
                    <TableCell>@{user.username}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role === 'admin' ? 'Admin' : 'Usuário'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.auth_user_data?.email_confirmed_at ? (
                        <Badge variant="success" className="flex items-center gap-1">
                          <MailCheck className="h-3 w-3" /> Confirmado
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="flex items-center gap-1">
                          <MailWarning className="h-3 w-3" /> Não Confirmado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => approveUserMutation.mutate(user.id)}
                          disabled={approveUserMutation.isPending}
                        >
                          {approveUserMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <UserCheck className="mr-2 h-4 w-4" />
                          )}
                          Aprovar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => rejectUserMutation.mutate(user.id)}
                          disabled={rejectUserMutation.isPending}
                        >
                          {rejectUserMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <UserX className="mr-2 h-4 w-4" />
                          )}
                          Rejeitar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    <CheckCircle className="h-10 w-10 mx-auto mb-3 text-success" />
                    <p>Nenhum usuário aguardando aprovação.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};