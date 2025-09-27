import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DriverReportCardProps {
  onClick: () => void;
  className?: string;
}

export const DriverReportCard: React.FC<DriverReportCardProps> = ({ onClick, className }) => {
  return (
    <Card
      className={cn(
        "modern-card cursor-pointer hover:shadow-elevated transition-all duration-300",
        "flex flex-col items-center justify-center p-6 text-center",
        className
      )}
      onClick={onClick}
    >
      <div className="p-3 rounded-full bg-primary/10 text-primary mb-4">
        <Users className="h-8 w-8" />
      </div>
      <CardTitle className="text-xl font-bold mb-2">Motoristas Cadastrados</CardTitle>
      <CardDescription className="text-sm text-muted-foreground">
        Gere um relatório detalhado de todos os motoristas.
      </CardDescription>
      <div className="mt-4 text-primary flex items-center gap-2">
        <FileText className="h-4 w-4" />
        <span>Gerar Relatório</span>
      </div>
    </Card>
  );
};