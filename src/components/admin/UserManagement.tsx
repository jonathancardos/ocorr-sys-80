import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserPlus, Edit2, Trash2, Loader2, Shield, User, UserX, MailCheck, MailWarning } from 'lucide-react'; // Adicionado MailCheck, MailWarning
import { Tables, TablesUpdate } from '@/integrations/supabase/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type Profile = Tables<'profiles'>;
// Extend Profile type to include auth_user_data for email confirmation status
type ProfileWithAuth = Profile & { auth_user_data?: { email_confirmed_at: string | null } };

const UserManagement = () => {
  const { profile: adminProfile, session } = useAuth();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editFormData, setEditFormData] = useState({
    username: '',
    full_name: '',
    role: 'user' as 'admin' | 'user',
    department: '',
    position: '',
    phone: '',
  });

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

  // Fetch profiles
  const { data: profiles, isLoading: isLoadingProfiles, error: profilesError } = useQuery<Profile[], Error>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: adminProfile?.role === 'admin',
  });

  // Fetch auth.users to get email confirmation status
  const { data: authUsers, isLoading: isLoadingAuthUsers, error: authUsersError } = useQuery<any[], Error>({
    queryKey: ['authUsers'],
    queryFn: async () => {
      if (!session?.access_token) {
        throw new Error("No active session found. Cannot fetch auth users.");
      }
      const edgeFunctionUrl = `https://iywrcosymxjynxspzjmi.supabase.co/functions/v1/list-auth-users`; // Use your project ID

      const response = await fetch(edgeFunctionUrl, {
        method: 'GET', // Changed to GET as it's fetching data
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const responseData = await response.json();

      if (!response.ok || responseData.error) {
        throw new Error(responseData.error || 'Failed to list auth users via Edge Function');
      }
      return responseData.users;
    },
    enabled: adminProfile?.role === 'admin' && !!session, // Only fetch if admin and session exists
  });

  // Combine profiles with auth user data
  const usersWithAuthStatus = useMemo(() => {
    if (!profiles || !authUsers) return [];
    const authUsersMap = new Map(authUsers.map(u => [u.id, u]));
    return profiles.map(profile => ({
      ...profile,
      auth_user_data: authUsersMap.get(profile.id),
    }));
  }, [profiles, authUsers]);

  const resetEditForm = () => {
    setEditFormData({
      username: '',
      full_name: '',
      role: 'user',
      department: '',
      position: '',
      phone: '',
    });
    setEditingUser(null);
  };

  const handleEditUser = (user: Profile) => {
    setEditingUser(user);
    setEditFormData({
      username: user.username,
      full_name: user.full_name,
      role: user.role as 'admin' | 'user',
      department: user.department || '',
      position: user.position || '',
      phone: user.phone || '',
    });
    setIsDialogOpen(true);
  };

  const handleUpdateUserMutation = useMutation({
    mutationFn: async (updateData: TablesUpdate<'profiles'>) => {
      if (!editingUser) throw new Error("No user selected for update.");
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', editingUser.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['profile', editingUser?.id] });
      toast.success("Usuário atualizado com sucesso!", {
        description: `${editFormData.full_name || editFormData.username} foi atualizado.`,
      });
      setIsDialogOpen(false);
      resetEditForm();
    },
    onError: (error: any) => {
      console.error('Error updating user:', error);
      toast.error("Erro ao atualizar usuário", {
        description: error.message || "Não foi possível atualizar o usuário",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleToggleUserStatusMutation = useMutation({
    mutationFn: async (user: Profile) => {
      const updateData: TablesUpdate<'profiles'> = {
        is_active: !user.is_active,
      };
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: (data, user) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      toast.success("Status atualizado", {
        description: `${user.full_name || user.username} foi ${!user.is_active ? 'ativado' : 'desativado'}.`,
      });
    },
    onError: (error: any) => {
      console.error('Error toggling user status:', error);
      toast.error("Erro ao alterar status", {
        description: error.message || "Não foi possível alterar o status do usuário",
      });
    },
  });

  const handleDeleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!session?.access_token) {
        throw new Error("No active session found. Please log in again.");
      }

      const edgeFunctionUrl = `https://iywrcosymxjynxspzjmi.supabase.co/functions/v1/delete-user-by-admin`;

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
        throw new Error(responseData.error || 'Failed to delete user via Edge Function');
      }
      return responseData;
    },
    onSuccess: (data, userId) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['inactiveUsers'] });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      toast.success("Usuário excluído!", {
        description: "O usuário e seu perfil foram removidos do sistema.",
      });
    },
    onError: (err: any) => {
      console.error('Erro ao excluir usuário:', err);
      toast.error("Erro ao excluir usuário", {
        description: err.message || "Não foi possível excluir o usuário.",
      });
    },
  });

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await handleUpdateUserMutation.mutateAsync({
      username: editFormData.username,
      full_name: editFormData.full_name || null,
      role: editFormData.role,
      department: editFormData.department || null,
      position: editFormData.position || null,
      phone: editFormData.phone || null,
    });
  };

  const handleDeleteUser = async (userToDelete: Profile) => {
    if (userToDelete.id === adminProfile?.id) {
      toast.error("Erro de Exclusão", {
        description: "Você não pode excluir sua própria conta de administrador.",
      });
      return;
    }
    if (window.confirm(`Tem certeza que deseja excluir o usuário ${userToDelete.full_name || userToDelete.username}? Esta ação é irreversível.`)) {
      await handleDeleteUserMutation.mutate(userToDelete.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoadingProfiles || isLoadingAuthUsers) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (profilesError || authUsersError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-destructive">
          <p>Erro ao carregar usuários: {profilesError?.message || authUsersError?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gerenciamento de Usuários</h2>
          <p className="text-muted-foreground">
            Gerencie usuários e suas permissões no sistema. Novos usuários se cadastram pela tela de login e aguardam aprovação.
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px] bg-card/20 backdrop-blur-md border border-border/50"> {/* Adjusted transparency */}
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Editar Usuário' : 'Informação do Usuário'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {editingUser 
                  ? 'Atualize as informações do usuário'
                  : 'Detalhes do usuário (criação via tela de login)'
                }
              </DialogDescription>
            </DialogHeader>
            
            {editingUser ? (
              <form onSubmit={handleSubmitUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Nome de usuário *</Label>
                  <Input
                    id="username"
                    value={editFormData.username}
                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome completo</Label>
                  <Input
                    id="full_name"
                    value={editFormData.full_name}
                    onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Papel *</Label>
                  <Select
                    value={editFormData.role}
                    onValueChange={(value: 'admin' | 'user') => setEditFormData({ ...editFormData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Departamento</Label>
                    <Input
                      id="department"
                      value={editFormData.department}
                      onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="position">Cargo</Label>
                    <Input
                      id="position"
                      value={editFormData.position}
                      onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Atualizando...
                      </>
                    ) : (
                      'Atualizar'
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <p className="text-muted-foreground text-center p-4">
                A criação de novos usuários é feita pela tela de login. Use a ação de "Ativar" para aprovar usuários pendentes.
              </p>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card className="modern-card">
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
          <CardDescription>
            {usersWithAuthStatus?.length || 0} usuário{usersWithAuthStatus?.length !== 1 ? 's' : ''} cadastrado{usersWithAuthStatus?.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Email</TableHead> {/* Nova coluna */}
                  <TableHead>Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersWithAuthStatus?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-sm text-muted-foreground">@{user.username}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role === 'admin' ? (
                          <>
                            <Shield className="mr-1 h-3 w-3" />
                            Admin
                          </>
                        ) : (
                          <>
                            <User className="mr-1 h-4 w-4" />
                            Usuário
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.department || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'success' : 'destructive'}>
                        {user.is_active ? 'Ativo' : 'Inativo'}
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
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleUserStatusMutation.mutate(user)}
                          className={user.is_active ? 'text-destructive hover:text-destructive' : 'text-success hover:text-success'}
                        >
                          {user.is_active ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserPlus className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          className="text-destructive hover:text-destructive"
                          disabled={handleDeleteUserMutation.isPending || user.id === adminProfile?.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;