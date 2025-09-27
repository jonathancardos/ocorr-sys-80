import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, Loader2, Download, Share2, CheckCircle, XCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { createRoot } from 'react-dom/client';
import { DriverReportPDFLayout } from './DriverReportPDFLayout';
import { getCnhStatus, getDetailedOmnilinkStatus } from '@/lib/driver-utils';
import { PdfPreviewDialog } from './PdfPreviewDialog'; // Import the new preview dialog

type Driver = Tables<'drivers'>;

interface DriverReportGeneratorProps {
  onClose: () => void;
}

export const DriverReportGenerator: React.FC<DriverReportGeneratorProps> = ({ onClose }) => {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false); // Keep this for internal state if needed, but PDF generation is now in dialog
  const [isSharingWhatsapp, setIsSharingWhatsapp] = useState(false);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false); // New state for preview dialog

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
    enabled: !!startDate && !!endDate, // Only fetch if both dates are selected
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
      message += `*Detalhes dos Motoristas:*\n`;

      drivers.slice(0, 5).forEach((driver, index) => { // Limit to first 5 for brevity in WhatsApp
        const cnhStatus = getCnhStatus(driver.cnh_expiry);
        const omnilinkStatus = getDetailedOmnilinkStatus(driver.omnilink_score_registration_date);
        message += `\n*${index + 1}. ${driver.full_name}*\n`;
        message += `  CPF: ${driver.cpf}\n`;
        message += `  CNH: ${driver.cnh || 'N/A'} (Validade: ${cnhStatus.message})\n`;
        message += `  Omnilink: ${omnilinkStatus.message}\n`;
        message += `  Indicação: ${driver.status_indicacao === 'indicado' ? 'Indicado' : driver.status_indicacao === 'retificado' ? 'Retificado' : 'Não Indicado'}\n`;
      });

      if (drivers.length > 5) {
        message += `\n...e mais ${drivers.length - 5} motoristas.`;
      }
      message += `\n\nGerado pelo Sistema de Gestão Karne & Keijo.`;

      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

      toast.success("Relatório enviado para WhatsApp!", {
        description: "Uma nova janela/aba foi aberta para compartilhar o resumo.",
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
            <PopoverContent className="w-auto p-0">
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
            <PopoverContent className="w-auto p-0">
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
          onClick={handleOpenPdfPreview} // Changed to open preview dialog
          disabled={isGenerateButtonDisabled}
        >
          <Download className="mr-2 h-4 w-4" />
          Gerar PDF
        </Button>
      </div>

      {/* PDF Preview Dialog */}
      <PdfPreviewDialog
        isOpen={isPdfPreviewOpen}
        onClose={() => setIsPdfPreviewOpen(false)}
        drivers={drivers || []}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
};