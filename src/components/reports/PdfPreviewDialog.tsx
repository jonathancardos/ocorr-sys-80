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
import { Slider } from '@/components/ui/slider'; // Importar Slider

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
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1.0); // Estado para o nível de zoom
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsGeneratingPdf(true);
      setGeneratedPdfBlob(null);
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
      return;
    }

    const generatePdfBlob = async () => {
      setIsGeneratingPdf(true);
      setGeneratedPdfBlob(null);
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }

      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '210mm'; // A4 width
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
      await new Promise(resolve => setTimeout(resolve, 200)); // Give some time for layout to settle

      try {
        const canvas = await html2canvas(tempDiv, {
          scale: 2, // Increased scale for better resolution
          useCORS: true,
          windowWidth: tempDiv.scrollWidth,
          windowHeight: tempDiv.scrollHeight,
          x: 0,
          y: 0,
          width: tempDiv.offsetWidth,
          height: tempDiv.offsetHeight,
          scrollX: -window.scrollX,
          scrollY: -window.scrollY,
        });

        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png');
        const margin = 5; // 5mm margin on all sides
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const contentWidth = pdfWidth - (margin * 2);
        const contentHeight = pdfHeight - (margin * 2);
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let yOffset = 0; // Y offset for the canvas image

        while (heightLeft > 0) {
          if (yOffset > 0) {
            pdf.addPage();
          }

          const pageHeight = pdfHeight - (margin * 2); // Usable height for content on each page
          const sHeight = Math.min(heightLeft, pageHeight); // Height of the slice to take from the canvas

          pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, sHeight, undefined, 'FAST', 0, yOffset);

          // Add footer to each page
          pdf.setFontSize(8);
          pdf.setTextColor(150);
          const footerText = `Gerado em ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} pelo Sistema de Gestão Karne & Keijo.`;
          const textWidth = pdf.getStringUnitWidth(footerText) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
          const centerX = (pdf.internal.pageSize.getWidth() - textWidth) / 2;
          pdf.text(footerText, centerX, pdf.internal.pageSize.getHeight() - margin);

          heightLeft -= sHeight;
          yOffset += sHeight;
        }
        const blob = pdf.output('blob');
        setGeneratedPdfBlob(blob);
        setPdfUrl(URL.createObjectURL(blob));

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
      <DialogContent className="max-w-2xl w-full h-auto flex flex-col p-0 bg-card shadow-lg border">
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
            <div className="flex flex-col w-full h-full">
              <div className="flex items-center justify-center mb-4 space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}
                >
                  Zoom Out
                </Button>
                <Slider
                  value={[zoomLevel]}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  onValueChange={(value) => setZoomLevel(value[0])}
                  className="w-[150px]"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(prev => Math.min(2.0, prev + 0.1))}
                >
                  Zoom In
                </Button>
                <span className="text-sm text-muted-foreground">{(zoomLevel * 100).toFixed(0)}%</span>
              </div>
              {pdfUrl && (
                <div className="overflow-auto w-full h-[500px] border rounded-md">
                  <iframe
                    ref={iframeRef}
                    src={pdfUrl}
                    width={`${100 * zoomLevel}%`}
                    height={`${500 * zoomLevel}px`}
                    style={{ border: 'none' }}
                    title="Pré-visualização do PDF"
                  />
                </div>
              )}
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