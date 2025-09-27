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

type Driver = Tables<'drivers'>;

interface DriverReportGeneratorProps {
  onClose: () => void;
}

export const DriverReportGenerator: React.FC<DriverReportGeneratorProps> = ({ onClose }) => {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSharingWhatsapp, setIsSharingWhatsapp] = useState(false);
  const pdfPreviewRef = useRef<HTMLDivElement>(null);

  const { data: drivers, isLoading: isLoadingDrivers, error: driversError } = useQuery<Driver[], Error>({
    queryKey: ['reportDrivers', startDate, endDate],
    queryFn: async () => {
      let query = supabase.from('drivers').select('*');

      if (startDate) {
        // UPDATED: Filter by omnilink_score_registration_date
        query = query.gte('omnilink_score_registration_date', format(startDate, 'yyyy-MM-dd'));
      }
      if (endDate) {
        // UPDATED: Filter by omnilink_score_registration_date
        query = query.lte('omnilink_score_registration_date', format(endDate, 'yyyy-MM-dd'));
      }

      query = query.order('full_name', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!startDate && !!endDate, // Only fetch if both dates are selected
  });

  const handleGeneratePdf = async () => {
    if (!drivers || drivers.length === 0) {
      toast.info("Nenhum motorista encontrado", {
        description: "Não há motoristas para gerar o relatório no período selecionado.",
      });
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px'; // Render off-screen
      tempDiv.style.width = '210mm'; // A4 width
      tempDiv.style.minHeight = '297mm'; // A4 height
      document.body.appendChild(tempDiv);

      const root = createRoot(tempDiv);
      let resolveRenderPromise: () => void = () => {};
      const renderPromise = new Promise<void>(resolve => {
        resolveRenderPromise = resolve;
      });

      root.render(
        <DriverReportPDFLayout
          drivers={drivers}
          startDate={startDate}
          endDate={endDate}
          onRenderComplete={resolveRenderPromise}
        />
      );

      await renderPromise; // Wait for the component to signal completion
      await new Promise(resolve => setTimeout(resolve, 200)); // Small additional delay

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`relatorio-motoristas-${format(startDate || new Date(), 'dd-MM-yyyy')}-${format(endDate || new Date(), 'dd-MM-yyyy')}.pdf`);

      toast.success("PDF gerado com sucesso!", {
        description: "O relatório de motoristas foi baixado para seu computador.",
      });

      root.unmount();
      document.body.removeChild(tempDiv);

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar PDF", {
        description: "Ocorreu um erro ao gerar o arquivo PDF. Verifique o console para detalhes.",
      });
    } finally {
      setIsGeneratingPdf(false);
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

  const isGenerateButtonDisabled = !startDate || !endDate || isLoadingDrivers || isGeneratingPdf || isSharingWhatsapp;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start-date">Data de Início (Omnilink Score)</Label> {/* UPDATED LABEL */}
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
          <Label htmlFor="end-date">Data de Fim (Omnilink Score)</Label> {/* UPDATED LABEL */}
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
          disabled={isGeneratingPdf || isSharingWhatsapp}
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
          onClick={handleGeneratePdf}
          disabled={isGenerateButtonDisabled}
        >
          {isGeneratingPdf ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando PDF...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Gerar PDF
            </>
          )}
        </Button>
      </div>
    </div>
  );
};