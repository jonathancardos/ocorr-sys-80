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
import { supabase } from '@/integrations/supabase/client'; // Import supabase client
import { uploadFile } from '@/integrations/supabase/storage'; // Import uploadFile

type Driver = Tables<'drivers'>;

interface PdfPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  drivers: Driver[];
  startDate?: Date;
  endDate?: Date;
  onDownloadSuccess?: (fileUrl: string) => void; // Modified to pass fileUrl
}

export const PdfPreviewDialog: React.FC<PdfPreviewDialogProps> = ({
  isOpen,
  onClose,
  drivers,
  startDate,
  endDate,
  onDownloadSuccess,
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewDimensions, setPreviewDimensions] = useState<{ width: number; height: number } | null>(null); // Store dimensions
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<Blob | null>(null); // Store the PDF Blob

  useEffect(() => {
    if (!isOpen) {
      setPreviewImage(null);
      setPreviewDimensions(null);
      setIsGeneratingPreview(true);
      setGeneratedPdfBlob(null); // Clear blob on close
      return;
    }

    const generatePreview = async () => {
      setIsGeneratingPreview(true);
      setPreviewImage(null);
      setPreviewDimensions(null);
      setGeneratedPdfBlob(null);

      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px'; // Render off-screen
      tempDiv.style.width = '210mm'; // A4 width for consistent rendering
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
          windowWidth: tempDiv.scrollWidth, // Ensure full width is captured
          windowHeight: tempDiv.scrollHeight, // Ensure full height is captured
          x: 0,
          y: 0,
          width: tempDiv.offsetWidth,
          height: tempDiv.offsetHeight,
        });
        setPreviewImage(canvas.toDataURL('image/png'));
        setPreviewDimensions({ width: canvas.width, height: canvas.height }); // Store actual canvas dimensions

        // Generate PDF and store its blob for later download/upload
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 295; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, position, imgWidth, imgHeight); // Use JPEG for smaller file size
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        setGeneratedPdfBlob(pdf.output('blob')); // Store the PDF as a Blob

      } catch (error) {
        console.error("Error generating preview image or PDF blob:", error);
        toast.error("Erro na pré-visualização", {
          description: "Não foi possível gerar a imagem de pré-visualização ou o PDF.",
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
    if (!generatedPdfBlob || !previewDimensions) {
      toast.error("Erro ao baixar PDF", {
        description: "O PDF não está disponível para download.",
      });
      return;
    }

    setIsDownloading(true);
    try {
      const fileName = `relatorio-motoristas-${format(startDate || new Date(), 'dd-MM-yyyy')}-${format(endDate || new Date(), 'dd-MM-yyyy')}.pdf`;
      
      // Create a File object from the Blob
      const pdfFile = new File([generatedPdfBlob], fileName, { type: 'application/pdf' });

      // Upload the PDF to Supabase Storage
      const path = `reports/${fileName}`; // Define a path in your storage bucket
      const fileUrl = await uploadFile(pdfFile, path);

      // Trigger download in the browser
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
        onDownloadSuccess(fileUrl); // Pass the uploaded file URL
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
      <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col p-0 bg-card/20 backdrop-blur-md border border-border/50"> {/* Adjusted transparency */}
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
            <div className="max-w-full h-auto shadow-lg border border-gray-300 bg-white">
              <img src={previewImage} alt="Pré-visualização do PDF" className="max-w-full max-h-full object-contain block" />
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
          <Button onClick={handleDownloadPdf} disabled={isGeneratingPreview || isDownloading || !generatedPdfBlob}>
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