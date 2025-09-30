import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, Users, FileText, Download, History, Car } from 'lucide-react';
import { DriverReportCard } from '@/components/reports/DriverReportCard';
import { VehicleReportCard } from '@/components/reports/VehicleReportCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DriverReportGenerator } from '@/components/reports/DriverReportGenerator';
import { VehicleReportGenerator } from '@/components/reports/VehicleReportGenerator';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneratedReportsLog } from '@/components/reports/GeneratedReportsLog';
import { useLocation } from 'react-router-dom';

export const ReportsPage: React.FC = () => {
  const { profile, loading: authLoading } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const [isDriverReportDialogOpen, setIsDriverReportDialogOpen] = useState(false);
  const [isVehicleReportDialogOpen, setIsVehicleReportDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('generators');
  const [initialDriverReportDates, setInitialDriverReportDates] = useState<{ startDate?: Date; endDate?: Date } | undefined>(undefined);
  const [initialVehicleReportFilter, setInitialVehicleReportFilter] = useState<'all' | 'has_workshop' | 'no_workshop' | 'double_blocker' | 'blocker_installed' | 'priority_1' | 'priority_2' | 'priority_3'>('all'); // New state for vehicle filter

  useEffect(() => {
    const tabParam = queryParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }

    const reportTypeParam = queryParams.get('reportType');
    const startDateParam = queryParams.get('startDate');
    const endDateParam = queryParams.get('endDate');
    const filterTypeParam = queryParams.get('filterType'); // New param for vehicle reports

    if (reportTypeParam === 'driver_report' && startDateParam && endDateParam) {
      setInitialDriverReportDates({
        startDate: new Date(startDateParam),
        endDate: new Date(endDateParam),
      });
      setIsDriverReportDialogOpen(true);
      setIsVehicleReportDialogOpen(false); // Ensure other dialog is closed
    } else if (reportTypeParam === 'vehicle_report' && filterTypeParam) { // Handle vehicle report params
      setInitialVehicleReportFilter(filterTypeParam as 'all' | 'has_workshop' | 'no_workshop' | 'double_blocker' | 'blocker_installed' | 'priority_1' | 'priority_2' | 'priority_3');
      setIsVehicleReportDialogOpen(true);
      setIsDriverReportDialogOpen(false); // Ensure other dialog is closed
    }
    else {
      setInitialDriverReportDates(undefined);
      setInitialVehicleReportFilter('all'); // Reset filter
      setIsDriverReportDialogOpen(false); // Explicitly close dialog
      setIsVehicleReportDialogOpen(false); // Explicitly close dialog
    }
  }, [location.search]);


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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b mb-8">
          <TabsList className="flex w-full h-auto p-0 bg-card/20 backdrop-blur-sm overflow-x-auto custom-scrollbar flex-nowrap">
            <TabsTrigger
              value="generators"
              className="flex-shrink-0 whitespace-nowrap data-[state=active]:bg-transparent data-[state=active]:text-primary rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 px-4 font-medium"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Geradores de Relatório
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex-shrink-0 whitespace-nowrap data-[state=active]:bg-transparent data-[state=active]:text-primary rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 px-4 font-medium"
            >
              <History className="mr-2 h-4 w-4" />
              Histórico de Relatórios
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="generators">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DriverReportCard onClick={() => setIsDriverReportDialogOpen(true)} />
            <VehicleReportCard onClick={() => setIsVehicleReportDialogOpen(true)} />

            <Card className="modern-card flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mb-3" />
              <CardTitle className="text-lg">Relatório de Ocorrências</CardTitle>
              <CardDescription>Em breve</CardDescription>
            </Card>
            <Card className="modern-card flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
              <Download className="h-12 w-12 mb-3" />
              <CardTitle className="text-lg">Outros Relatórios</CardTitle>
              <CardDescription>Em breve</CardDescription>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <GeneratedReportsLog />
        </TabsContent>
      </Tabs>

      <Dialog open={isDriverReportDialogOpen} onOpenChange={setIsDriverReportDialogOpen}>
        <DialogContent className="sm:max-w-[700px] bg-card/20 backdrop-blur-md border border-border/50">
          <DialogHeader>
            <DialogTitle>Gerar Relatório de Motoristas</DialogTitle>
            <DialogDescription>
              Selecione o período para gerar o relatório de motoristas cadastrados.
            </DialogDescription>
          </DialogHeader>
          <DriverReportGenerator 
            onClose={() => setIsDriverReportDialogOpen(false)} 
            initialStartDate={initialDriverReportDates?.startDate}
            initialEndDate={initialDriverReportDates?.endDate}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isVehicleReportDialogOpen} onOpenChange={setIsVehicleReportDialogOpen}>
        <DialogContent className="sm:max-w-[700px] bg-card/20 backdrop-blur-md border border-border/50">
          <DialogHeader>
            <DialogTitle>Gerar Relatório de Veículos</DialogTitle>
            <DialogDescription>
              Selecione o filtro para gerar o relatório de veículos cadastrados.
            </DialogDescription>
          </DialogHeader>
          <VehicleReportGenerator
            onClose={() => setIsVehicleReportDialogOpen(false)}
            initialFilterType={initialVehicleReportFilter} // Pass initial filter
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};