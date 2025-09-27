import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, Users, FileText, Download } from 'lucide-react';
import { DriverReportCard } from '@/components/reports/DriverReportCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DriverReportGenerator } from '@/components/reports/DriverReportGenerator';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ShieldCheck } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { profile, loading: authLoading } = useAuth();
  const [isDriverReportDialogOpen, setIsDriverReportDialogOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Carregando relatórios...</h3>
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
          <p className="text-muted-foreground">Apenas administradores podem acessar a área de relatórios.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Relatórios</h2>
          <p className="text-muted-foreground">
            Gere e visualize relatórios importantes do sistema.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DriverReportCard onClick={() => setIsDriverReportDialogOpen(true)} />

        {/* Add more report cards here as needed */}
        <Card className="modern-card flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mb-3" />
          <CardTitle className="text-lg">Relatório de Ocorrências</CardTitle>
          <CardDescription>Em breve</CardDescription>
        </Card>
        <Card className="modern-card flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
          <Download className="h-12 w-12 mb-3" />
          <CardTitle className="text-lg">Relatório de Veículos</CardTitle>
          <CardDescription>Em breve</CardDescription>
        </Card>
      </div>

      <Dialog open={isDriverReportDialogOpen} onOpenChange={setIsDriverReportDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Gerar Relatório de Motoristas</DialogTitle>
            <DialogDescription>
              Selecione o período para gerar o relatório de motoristas cadastrados.
            </DialogDescription>
          </DialogHeader>
          <DriverReportGenerator onClose={() => setIsDriverReportDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};