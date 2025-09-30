import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Download, Share2, CheckCircle, XCircle, Car, Wrench, XCircle as NoWrenchIcon, Lock, Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TablesInsert } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Vehicle } from '@/types/vehicles';
import { VehiclePdfPreviewDialog } from '../vehicles/VehiclePdfPreviewDialog';
import { useAuth } from '@/contexts/AuthContext';

interface VehicleReportGeneratorProps {
  onClose: () => void;
  initialFilterType?: 'all' | 'has_workshop' | 'no_workshop' | 'double_blocker' | 'blocker_installed' | 'priority_1' | 'priority_2' | 'priority_3'; // Updated prop
}

export const VehicleReportGenerator: React.FC<VehicleReportGeneratorProps> = ({ onClose, initialFilterType = 'all' }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<'all' | 'has_workshop' | 'no_workshop' | 'double_blocker' | 'blocker_installed' | 'priority_1' | 'priority_2' | 'priority_3'>(initialFilterType);
  const [isSharingWhatsapp, setIsSharingWhatsapp] = useState(false);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);

  // Update local state if initialFilterType changes (e.g., from URL params)
  useEffect(() => {
    setFilterType(initialFilterType);
  }, [initialFilterType]);

  const { data: vehicles, isLoading: isLoadingVehicles, error: vehiclesError } = useQuery<Vehicle[], Error>({
    queryKey: ['reportVehicles', filterType],
    queryFn: async () => {
      let query = supabase.from('vehicles').select('*');

      if (filterType === 'has_workshop') {
        query = query.eq('has_workshop', true);
      } else if (filterType === 'no_workshop') {
        query = query.eq('has_workshop', false);
      } else if (filterType === 'double_blocker') {
        query = query.contains('technology', ['Bloqueador Duplo']);
      } else if (filterType === 'blocker_installed') { // NEW: Filter for blocker_installed
        query = query.eq('blocker_installed', true);
      } else if (filterType === 'priority_1') { // NEW: Filter for priority 1
        query = query.eq('priority', 1);
      } else if (filterType === 'priority_2') { // NEW: Filter for priority 2
        query = query.eq('priority', 2);
      } else if (filterType === 'priority_3') { // NEW: Filter for priority 3
        query = query.eq('priority', 3);
      }

      query = query.order('plate', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const logReportMutation = useMutation({
    mutationFn: async (reportData: TablesInsert<'generated_reports'>) => {
      const { data, error } = await supabase
        .from('generated_reports')
        .insert(reportData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generatedReports'] });
    },
    onError: (err: any) => {
      console.error('Error logging report:', err);
      toast.error("Erro ao registrar relatório", {
        description: err.message || "Não foi possível registrar o relatório gerado.",
      });
    },
  });

  const handleOpenPdfPreview = () => {
    if (!vehicles || vehicles.length === 0) {
      toast.info("Nenhum veículo encontrado", {
        description: "Não há veículos para gerar o relatório com o filtro selecionado.",
      });
      return;
    }
    setIsPdfPreviewOpen(true);
  };

  const handleShareWhatsapp = () => {
    if (!vehicles || vehicles.length === 0) {
      toast.info("Nenhum veículo encontrado", {
        description: "Não há veículos para compartilhar com o filtro selecionado.",
      });
      return;
    }

    setIsSharingWhatsapp(true);
    try {
      const getFilterLabel = (type: 'all' | 'has_workshop' | 'no_workshop' | 'double_blocker' | 'blocker_installed' | 'priority_1' | 'priority_2' | 'priority_3') => {
        switch (type) {
          case 'all': return 'Todos os Veículos';
          case 'has_workshop': return 'Veículos com Oficina';
          case 'no_workshop': return 'Veículos sem Oficina';
          case 'double_blocker': return 'Veículos com Bloqueador Duplo';
          case 'blocker_installed': return 'Veículos com Bloqueador Instalado'; // NEW
          case 'priority_1': return 'Veículos Prioridade 1 (Baixa)'; // NEW
          case 'priority_2': return 'Veículos Prioridade 2 (Média)'; // NEW
          case 'priority_3': return 'Veículos Prioridade 3 (Alta)'; // NEW
          default: return 'N/A';
        }
      };

      let message = `*Relatório de Veículos Cadastrados*\n`;
      message += `Filtro: ${getFilterLabel(filterType)}\n\n`;
      message += `*Total de Veículos:* ${vehicles.length}\n\n`;
      message += `---`;

      vehicles.forEach((vehicle, index) => {
        message += `\n\n*${index + 1}. ${vehicle.plate}*\n`;
        message += `  Modelo: ${vehicle.model || 'N/A'}\n`;
        message += `  Tecnologias: ${(vehicle.technology && vehicle.technology.length > 0) ? vehicle.technology.join(', ') : 'N/A'}\n`;
        message += `  Tem Oficina?: ${vehicle.has_workshop === true ? 'Sim' : vehicle.has_workshop === false ? 'Não' : 'N/A'}\n`;
        message += `  Prioridade: ${vehicle.priority || 'N/A'}\n`; // NEW
        message += `  Bloqueador Instalado?: ${vehicle.blocker_installed === true ? 'Sim' : vehicle.blocker_installed === false ? 'Não' : 'N/A'}\n`; // NEW
        message += `\n---`;
      });

      message += `\n\nGerado pelo Sistema de Gestão Karne & Keijo.`;

      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

      toast.success("Relatório enviado para WhatsApp!", {
        description: "Uma nova janela/aba foi aberta para compartilhar o resumo.",
      });

      logReportMutation.mutate({
        report_type: 'vehicle_report',
        generated_by: user?.id || null,
        file_name: `relatorio-veiculos-${filterType}-${format(new Date(), 'dd-MM-yyyy')}.txt`,
        metadata: { sharedVia: 'whatsapp', vehicleCount: vehicles.length, filter: filterType },
      });

    } catch (error) {
      console.error("Error sharing via WhatsApp:", error);
      toast.error("Erro ao compartilhar", {
        description: "Não foi possível gerar o link para o WhatsApp.",
      });
    } finally {
      setIsSharingWhatsapp(false);
    }
  };

  const handleDownloadPdfFromPreview = async (fileUrl: string) => {
    logReportMutation.mutate({
      report_type: 'vehicle_report',
      generated_by: user?.id || null,
      file_name: `relatorio-veiculos-${filterType}-${format(new Date(), 'dd-MM-yyyy')}.pdf`,
      file_url: fileUrl,
      metadata: { vehicleCount: vehicles?.length || 0, filter: filterType, sharedVia: 'pdf_download' },
    });
  };

  const isGenerateButtonDisabled = isLoadingVehicles || isSharingWhatsapp;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="filter-type">Filtrar Veículos</Label>
        <Select value={filterType} onValueChange={(value: 'all' | 'has_workshop' | 'no_workshop' | 'double_blocker' | 'blocker_installed' | 'priority_1' | 'priority_2' | 'priority_3') => setFilterType(value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione o tipo de filtro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Veículos</SelectItem>
            <SelectItem value="has_workshop">Veículos com Oficina</SelectItem>
            <SelectItem value="no_workshop">Veículos sem Oficina</SelectItem>
            <SelectItem value="double_blocker">Veículos com Bloqueador Duplo</SelectItem>
            <SelectItem value="blocker_installed">Veículos com Bloqueador Instalado</SelectItem> {/* NEW */}
            <SelectItem value="priority_1">Veículos Prioridade 1 (Baixa)</SelectItem> {/* NEW */}
            <SelectItem value="priority_2">Veículos Prioridade 2 (Média)</SelectItem> {/* NEW */}
            <SelectItem value="priority_3">Veículos Prioridade 3 (Alta)</SelectItem> {/* NEW */}
          </SelectContent>
        </Select>
      </div>

      {isLoadingVehicles && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Carregando veículos...</span>
        </div>
      )}

      {vehiclesError && (
        <div className="text-destructive text-center py-4">
          <XCircle className="h-6 w-6 inline-block mr-2" />
          Erro ao carregar veículos: {vehiclesError.message}
        </div>
      )}

      {!isLoadingVehicles && !vehiclesError && (
        <div className="text-muted-foreground text-sm text-center py-2">
          <CheckCircle className="h-4 w-4 inline-block mr-1 text-success" />
          {vehicles?.length} veículo(s) encontrado(s) com o filtro "{filterType === 'all' ? 'Todos' : filterType === 'has_workshop' ? 'Com Oficina' : filterType === 'no_workshop' ? 'Sem Oficina' : filterType === 'double_blocker' ? 'Com Bloqueador Duplo' : filterType === 'blocker_installed' ? 'Com Bloqueador Instalado' : filterType === 'priority_1' ? 'Prioridade 1' : filterType === 'priority_2' ? 'Prioridade 2' : 'Prioridade 3'}".
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSharingWhatsapp}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={handleOpenPdfPreview}
          disabled={isGenerateButtonDisabled}
        >
          <Download className="mr-2 h-4 w-4" />
          Gerar PDF
        </Button>
      </div>

      <VehiclePdfPreviewDialog
        isOpen={isPdfPreviewOpen}
        onClose={() => setIsPdfPreviewOpen(false)}
        vehicles={vehicles || []}
        filterType={filterType}
        onDownloadSuccess={handleDownloadPdfFromPreview}
      />
    </div>
  );
};