import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Download, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createRoot } from 'react-dom/client';
import { DriverReportPDFLayout } from './DriverReportPDFLayout';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Driver = Tables<'drivers'>;

interface PdfPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  drivers: Driver[];
  startDate?: Date;
  endDate?: Date;
}

export const PdfPreviewDialog: React.FC<PdfPreviewDialogProps> = ({
  isOpen,
  onClose,
  drivers,
  startDate,
  endDate,
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const pdfContentRef = useRef<HTMLDivElement>(null); // Ref for the div that will hold the PDF layout

  useEffect(() => {
    if (!isOpen) {
      setPreviewImage(null);
      setIsGeneratingPreview(true);
      return;
    }

    const generatePreview = async () => {
      setIsGeneratingPreview(true);
      setPreviewImage(null);

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
      await new Promise(resolve => setTimeout(resolve, 200)); // Small additional delay for images/styles

      try {
        const canvas = await html2canvas(tempDiv, {
          scale: 2, // Increase scale for better quality
          useCORS: true, // Important for images from external sources if any
        });
        setPreviewImage(canvas.toDataURL('image/png'));
      } catch (error) {
        console.error("Error generating preview image:", error);
        toast.error("Erro na pré-visualização", {
          description: "Não foi possível gerar a imagem de pré-visualização do PDF.",
        });
      } finally {
        root.unmount();
        document.body.removeChild(tempDiv);
        setIsGeneratingPreview(false);
      }
    };

    generatePreview();
  }, [isOpen, drivers, startDate, endDate]);

  const handleDownloadPdf = async () => {
    if (!previewImage) {
      toast.error("Erro ao baixar PDF", {
        description: "A imagem de pré-visualização não está disponível.",
      });
      return;
    }

    setIsDownloading(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (pdfContentRef.current?.offsetHeight || 0) * imgWidth / (pdfContentRef.current?.offsetWidth || 1); // Estimate height based on rendered content
      
      // Fallback if ref is not available or dimensions are zero
      const finalImgHeight = imgHeight > 0 ? imgHeight : (297 * imgWidth) / 210; // Default to A4 aspect ratio if calculation fails

      let heightLeft = finalImgHeight;
      let position = 0;

      pdf.addImage(previewImage, 'PNG', 0, position, imgWidth, finalImgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - finalImgHeight;
        pdf.addPage();
        pdf.addImage(previewImage, 'PNG', 0, position, imgWidth, finalImgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`relatorio-motoristas-${format(startDate || new Date(), 'dd-MM-yyyy')}-${format(endDate || new Date(), 'dd-MM-yyyy')}.pdf`);
      toast.success("PDF gerado com sucesso!", {
        description: "O relatório de motoristas foi baixado para seu computador.",
      });
      onClose();
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Erro ao baixar PDF", {
        description: "Ocorreu um erro ao baixar o arquivo PDF.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>Pré-visualização do Relatório de Motoristas</DialogTitle>
          <DialogDescription>
            Verifique o relatório antes de baixar.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto bg-gray-100 p-4 flex items-center justify-center">
          {isGeneratingPreview ? (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <span>Gerando pré-visualização...</span>
            </div>
          ) : previewImage ? (
            <div ref={pdfContentRef} className="w-[210mm] h-auto shadow-lg border border-gray-300 bg-white">
              <img src={previewImage} alt="Pré-visualização do PDF" className="w-full h-auto block" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-destructive">
              <X className="h-8 w-8 mb-3" />
              <span>Não foi possível carregar a pré-visualização.</span>
            </div>
          )}
        </div>
        <DialogFooter className="p-6 pt-4 border-t flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isDownloading}>
            Cancelar
          </Button>
          <Button onClick={handleDownloadPdf} disabled={isGeneratingPreview || isDownloading || !previewImage}>
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