import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const WelcomeCard = () => {
  const { profile } = useAuth();
  const currentDate = format(new Date(), "EEEE, MMMM dd", { locale: ptBR });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Extrai o primeiro nome da propriedade full_name
  const firstName = profile?.full_name?.split(' ')[0];

  return (
    <Card className="modern-card p-6 bg-gradient-card shadow-elevated">
      <CardContent className="p-0">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 border-2 border-primary-light">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile.username} />
              ) : (
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                  {profile ? getInitials(profile.full_name) : 'U'}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <p className="text-sm text-muted-foreground uppercase mb-1">
                {currentDate}
              </p>
              <h2 className="text-3xl font-bold text-foreground">
                Bem-vindo de volta, {firstName || profile?.username || 'Usuário'}!
              </h2>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </CardContent>
    </Card>
  );
};