import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Download, X, ExternalLink } from 'lucide-react'; // Adicionado ExternalLink
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createRoot } from 'react-dom/client';
import { DriverReportPDFLayout } from './DriverReportPDFLayout';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { uploadFile } from '@/integrations/supabase/storage';

type Driver = Tables<'drivers'>;

interface PdfPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  drivers: Driver[];
  startDate?: Date;
  endDate?: Date;
  onDownloadSuccess?: (fileUrl: string) => void;
}

export const PdfPreviewDialog: React.FC<PdfPreviewDialogProps> = ({
  isOpen,
  onClose,
  drivers,
  startDate,
  endDate,
  onDownloadSuccess,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<Blob | null>(null);

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
        <DriverReportPDFLayout
          drivers={drivers}
          startDate={startDate}
          endDate={endDate}
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
        console.error("Error generating PDF blob:", error);
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
  }, [isOpen, drivers, startDate, endDate]);

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
      const fileName = `relatorio-motoristas-${format(startDate || new Date(), 'dd-MM-yyyy')}-${format(endDate || new Date(), 'dd-MM-yyyy')}.pdf`;
      
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
        description: "O relatório de motoristas foi baixado para seu computador.",
      });
      onClose();
      if (onDownloadSuccess) {
        onDownloadSuccess(fileUrl);
      }
    } catch (error) {
      console.error("Error downloading or uploading PDF:", error);
      toast.error("Erro ao baixar PDF", {
        description: "Ocorreu um erro ao baixar ou salvar o arquivo PDF.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full h-auto flex flex-col p-0 bg-card/20 backdrop-blur-md border border-border/50">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>Relatório de Motoristas</DialogTitle>
          <DialogDescription>
            O relatório foi gerado. Escolha como deseja visualizá-lo ou baixá-lo.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 p-6 flex flex-col items-center justify-center relative min-h-[150px]">
          {isGeneratingPdf ? (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <span>Gerando PDF...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-foreground">
              <CheckCircle className="h-12 w-12 text-success mb-4" />
              <p className="text-lg font-semibold mb-2">PDF pronto!</p>
              <p className="text-sm text-muted-foreground">Você pode abri-lo em uma nova aba ou baixá-lo.</p>
            </div>
          )}
        </div>
        <DialogFooter className="p-6 pt-4 border-t flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isDownloading}>
            Cancelar
          </Button>
          <Button onClick={handleOpenPdfInNewTab} disabled={isGeneratingPdf || !generatedPdfBlob}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir PDF em Nova Aba
          </Button>
          <Button onClick={handleDownloadPdf} disabled={isGeneratingPdf || isDownloading || !generatedPdfBlob}>
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Baixando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Baixar PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};