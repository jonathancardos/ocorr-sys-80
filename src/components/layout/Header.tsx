"use client";

import { Bell, User, LogOut, Activity, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "react-router-dom";

interface HeaderProps {
  navigationItems?: { id: string; label: string; icon: React.ElementType; path?: string }[];
  currentPage?: string;
  onNavigate?: (pageId: string) => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Header = ({ navigationItems, currentPage, onNavigate, onToggleSidebar, isSidebarOpen }: HeaderProps) => {
  const { profile, signOut } = useAuth();
  const isMobile = useIsMobile();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // A função signOut será chamada pelo botão no sidebar agora.
  // const handleSignOut = async () => {
  //   await signOut();
  // };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-gradient-header shadow-card">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Seção Esquerda: Gatilho do Menu Mobile + Logo/Título */}
        <div className="flex items-center space-x-3">
          {/* Gatilho do Menu Mobile (visível apenas em mobile) */}
          {isMobile && navigationItems && onNavigate && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary-foreground">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex items-center space-x-4 p-6 border-b">
                  <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
                    <Activity className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground leading-tight">Sistema de Laudos</h1>
                  </div>
                </div>
                <nav className="p-6 space-y-3">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;
                    return (
                      <Button
                        key={item.id}
                        variant={isActive ? "default" : "ghost"}
                        className={cn(
                          "w-full justify-start text-left py-2 transition-all duration-200",
                          isActive 
                            ? "bg-primary text-primary-foreground shadow-md" 
                            : "hover:bg-primary/10 hover:text-primary hover:translate-x-1" // Alterado para hover:bg-primary/10 e hover:text-primary
                        )}
                        onClick={() => onNavigate(item.id)}
                      >
                        <Icon className="mr-3 h-4 w-4" />
                        <span className="font-medium text-wrap">{item.label}</span>
                      </Button>
                    );
                  })}
                  {/* Botão de Logout no menu lateral mobile */}
                  <DropdownMenuSeparator />
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left py-2 transition-all duration-200 hover:bg-primary/10 hover:text-primary hover:translate-x-1" // Alterado para hover:bg-primary/10 e hover:text-primary
                    onClick={signOut}
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span className="font-medium text-wrap">Sair</span>
                  </Button>
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
              <div className="h-12 w-12 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-primary-foreground" />
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
          
          {/* Removido o DropdownMenu de usuário do cabeçalho */}
        </div>
      </div>
    </header>
  );
};