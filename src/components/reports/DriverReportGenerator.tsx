import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, Loader2, Download, Share2, CheckCircle, XCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { createRoot } from 'react-dom/client';
import { DriverReportPDFLayout } from './DriverReportPDFLayout';
import { getCnhStatus, getDetailedOmnilinkStatus } from '@/lib/driver-utils';
import { PdfPreviewDialog } from './PdfPreviewDialog';
import { useAuth } from '@/contexts/AuthContext';

type Driver = Tables<'drivers'>;

interface DriverReportGeneratorProps {
  onClose: () => void;
  initialStartDate?: Date; // New prop
  initialEndDate?: Date;   // New prop
}

export const DriverReportGenerator: React.FC<DriverReportGeneratorProps> = ({ onClose, initialStartDate, initialEndDate }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState<Date | undefined>(initialStartDate);
  const [endDate, setEndDate] = useState<Date | undefined>(initialEndDate);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSharingWhatsapp, setIsSharingWhatsapp] = useState(false);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);

  // Update local state if initial dates change (e.g., from URL params)
  useEffect(() => {
    setStartDate(initialStartDate);
    setEndDate(initialEndDate);
  }, [initialStartDate, initialEndDate]);

  const { data: drivers, isLoading: isLoadingDrivers, error: driversError } = useQuery<Driver[], Error>({
    queryKey: ['reportDrivers', startDate, endDate],
    queryFn: async () => {
      let query = supabase.from('drivers').select('*');

      if (startDate) {
        query = query.gte('omnilink_score_registration_date', format(startDate, 'yyyy-MM-dd'));
      }
      if (endDate) {
        query = query.lte('omnilink_score_registration_date', format(endDate, 'yyyy-MM-dd'));
      }

      query = query.order('full_name', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!startDate && !!endDate,
  });

  // Mutation to log the generated report
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
    if (!drivers || drivers.length === 0) {
      toast.info("Nenhum motorista encontrado", {
        description: "Não há motoristas para gerar o relatório no período selecionado.",
      });
      return;
    }
    setIsPdfPreviewOpen(true);
  };

  const getIndicacaoStatusLabel = (status: 'indicado' | 'retificado' | 'nao_indicado' | null) => {
    switch (status) {
      case 'indicado': return 'Indicado';
      case 'retificado': return 'Retificado';
      case 'nao_indicado': return 'Não Indicado';
      default: return 'N/A';
    }
  };

  const handleShareWhatsapp = () => {
    if (!drivers || drivers.length === 0) {
      toast.info("Nenhum motorista encontrado", {
        description: "Não há motoristas para compartilhar no período selecionado.",
      });
      return;
    }

    setIsSharingWhatsapp(true);
    try {
      const formattedStartDate = startDate ? format(startDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Início';
      const formattedEndDate = endDate ? format(endDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Fim';

      let message = `*Relatório de Motoristas Cadastrados*\n`;
      message += `Período: ${formattedStartDate} a ${formattedEndDate}\n\n`;
      message += `*Total de Motoristas:* ${drivers.length}\n\n`;
      message += `---`; // Separador inicial

      drivers.forEach((driver, index) => {
        const omnilinkStatus = getDetailedOmnilinkStatus(driver.omnilink_score_registration_date);
        const indicacaoStatus = getIndicacaoStatusLabel(driver.status_indicacao as 'indicado' | 'retificado' | 'nao_indicado' | null);

        message += `\n\n*${index + 1}. ${driver.full_name}*\n`;
        message += `  CPF: ${driver.cpf || 'N/A'}\n`;
        message += `  Tipo: ${driver.type || 'N/A'}\n`;
        message += `  Omnilink Score: ${driver.omnilink_score_registration_date ? format(parseISO(driver.omnilink_score_registration_date), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'} (Vencimento: ${driver.omnilink_score_expiry_date ? format(parseISO(driver.omnilink_score_expiry_date), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'})\n`;
        message += `  Status Omnilink: ${omnilinkStatus.message}\n`;
        message += `  Status Indicação: ${indicacaoStatus}\n`;
        if (driver.status_indicacao === 'nao_indicado' && driver.reason_nao_indicacao) {
          message += `  Motivo Não Indicação: ${driver.reason_nao_indicacao}\n`;
        }
        message += `\n---`; // Separador entre motoristas
      });

      message += `\n\nGerado pelo Sistema de Gestão Karne & Keijo.`;

      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

      toast.success("Relatório enviado para WhatsApp!", {
        description: "Uma nova janela/aba foi aberta para compartilhar o resumo.",
      });

      // Log the report generation
      logReportMutation.mutate({
        report_type: 'driver_report',
        generated_by: user?.id || null,
        start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
        file_name: `relatorio-motoristas-${format(startDate || new Date(), 'dd-MM-yyyy')}-${format(endDate || new Date(), 'dd-MM-yyyy')}.txt`,
        metadata: { sharedVia: 'whatsapp', driverCount: drivers.length },
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

  const handleDownloadPdfFromPreview = async (fileUrl: string) => { // Now accepts fileUrl
    logReportMutation.mutate({
      report_type: 'driver_report',
      generated_by: user?.id || null,
      start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
      end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      file_name: `relatorio-motoristas-${format(startDate || new Date(), 'dd-MM-yyyy')}-${format(endDate || new Date(), 'dd-MM-yyyy')}.pdf`,
      file_url: fileUrl, // Save the generated PDF URL
      metadata: { driverCount: drivers?.length || 0, sharedVia: 'pdf_download' },
    });
  };

  const isGenerateButtonDisabled = !startDate || !endDate || isLoadingDrivers || isSharingWhatsapp;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start-date">Data de Início (Omnilink Score)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione a data de início</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card/20 backdrop-blur-md border border-border/50"> {/* Adjusted transparency */}
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="end-date">Data de Fim (Omnilink Score)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione a data de fim</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card/20 backdrop-blur-md border border-border/50"> {/* Adjusted transparency */}
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {isLoadingDrivers && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Carregando motoristas...</span>
        </div>
      )}

      {driversError && (
        <div className="text-destructive text-center py-4">
          <XCircle className="h-6 w-6 inline-block mr-2" />
          Erro ao carregar motoristas: {driversError.message}
        </div>
      )}

      {startDate && endDate && !isLoadingDrivers && !driversError && (
        <div className="text-muted-foreground text-sm text-center py-2">
          <CheckCircle className="h-4 w-4 inline-block mr-1 text-success" />
          {drivers?.length} motorista(s) encontrado(s) no período.
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
          onClick={handleShareWhatsapp}
          disabled={isGenerateButtonDisabled}
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          {isSharingWhatsapp ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Share2 className="mr-2 h-4 w-4" />
              Enviar WhatsApp
            </>
          )}
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

      <PdfPreviewDialog
        isOpen={isPdfPreviewOpen}
        onClose={() => setIsPdfPreviewOpen(false)}
        drivers={drivers || []}
        startDate={startDate}
        endDate={endDate}
        onDownloadSuccess={handleDownloadPdfFromPreview}
      />
    </div>
  );
};