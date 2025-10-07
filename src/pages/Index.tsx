import { toast } from "sonner";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ModernWelcomeSection } from "@/components/dashboard/ModernWelcomeSection";
import {
  Home,
  FileText,
  History,
  BarChart3,
  Users,
  Truck,
  Car,
  ShieldCheck,
  Settings,
  Loader2,
  Activity,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { NewIncidentForm } from "@/components/incidents/NewIncidentForm";
import { IncidentHistory } from "@/pages/IncidentHistory";
import { SettingsPage } from "@/pages/SettingsPage";
import UserManagement from "@/components/admin/UserManagement";
import DriverManagement from "@/components/admin/DriverManagement";
import { VehicleManagement } from "@/components/admin/VehicleManagement";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal"; // Importar ConfirmationModal

type PageView = "dashboard" | "incidents" | "reports" | "settings" | "users" | "drivers" | "vehicles" | "driver-omnilink-status"; // Updated to "incidents"

const defaultNavigationItems = [
  { id: "dashboard", label: "Dashboard", icon: Home, path: "/" },
  {
    id: "incidents",
    label: "Gerenciamento de Ocorrências",
    icon: FileText,
    children: [
      { id: "new-incident", label: "Nova Ocorrência", icon: FileText, path: "/new-incident" },
      { id: "history", label: "Histórico", icon: History, path: "/history" },
    ],
  },
  // { id: "history", label: "Histórico", icon: History, path: "/history" }, // Removed
  { id: "reports", label: "Relatórios", icon: BarChart3, path: "/reports" }, // UPDATED: Added Reports
  { id: "users", label: "Gerenciamento de Usuários", icon: Users, path: "/users" },
  { id: "drivers", label: "Gerenciamento de Motoristas", icon: Truck, path: "/drivers" },
  { id: "vehicles", label: "Gerenciamento de Veículos", icon: Car, path: "/vehicles" },
  { id: "driver-omnilink-status", label: "Status Omnilink", icon: ShieldCheck, path: "/driver-omnilink-status" }, // New navigation item
  { id: "ocorrencias-v2", label: "Ocorrências V2", icon: FileText, path: "/ocorrencias-v2" },
  { id: "settings", label: "Configurações", icon: Settings, path: "/settings" },
];

const Index = ({ hasUnsavedChanges, setHasUnsavedChanges }: { hasUnsavedChanges: boolean; setHasUnsavedChanges: (hasChanges: boolean) => void }) => {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageView>("dashboard");
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation(); // Use useLocation to get current path
  const [showConfirmationModal, setShowConfirmationModal] = useState(false); // Novo estado para o modal
  const [pendingNavigationPath, setPendingNavigationPath] = useState<string | undefined>(undefined); // Novo estado para o caminho de navegação pendente
  const [drafts, setDrafts] = useState<any[]>([]);

  const [saveDraftCallback, setSaveDraftCallback] = useState<(() => void) | undefined>(undefined); // New state for draft save callback

  const [showCancelConfirmationModal, setShowCancelConfirmationModal] = useState(false);

  const handleCancelConfirmation = useCallback(() => {
    setShowCancelConfirmationModal(true);
  }, []);

  const handleConfirmCancel = useCallback(() => {
    // Logic to delete draft from localStorage if it exists
    const currentPath = location.pathname;
    if (currentPath.startsWith('/new-incident/')) {
      const draftId = currentPath.split('/')[2];
      if (draftId) {
        const updatedDrafts = drafts.filter(draft => draft.id !== draftId);
        setDrafts(updatedDrafts);
        localStorage.setItem('incidentDrafts', JSON.stringify(updatedDrafts));
        toast.info("Rascunho descartado.", {
          description: "O rascunho foi removido e as alterações não salvas foram perdidas.",
        });
      }
    }
    setShowCancelConfirmationModal(false);
    navigate('/dashboard');
  }, [location.pathname, drafts, navigate]);

  const handleKeepEditing = useCallback(() => {
    setShowCancelConfirmationModal(false);
  }, []);

  useEffect(() => {
    const storedDrafts = localStorage.getItem('incidentDrafts');
    if (storedDrafts) {
      setDrafts(JSON.parse(storedDrafts));
    }
  }, []);

  const handleSaveIncident = useCallback((formData: any, isDraft?: boolean) => {
    if (isDraft) {
      const draftId = `draft-${Date.now()}`;
      const newDraft = { id: draftId, ...formData };
      const updatedDrafts = [...drafts, newDraft];
      setDrafts(updatedDrafts);
      localStorage.setItem('incidentDrafts', JSON.stringify(updatedDrafts));
      toast.success("Rascunho salvo!", {
        description: "A ocorrência foi salva como rascunho e pode ser editada mais tarde.",
      });
      console.log("Draft Saved:", newDraft);
      setHasUnsavedChanges(false);
    } else {
      console.log("Form Data:", formData, "Is Draft:", isDraft);
      toast.success("Ocorrência salva!", {
        description: "A ocorrência foi registrada com sucesso.",
      });
      setHasUnsavedChanges(false);
      navigate('/history');
    }
  }, [drafts, setHasUnsavedChanges, navigate]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  // Memoize visible navigation items to prevent infinite re-renders
  const visibleNavigationItems = useMemo(() => {
    if (!profile || !profile.page_permissions) {
      return defaultNavigationItems;
    }

    const userPermissionsMap = new Map(
      profile.page_permissions.map(p => [p.page_id, p.is_visible])
    );

    return defaultNavigationItems.filter(item => {
      const isVisibleByUser = userPermissionsMap.has(item.id) ? userPermissionsMap.get(item.id) : true;
      return isVisibleByUser;
    });
  }, [profile]);

  const handlePageChange = useCallback((pageId: string, path?: string) => {
    if (hasUnsavedChanges && location.pathname.startsWith('/new-incident')) {
      setPendingNavigationPath(path || '/');
      setShowConfirmationModal(true);
      return;
    }

    setCurrentPage(pageId as PageView);
    if (path) {
      navigate(path);
    }
    else {
      const selectedItem = defaultNavigationItems.find(item => item.id === pageId);
      if (selectedItem && selectedItem.path) {
        navigate(selectedItem.path);
      } else {
        navigate('/');
      }
    }
  }, [hasUnsavedChanges, location.pathname, navigate]);

  const handleConfirmNavigation = useCallback(() => {
    setHasUnsavedChanges(false);
    setShowConfirmationModal(false);
    if (pendingNavigationPath) {
      navigate(pendingNavigationPath);
      setPendingNavigationPath(undefined);
    }
  }, [pendingNavigationPath, setHasUnsavedChanges, navigate]);

  const handleCancelNavigation = useCallback(() => {
    setShowConfirmationModal(false);
    setPendingNavigationPath(undefined);
  }, []);

  const handleSaveDraftAndNavigate = useCallback(() => {
    setShowConfirmationModal(false);
    if (saveDraftCallback) {
      saveDraftCallback();
    }
    setHasUnsavedChanges(false);
    if (pendingNavigationPath) {
      navigate(pendingNavigationPath);
      setPendingNavigationPath(undefined);
    }
    toast.info("Rascunho salvo e navegação continuada.", {
      description: "A ocorrência foi salva como rascunho e você foi redirecionado.",
    });
  }, [saveDraftCallback, pendingNavigationPath, setHasUnsavedChanges, navigate]);

  const getInitials = useCallback((name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  // Update currentPage based on URL path
  useEffect(() => {
    const currentPath = location.pathname;
    let matchedItem: { id: string; path?: string } | undefined;

    for (const item of defaultNavigationItems) {
      if (item.path === currentPath) {
        matchedItem = item;
        break;
      }
      if (item.children) {
        matchedItem = item.children.find(child => child.path === currentPath);
        if (matchedItem) break;
      }
    }

    if (matchedItem && matchedItem.id !== currentPage) {
      setCurrentPage(matchedItem.id as PageView);
    } else if (!matchedItem && currentPath === '/') {
      setCurrentPage("dashboard");
    }
  }, [location.pathname, currentPage]);


  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header 
        navigationItems={visibleNavigationItems} 
        currentPage={currentPage} 
        onNavigate={handlePageChange} 
        onToggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
      />
      
      <div className="flex flex-1">
        {/* Desktop Sidebar Navigation */}
        {!isMobile && (
          <aside className={cn(
            "min-h-[calc(100vh-4rem)] bg-card/20 border-r border-border/50 transition-all duration-300 ease-in-out flex flex-col", /* Adjusted transparency */
            isSidebarOpen ? "w-64" : "w-20"
          )}>
            {isSidebarOpen && (
              <div className="p-4">
                <ModernWelcomeSection />
              </div>
            )}
            <nav className="p-6 space-y-3 flex-1">
              {visibleNavigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;

                if (item.children) {
                  return (
                    <DropdownMenu key={item.id}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant={isActive ? "default" : "ghost"}
                          className={cn(
                            "w-full justify-start text-left py-2 transition-all duration-200 group",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-md"
                              : "hover:bg-primary/10",
                            !isSidebarOpen && "justify-center px-0"
                          )}
                        >
                          <Icon className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            isSidebarOpen ? "mr-3" : "mr-0",
                            !isActive && "group-hover:translate-x-1 group-hover:text-primary"
                          )} />
                          {isSidebarOpen && (
                            <span className={cn(
                              "font-medium transition-transform duration-200 text-wrap",
                              !isActive && "group-hover:text-primary group-hover:scale-105"
                            )}>
                              {item.label}
                            </span>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="start" className="w-48">
                        <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {item.children.map((child) => (
                          <DropdownMenuItem key={child.id} onClick={() => handlePageChange(child.id, child.path)}>
                            <child.icon className="mr-2 h-4 w-4" />
                            {child.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }

                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start text-left py-2 transition-all duration-200 group",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "hover:bg-bg-primary/10",
                      !isSidebarOpen && "justify-center px-0"
                    )}
                    onClick={() => handlePageChange(item.id, item.path)}
                  >
                    <Icon className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isSidebarOpen ? "mr-3" : "mr-0",
                      !isActive && "group-hover:translate-x-1 group-hover:text-primary"
                    )} />
                    {isSidebarOpen && (
                      <span className={cn(
                        "font-medium transition-transform duration-200 text-wrap",
                        !isActive && "group-hover:text-primary group-hover:scale-105"
                      )}>
                        {item.label}
                      </span>
                    )}
                  </Button>
                );
              })}
            </nav>
            {/* User Profile and Logout at the bottom of the sidebar - REMOVIDO DAQUI */}
          </aside>
        )}

        {/* Main Content - Render nested routes here */}
        <main className="flex-1 bg-gradient-to-br from-background to-muted/20 p-4 sm:p-8">
          <div className="mx-auto w-full max-w-full">
            <Outlet context={{ handleSaveIncident, setSaveDraftCallback, onCancelConfirm: handleCancelConfirmation }} /> {/* This is where the content of the nested routes will be rendered */}
          </div>
        </main>
      </div>
      {showConfirmationModal && (
        <ConfirmationModal
          isOpen={showConfirmationModal}
          onClose={handleCancelNavigation}
          onConfirm={handleConfirmNavigation}
          onSaveDraft={handleSaveDraftAndNavigate}
          title="Deseja cancelar a ocorrência atual?"
          description="Você está prestes a sair da página de criação de ocorrência. Escolha uma opção abaixo:"
          confirmText="Sim, cancelar"
          cancelText="Não, continuar editando"
          saveDraftText="Salvar rascunho"
        />
      )}
      {showCancelConfirmationModal && (
        <ConfirmationModal
          isOpen={showCancelConfirmationModal}
          onClose={handleKeepEditing}
          onConfirm={handleConfirmCancel}
          title="Confirmar Cancelamento"
          description="Tem certeza que deseja cancelar? Todas as alterações não salvas serão perdidas."
          confirmText="Sim, cancelar e sair"
          cancelText="Não, continuar editando"
        />
      )}
    </div>
  );
};

export default Index;