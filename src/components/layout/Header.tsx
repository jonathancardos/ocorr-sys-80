"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, User, LogOut, Activity, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path?: string;
  externalLink?: boolean; // Add this line
  children?: NavigationItem[]; // Add children for nested navigation
}

interface HeaderProps {
  navigationItems?: NavigationItem[];
  currentPage?: string;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Header = ({ navigationItems, currentPage, onToggleSidebar, isSidebarOpen }: HeaderProps) => {
  const { profile, signOut, user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigation = (item: NavigationItem) => {
    if (item.path) {
      if (item.externalLink) {
        window.location.href = item.path;
      } else {
        navigate(item.path);
      }
    }
    setMobileMenuOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-gradient-header shadow-card">
      <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between">
        {/* Seção Esquerda: Gatilho do Menu Mobile + Logo/Título */}
        <div className="flex items-center space-x-3">
          {/* Gatilho do Menu Mobile (visível apenas em mobile) */}
          {isMobile && navigationItems && (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary-foreground">
                  <Menu className="h-5 w-5" /> {/* Ajustado para h-5 w-5 */}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetHeader>
                  <SheetTitle className="sr-only">Navegação Principal</SheetTitle>
                </SheetHeader>
                <div className="flex items-center space-x-4 p-6 border-b">
                  <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center"> {/* Ajustado para h-10 w-10 */}
                    <Activity className="h-5 w-5 text-primary-foreground" /> {/* Ajustado para h-5 w-5 */}
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-foreground leading-tight">Sistema de Laudos</h1> {/* Ajustado para text-lg */}
                  </div>
                </div>
                <nav className="p-6 space-y-3 flex-1">
                  {navigationItems.map((item) => {
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
                                  : "hover:bg-primary/10"
                              )}
                            >
                              <Icon className="h-4 w-4 mr-3" />
                              <span className="font-medium text-wrap">
                                {item.label}
                              </span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="right" align="start" className="w-48">
                            <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {item.children.map((child) => (
                              <DropdownMenuItem key={child.id} onClick={() => handleNavigation(child)}>
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
                            : "hover:bg-primary/10", // Alterado para hover:bg-primary/10
                          !isSidebarOpen && "justify-center px-0"
                        )}
                        onClick={() => handleNavigation(item)}
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
              </SheetContent>
            </Sheet>
          )}

          {/* Botão de Toggle do Sidebar (novo, visível apenas em desktop) */}
          {!isMobile && onToggleSidebar && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onToggleSidebar} 
              className="text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9"
            >
              <Menu className={cn("h-5 w-5 transition-transform duration-300", !isSidebarOpen && "rotate-180")} />
            </Button>
          )}

          {/* Logo e Nome da Empresa (visível no desktop) */}
          {!isMobile && (
            <div className="flex items-center space-x-2">
              <div className="h-12 w-12 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-primary-foreground leading-tight">
                Sistema de Laudos
              </h1>
            </div>
          )}
          {/* Logo simplificado para mobile (apenas ícone), visível apenas no mobile */}
          {isMobile && (
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center"> {/* Ajustado para h-10 w-10 */}
                <Activity className="h-5 w-5 text-primary-foreground" /> {/* Ajustado para h-5 w-5 */}
              </div>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button variant="ghost" size="icon" className="relative text-primary-foreground hover:bg-primary-foreground/10 h-9 w-9 sm:h-10 sm:w-10">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-destructive text-destructive-foreground">
              3
            </Badge>
          </Button>
          
          {/* Botão de alternância de tema */}
          <ThemeToggle />

          {/* User Profile and Logout Dropdown - MOVIDO PARA CÁ */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 px-2 sm:px-3 h-9 sm:h-10 text-primary-foreground hover:bg-primary-foreground/10">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                  {profile?.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={profile.username} />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {profile ? getInitials(profile.full_name) : 'U'}
                    </AvatarFallback>
                  )}
                </Avatar>
                {!isMobile && ( // Mostrar nome de usuário apenas em desktop
                  <div className="text-left">
                    <div className="text-sm font-medium text-primary-foreground">@{profile?.username}</div>
                  </div>
                )}
                {isMobile && ( // Mostrar nome de usuário truncado em mobile
                  <div className="text-left max-w-[80px] truncate"> {/* Adicionado max-w e truncate */}
                    <div className="text-sm font-medium text-primary-foreground">@{profile?.username}</div>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px] w-56 bg-card/20 border border-border/50"> {/* Adicionado min-w */}
              <DropdownMenuLabel>
                <div className="text-wrap">
                  <div className="font-medium">@{profile?.username}</div>
                  {profile?.full_name && profile.full_name !== user?.email && (
                    <div className="text-sm text-muted-foreground">{profile?.full_name}</div>
                  )}
                  {user?.email && <div className="text-xs text-muted-foreground">{user.email}</div>}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};