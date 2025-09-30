import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { NewIncidentForm } from "@/components/incidents/NewIncidentForm";
import { IncidentHistory } from "@/pages/IncidentHistory";
import { SettingsPage } from "@/pages/SettingsPage";
import UserManagement from "@/components/admin/UserManagement";
import DriverManagement from "@/components/admin/DriverManagement";
import { VehicleManagement } from "@/components/admin/VehicleManagement";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  BarChart3, // Used for Reports
  FileText,
  History,
  Home,
  Settings,
  Users,
  Loader2,
  Truck,
  Car,
  Activity,
  LogOut,
  User as UserIcon, // Renomeado User para UserIcon
  ShieldCheck // Added ShieldCheck for the new page
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate, Outlet, useLocation } from "react-router-dom"; // Import Outlet and useLocation
import { ModernWelcomeSection } from "@/components/dashboard/ModernWelcomeSection"; // Import ModernWelcomeSection

type PageView = "dashboard" | "new-incident" | "history" | "reports" | "settings" | "users" | "drivers" | "vehicles" | "driver-omnilink-status"; // Added new page

const defaultNavigationItems = [
  { id: "dashboard", label: "Dashboard", icon: Home, path: "/" },
  { id: "new-incident", label: "Nova Ocorrência", icon: FileText, path: "/new-incident" },
  { id: "history", label: "Histórico", icon: History, path: "/history" },
  { id: "reports", label: "Relatórios", icon: BarChart3, path: "/reports" }, // UPDATED: Added Reports
  { id: "users", label: "Gerenciamento de Usuários", icon: Users, path: "/users" },
  { id: "drivers", label: "Gerenciamento de Motoristas", icon: Truck, path: "/drivers" },
  { id: "vehicles", label: "Gerenciamento de Veículos", icon: Car, path: "/vehicles" },
  { id: "driver-omnilink-status", label: "Status Omnilink", icon: ShieldCheck, path: "/driver-omnilink-status" }, // New navigation item
  { id: "settings", label: "Configurações", icon: Settings, path: "/settings" },
];

const Index = () => {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageView>("dashboard");
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation(); // Use useLocation to get current path

  // Debugging logs
  console.log("Index.tsx: Current user:", user);
  console.log("Index.tsx: Profile object in Index component:", profile);
  console.log("Index.tsx: Profile role in Index component:", profile?.role);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const getVisibleNavigationItems = () => {
    if (!profile || !profile.page_permissions) {
      console.log("Index.tsx: Profile or page permissions not loaded, showing all default navigation items.");
      return defaultNavigationItems;
    }

    const userPermissionsMap = new Map(
      profile.page_permissions.map(p => [p.page_id, p.is_visible])
    );

    const items = defaultNavigationItems.filter(item => {
      const isVisibleByUser = userPermissionsMap.has(item.id) ? userPermissionsMap.get(item.id) : true;
      console.log(`Index.tsx: Filtering item '${item.label}' (id: ${item.id}). Is Visible by User: ${isVisibleByUser}`);
      return isVisibleByUser;
    });
    console.log("Index.tsx: Final visible navigation items based on user permissions:", items.map(item => item.label));
    return items;
  };

  const handlePageChange = (pageId: string) => {
    setCurrentPage(pageId as PageView);
    const selectedItem = defaultNavigationItems.find(item => item.id === pageId);
    if (selectedItem && selectedItem.path) {
      navigate(selectedItem.path);
    } else {
      navigate('/'); 
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Update currentPage based on URL path
  useEffect(() => {
    const currentPath = location.pathname;
    const matchedItem = defaultNavigationItems.find(item => item.path === currentPath);
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

  const visibleNavigationItems = getVisibleNavigationItems();

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
            "min-h-[calc(100vh-4rem)] bg-card/20 backdrop-blur-sm border-r border-border/50 transition-all duration-300 ease-in-out flex flex-col", /* Adjusted transparency */
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
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start text-left py-2 transition-all duration-200 group",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-md" 
                        : "hover:bg-primary/10", // Alterado para hover:bg-primary/10
                      !isSidebarOpen && "justify-center px-0"
                    )}
                    onClick={() => handlePageChange(item.id)}
                  >
                    <Icon className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isSidebarOpen ? "mr-3" : "mr-0",
                      !isActive && "group-hover:translate-x-1 group-hover:text-primary" // Alterado para group-hover:text-primary
                    )} />
                    {isSidebarOpen && (
                      <span className={cn(
                        "font-medium transition-transform duration-200 text-wrap",
                        !isActive && "group-hover:text-primary group-hover:scale-105" // Alterado para group-hover:text-primary
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
          <div className="mx-auto w-full"> {/* Removed max-w-7xl */}
            <Outlet /> {/* This is where the content of the nested routes will be rendered */}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;