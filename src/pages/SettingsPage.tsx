import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Users, ShieldCheck, Truck, Car, Loader2, FileKey, UserCheck } from "lucide-react";
import { RolePermissions } from "@/components/admin/RolePermissions";
import { UserPagePermissionsTab } from "@/components/admin/UserPagePermissionsTab";
import { UserApprovalTab } from "@/components/admin/UserApprovalTab";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils"; // Import cn for conditional classNames

export const SettingsPage = () => {
  const { profile, loading: authLoading } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || "role-permissions";

  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    console.log("SettingsPage: Current profile:", profile);
    console.log("SettingsPage: Profile role:", profile?.role);
    console.log("SettingsPage: Auth loading:", authLoading);
  }, [profile, authLoading]);


  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Carregando configurações...</h3>
          <p className="text-muted-foreground">Verificando permissões de acesso.</p>
        </div>
      </div>
    );
  }

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <ShieldCheck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Acesso Negado</h3>
          <p className="text-muted-foreground">Apenas administradores podem acessar esta área de configurações.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Configurações do Sistema</h2>
          <p className="text-muted-foreground">
            Gerencie permissões de perfil e página
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b mb-8">
          <TabsList className="flex w-full h-auto p-0 bg-card/20 backdrop-blur-sm overflow-x-auto custom-scrollbar flex-nowrap"> {/* Adjusted transparency */}
            <TabsTrigger
              value="role-permissions"
              className="flex-shrink-0 whitespace-nowrap data-[state=active]:bg-transparent data-[state=active]:text-primary rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 px-4 font-medium"
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Permissões de Perfil
            </TabsTrigger>
            <TabsTrigger
              value="user-page-permissions" 
              className="flex-shrink-0 whitespace-nowrap data-[state=active]:bg-transparent data-[state=active]:text-primary rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 px-4 font-medium"
            >
              <FileKey className="mr-2 h-4 w-4" />
              Permissões de Página
            </TabsTrigger>
            <TabsTrigger
              value="user-approval"
              className="flex-shrink-0 whitespace-nowrap data-[state=active]:bg-transparent data-[state=active]:text-primary rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 px-4 font-medium"
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Aprovação de Usuários
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="role-permissions">
          <RolePermissions />
        </TabsContent>
        <TabsContent value="user-page-permissions">
          <UserPagePermissionsTab />
        </TabsContent>
        <TabsContent value="user-approval">
          <UserApprovalTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};