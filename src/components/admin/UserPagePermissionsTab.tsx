import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner'; // Importar toast do sonner
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, CheckCircle, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types"; // Import TablesInsert, TablesUpdate
import { useAuth } from '@/contexts/AuthContext';

type Profile = Tables<'profiles'>;
type UserPagePermission = Tables<'user_page_permissions'>;

const defaultNavigationItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "new-incident", label: "Nova Ocorrência" },
  { id: "history", label: "Histórico" },
  { id: "reports", label: "Relatórios" },
  { id: "users", label: "Gerenciamento de Usuários" },
  { id: "drivers", label: "Gerenciamento de Motoristas" },
  { id: "vehicles", label: "Gerenciamento de Veículos" },
  { id: "settings", label: "Configurações" },
];

export const UserPagePermissionsTab = () => {
  const { profile: adminProfile } = useAuth();
  // Removido: const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all users with their page permissions
  const { data: usersWithPermissions, isLoading, error } = useQuery<
    (Profile & { page_permissions: UserPagePermission[] })[],
    Error
  >({
    queryKey: ['usersWithPermissions'],
    queryFn: async () => {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (profilesError) throw profilesError;

      const users = profilesData || [];

      // Fetch permissions for all users in parallel
      const usersWithPermissionsPromises = users.map(async (user) => {
        const { data: permissionsData, error: permissionsError } = await supabase
          .from('user_page_permissions')
          .select('*') // Changed to select all fields
          .eq('user_id', user.id);

        if (permissionsError) {
          console.error(`Error fetching permissions for user ${user.id}:`, permissionsError);
          return { ...user, page_permissions: [] };
        }

        // Ensure all default pages have an entry, creating if missing
        const existingPermissionsMap = new Map(permissionsData?.map(p => [p.page_id, p]) || []);
        const fullPermissions = defaultNavigationItems.map(page => {
          const existing = existingPermissionsMap.get(page.id);
          return existing || {
            id: '', // Will be generated on insert
            user_id: user.id,
            page_id: page.id,
            is_visible: true, // Default to visible if no explicit permission
            created_at: null,
            updated_at: null,
          };
        });

        return { ...user, page_permissions: fullPermissions };
      });

      return Promise.all(usersWithPermissionsPromises);
    },
    enabled: adminProfile?.role === 'admin', // Only fetch if admin
  });

  // Mutation to update or insert a user's page permission
  const upsertPermissionMutation = useMutation({
    mutationFn: async (permission: Partial<UserPagePermission> & { user_id: string; page_id: string; is_visible: boolean }) => {
      if (permission.id) {
        // Update existing permission
        const updateData: TablesUpdate<'user_page_permissions'> = {
          is_visible: permission.is_visible,
          updated_at: new Date().toISOString(),
        };
        const { data, error } = await supabase
          .from('user_page_permissions')
          .update(updateData)
          .eq('id', permission.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        // Insert new permission
        const insertData: TablesInsert<'user_page_permissions'> = {
          user_id: permission.user_id,
          page_id: permission.page_id,
          is_visible: permission.is_visible,
        };
        const { data, error } = await supabase
          .from('user_page_permissions')
          .insert(insertData)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersWithPermissions'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] }); // Invalidate current user's profile to refresh permissions
      toast.success("Permissão atualizada", {
        description: "A permissão de acesso à página foi salva.",
      });
    },
    onError: (err: any) => {
      console.error('Error updating permission:', err);
      toast.error("Erro ao atualizar permissão", {
        description: err.message || "Não foi possível salvar a permissão.",
      });
    },
  });

  const handlePermissionChange = async (
    userId: string,
    pageId: string,
    currentPermissionId: string | undefined,
    isVisible: boolean
  ) => {
    await upsertPermissionMutation.mutateAsync({
      id: currentPermissionId,
      user_id: userId,
      page_id: pageId,
      is_visible: isVisible,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-destructive">
          <p>Erro ao carregar permissões: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="modern-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Permissões de Página por Usuário
        </CardTitle>
        <CardDescription>
          Gerencie quais páginas cada usuário pode visualizar no sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card z-10">Usuário</TableHead>
                {defaultNavigationItems.map((page) => (
                  <TableHead key={page.id} className="text-center whitespace-nowrap">
                    {page.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersWithPermissions?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium sticky left-0 bg-card z-10">
                    <div>
                      <div className="font-semibold">{user.full_name}</div>
                      <div className="text-sm text-muted-foreground">@{user.username}</div>
                    </div>
                  </TableCell>
                  {defaultNavigationItems.map((page) => {
                    const permission = user.page_permissions.find(p => p.page_id === page.id);
                    const isVisible = permission ? permission.is_visible : true; // Default to true if no explicit permission
                    return (
                      <TableCell key={page.id} className="text-center">
                        <Switch
                          checked={isVisible}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(user.id, page.id, permission?.id, checked)
                          }
                          disabled={upsertPermissionMutation.isPending}
                        />
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};