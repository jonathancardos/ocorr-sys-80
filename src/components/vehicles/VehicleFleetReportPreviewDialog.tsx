import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Download, X, Share2, Car, ExternalLink, CheckCircle } from 'lucide-react'; // Adicionado ExternalLink, CheckCircle
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createRoot } from 'react-dom/client';
import { errorService } from '@/services/errorService';
import { VehicleFleetReportPDFLayout } from './VehicleFleetReportPDFLayout';
import { Vehicle } from '@/types/vehicles';
import { toast } from 'sonner';
import { uploadFile } from '@/integrations/supabase/storage';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TablesInsert } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';

interface VehicleFleetReportPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  onDownloadSuccess?: (fileUrl: string) => void;
}

export const VehicleFleetReportPreviewDialog: React.FC<VehicleFleetReportPreviewDialogProps> = ({
  isOpen,
  onClose,
  vehicles,
  onDownloadSuccess,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharingWhatsapp, setIsSharingWhatsapp] = useState(false);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<Blob | null>(null);

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
      errorService.log('Error logging report:', err);
      toast.error("Erro ao registrar relatório", {
        description: err.message || "Não foi possível registrar o relatório gerado.",
      });
    },
  });

  useEffect(() => {
    if (!isOpen) {
      setIsGeneratingPdf(true);
      setGeneratedPdfBlob(null);
      return;
    }

    const generatePdfBlob = async () => {
      setIsGeneratingPdf(true);
      setGeneratedPdfBlob(null);

      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '210mm';
      document.body.appendChild(tempDiv);

      const root = createRoot(tempDiv);
      let resolveRenderPromise: () => void = () => {};
      const renderPromise = new Promise<void>(resolve => {
        resolveRenderPromise = resolve;
      });

      root.render(
        <VehicleFleetReportPDFLayout
          vehicles={vehicles}
          onRenderComplete={resolveRenderPromise}
        />
      );

      await renderPromise;
      await new Promise(resolve => setTimeout(resolve, 200));

      try {
        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          windowWidth: tempDiv.scrollWidth,
          windowHeight: tempDiv.scrollHeight,
          x: 0,
          y: 0,
          width: tempDiv.offsetWidth,
          height: tempDiv.offsetHeight,
        });

        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        setGeneratedPdfBlob(pdf.output('blob'));

      } catch (error) {
        errorService.log("Error generating PDF blob:", error);
        toast.error("Erro na geração do PDF", {
          description: "Não foi possível gerar o arquivo PDF.",
        });
      } finally {
        root.unmount();
        document.body.removeChild(tempDiv);
        setIsGeneratingPdf(false);
      }
    };

    generatePdfBlob();
  }, [isOpen, vehicles]);

  const handleOpenPdfInNewTab = () => {
    if (!generatedPdfBlob) {
      toast.error("Erro ao abrir PDF", {
        description: "O PDF não está disponível.",
      });
      return;
    }
    const url = URL.createObjectURL(generatedPdfBlob);
    window.open(url, '_blank');
    URL.revokeObjectURL(url); // Clean up the object URL
  };

  const handleDownloadPdf = async () => {
    if (!generatedPdfBlob) {
      toast.error("Erro ao baixar PDF", {
        description: "O PDF não está disponível para download.",
      });
      return;
    }

    setIsDownloading(true);
    try {
      const fileName = `relatorio-frota-${format(new Date(), 'dd/MM/yyyy_HH-mm')}.pdf`;
      
      const pdfFile = new File([generatedPdfBlob], fileName, { type: 'application/pdf' });

      const path = `reports/${fileName}`;
      const fileUrl = await uploadFile(pdfFile, path);

      const url = URL.createObjectURL(generatedPdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("PDF gerado com sucesso!", {
        description: "O relatório da frota foi baixado para seu computador.",
      });
      onClose();
      if (onDownloadSuccess) {
        onDownloadSuccess(fileUrl);
      }

      logReportMutation.mutate({
        report_type: 'fleet_report',
        generated_by: user?.id || null,
        file_name: `relatorio-frota-${format(new Date(), 'dd/MM/yyyy_HH-mm')}.txt`,
        file_url: fileUrl,
        metadata: { vehicleCount: vehicles.length, sharedVia: 'pdf_download' },
      });

    } catch (error) {
      errorService.log("Error downloading or uploading PDF:", error);
      toast.error("Erro ao baixar PDF", {
        description: "Ocorreu um erro ao baixar ou salvar o arquivo PDF.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareWhatsapp = () => {
    if (!vehicles || vehicles.length === 0) {
      toast.info("Nenhum veículo encontrado", {
        description: "Não há veículos para compartilhar.",
      });
      return;
    }

    setIsSharingWhatsapp(true);
    try {
      const totalVehicles = vehicles.length;
      const vehiclesWithBlockerInstalled = vehicles.filter(v => v.blocker_installed === true).length;
      const vehiclesBlockerNotInstalledExplicitly = vehicles.filter(v => 
        v.blocker_installed === false && 
        !(v.raw_blocker_installed_text && /nao vai instalar/i.test(v.raw_blocker_installed_text))
      ).length;
      const vehiclesBlockerNotInstalling = vehicles.filter(v => 
        v.blocker_installed === false && 
        (v.raw_blocker_installed_text && /nao vai instalar/i.test(v.raw_blocker_installed_text))
      ).length;
      const vehiclesBlockerStatusUnknown = vehicles.filter(v => v.blocker_installed === null).length;

      const vehiclesByPriority: { [key: number]: Vehicle[] } = {
        1: vehicles.filter(v => v.priority === 1),
        2: vehicles.filter(v => v.priority === 2),
        3: vehicles.filter(v => v.priority === 3),
      };

      const getBlockerStatusLabel = (vehicle: Vehicle) => {
        if (vehicle.blocker_installed === true) return 'Instalado';
        if (vehicle.blocker_installed === false) {
          if (vehicle.raw_blocker_installed_text && /nao vai instalar/i.test(vehicle.raw_blocker_installed_text)) {
            return 'Não Vai Instalar';
          }
          return 'Não Instalado';
        }
        return 'Não Classificado';
      };

      const getPriorityLabel = (priority: number | null) => {
        switch (priority) {
          case 1: return 'Alta';
          case 2: return 'Média';
          case 3: return 'Baixa';
          default: return 'N/A';
        }
      };

      let message = `*Relatório de Estatísticas da Frota*\n`;
      message += `Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}\n\n`;
      message += `*Resumo Geral do Status do Bloqueador:*\n`;
      message += `Total de Veículos: ${totalVehicles}\n`;
      message += `Instalado: ${vehiclesWithBlockerInstalled} (${totalVehicles > 0 ? (vehiclesWithBlockerInstalled / totalVehicles * 100).toFixed(0) : 0}%)\n`;
      message += `Não Instalado: ${vehiclesBlockerNotInstalledExplicitly} (${totalVehicles > 0 ? (vehiclesBlockerNotInstalledExplicitly / totalVehicles * 100).toFixed(0) : 0}%)\n`;
      message += `Não Vai Instalar: ${vehiclesBlockerNotInstalling} (${totalVehicles > 0 ? (vehiclesBlockerNotInstalling / totalVehicles * 100).toFixed(0) : 0}%)\n`;
      message += `Não Classificado: ${vehiclesBlockerStatusUnknown} (${totalVehicles > 0 ? (vehiclesBlockerStatusUnknown / totalVehicles * 100).toFixed(0) : 0}%)\n\n`;
      message += `*Detalhes por Prioridade:*\n`;

      Object.keys(vehiclesByPriority).forEach(priorityKey => {
        const priorityNum = parseInt(priorityKey, 10);
        const priorityVehicles = vehiclesByPriority[priorityNum];
        const installedCount = priorityVehicles.filter(v => v.blocker_installed === true).length;
        const notInstalledCount = priorityVehicles.filter(v => v.blocker_installed === false && !(v.raw_blocker_installed_text && /nao vai instalar/i.test(v.raw_blocker_installed_text))).length;
        const notInstallingCount = priorityVehicles.filter(v => v.blocker_installed === false && (v.raw_blocker_installed_text && /nao vai instalar/i.test(v.raw_blocker_installed_text))).length;
        const unknownStatusCount = priorityVehicles.filter(v => v.blocker_installed === null).length;

        message += `\n*Prioridade ${priorityNum} (${getPriorityLabel(priorityNum)}) - ${priorityVehicles.length} Veículos*\n`;
        message += `  Instalado: ${installedCount}\n`;
        message += `  Não Instalado: ${notInstalledCount}\n`;
        message += `  Não Vai Instalar: ${notInstallingCount}\n`;
        message += `  Não Classificado: ${unknownStatusCount}\n`;

        const vehiclesWithOtherStatus = priorityVehicles.filter(v => v.blocker_installed === null || (v.blocker_installed === false && v.raw_blocker_installed_text && !(v.raw_blocker_installed_text?.toLowerCase().includes('não vai instalar') || v.raw_blocker_installed_text?.toLowerCase().includes('nao vai instalar')) && !(v.raw_blocker_installed_text?.toLowerCase().includes('não') || v.raw_blocker_installed_text?.toLowerCase().includes('nao'))));
        if (vehiclesWithOtherStatus.length > 0) {
          message += `  Veículos com Status Não Classificado ou Detalhes Adicionais:\n`;
          vehiclesWithOtherStatus.forEach(v => {
            message += `    - ${v.plate}: ${getBlockerStatusLabel(v)} (${v.raw_blocker_installed_text || 'N/A'})\n`;
          });
        }
      });

      message += `\n\nGerado pelo Sistema de Gestão Karne & Keijo.`;

      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

      toast.success("Relatório enviado para WhatsApp!", {
        description: "Uma nova janela/aba foi aberta para compartilhar o resumo.",
      });

      logReportMutation.mutate({
        report_type: 'fleet_report',
        generated_by: user?.id || null,
        file_name: `relatorio-frota-${format(new Date(), 'dd/MM/yyyy_HH-mm')}.txt`,
        metadata: { vehicleCount: vehicles.length, sharedVia: 'whatsapp' },
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full h-auto flex flex-col p-0 bg-card/20 backdrop-blur-md border border-border/50">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            Relatório de Estatísticas da Frota
          </DialogTitle>
          <DialogDescription className="text-foreground"> {/* Alterado para text-foreground */}
            O relatório foi gerado. Escolha como deseja visualizá-lo, baixá-lo ou compartilhá-lo.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 p-6 flex flex-col items-center justify-center relative min-h-[150px]">
          {isGeneratingPdf ? (
            <div className="flex flex-col items-center justify-center text-foreground"> {/* Alterado para text-foreground */}
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <span>Gerando PDF...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-foreground">
              <CheckCircle className="h-12 w-12 text-success mb-4" />
              <p className="text-lg font-semibold mb-2">PDF pronto!</p>
              <p className="text-sm text-foreground">Você pode abri-lo em uma nova aba, baixá-lo ou compartilhá-lo.</p> {/* Alterado para text-foreground */}
            </div>
          )}
        </div>
        <DialogFooter className="p-6 pt-4 border-t flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isDownloading || isSharingWhatsapp} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <Button
              onClick={handleShareWhatsapp}
              disabled={isGeneratingPdf || isSharingWhatsapp || isDownloading || vehicles.length === 0}
              className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto flex items-center gap-2"
            >
              {isSharingWhatsapp ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  Enviar WhatsApp
                </>
              )}
            </Button>
            <Button onClick={handleOpenPdfInNewTab} disabled={isGeneratingPdf || !generatedPdfBlob} className="w-full sm:w-auto flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Abrir PDF em Nova Aba
            </Button>
            <Button onClick={handleDownloadPdf} disabled={isGeneratingPdf || isDownloading || isSharingWhatsapp || !generatedPdfBlob} className="w-full sm:w-auto flex items-center gap-2">
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Baixando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Baixar PDF
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};