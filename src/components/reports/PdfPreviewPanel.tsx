import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Download, X, ExternalLink, ZoomIn, ZoomOut, RotateCw, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createRoot } from 'react-dom/client';
import { errorService } from '@/services/errorService';
import { DriverReportPDFLayout } from './DriverReportPDFLayout';
import { VehicleReportPDFLayout } from './VehicleReportPDFLayout'; // NEW IMPORT
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { uploadFile } from '@/integrations/supabase/storage';
import { PdfPreviewControls } from '@/components/ui/pdf-preview-controls';
import { CheckCircle } from 'lucide-react';

type Driver = Tables<'drivers'>;
import { Vehicle } from '@/types/vehicles'; // NEW IMPORT

interface PdfPreviewPanelProps {
  generatedPdfBlob: Blob | null;
  drivers?: Driver[];
  vehicles?: Vehicle[]; // NEW PROP
  startDate?: Date;
  endDate?: Date;
  onDownloadSuccess?: (fileUrl: string) => void;
  onClosePreview: () => void; // New prop to close the preview
}

export const PdfPreviewPanel: React.FC<PdfPreviewPanelProps> = ({
  generatedPdfBlob: initialGeneratedPdfBlob,
  drivers,
  vehicles, // NEW PROP
  startDate,
  endDate,
  onDownloadSuccess,
  onClosePreview,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<Blob | null>(initialGeneratedPdfBlob);
  const [zoom, setZoom] = useState(1.0);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2.0));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleZoomReset = () => {
    setZoom(1.0);
    setOffsetX(0);
    setOffsetY(0);
  };

  useEffect(() => {
    setGeneratedPdfBlob(initialGeneratedPdfBlob);
    if (!initialGeneratedPdfBlob && (drivers && drivers.length > 0 || vehicles && vehicles.length > 0)) {
      generatePdfBlob();
    }
  }, [initialGeneratedPdfBlob, drivers, vehicles, startDate, endDate]);

  const generatePdfBlob = async () => {
    setIsGeneratingPdf(true);
    setGeneratedPdfBlob(null);

    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '210mm';
    tempDiv.style.transform = `scale(${zoom})`;
    tempDiv.style.transformOrigin = 'top left';
    document.body.appendChild(tempDiv);

    const root = createRoot(tempDiv);
    let resolveRenderPromise: () => void = () => {};
    const renderPromise = new Promise<void>(resolve => {
      resolveRenderPromise = resolve;
    });

    if (drivers && drivers.length > 0) {
      root.render(
        <DriverReportPDFLayout
          drivers={drivers}
          startDate={startDate}
          endDate={endDate}
          onRenderComplete={resolveRenderPromise}
        />
      );
    } else if (vehicles && vehicles.length > 0) {
      root.render(
        <VehicleReportPDFLayout
          vehicles={vehicles}
          startDate={startDate}
          endDate={endDate}
          filterType="all"
          onRenderComplete={resolveRenderPromise}
        />
      );
    } else {
      // Handle case where neither drivers nor vehicles are provided
      errorService.log("No data provided for PDF generation.");
      resolveRenderPromise(); // Resolve to prevent hanging
    }

    await renderPromise;
    await new Promise(resolve => setTimeout(resolve, 200));

    try {
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
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

      toast.error("Erro na geração do PDF", {
        description: "Não foi possível gerar o arquivo PDF.",
      });
    } finally {
      root.unmount();
      document.body.removeChild(tempDiv);
      setIsGeneratingPdf(false);
    }
  };

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
      const fileName = `relatorio-motoristas-${format(startDate || new Date(), 'dd/MM/yyyy')}-${format(endDate || new Date(), 'dd/MM/yyyy')}.pdf`;
      
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
      if (onDownloadSuccess) {
        onDownloadSuccess(fileUrl);
      }
    } catch (error) {

      toast.error("Erro ao baixar PDF", {
        description: "Ocorreu um erro ao baixar ou salvar o arquivo PDF.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className="modern-card flex flex-col h-full">
      <CardHeader className="p-6 pb-4 border-b flex flex-row items-center justify-between">
        <div className="flex items-center">
          <CardTitle>Pré-visualização do PDF</CardTitle>
          <PdfPreviewControls
            zoom={zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onReset={handleZoomReset}
            className="ml-4"
          />
        </div>
        <Button variant="ghost" size="icon" onClick={onClosePreview}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 p-6 flex flex-col items-center justify-center relative min-h-[300px]">
        {isGeneratingPdf ? (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <span>Gerando PDF...</span>
          </div>
        ) : generatedPdfBlob ? (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-md border border-border/50">
            <div
              className="absolute inset-0 cursor-grab"
              onMouseDown={(e) => {
                setIsDragging(true);
                setStartX(e.clientX - offsetX);
                setStartY(e.clientY - offsetY);
              }}
              onMouseMove={(e) => {
                if (!isDragging) return;
                setOffsetX(e.clientX - startX);
                setOffsetY(e.clientY - startY);
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
            >
              <iframe
                src={URL.createObjectURL(generatedPdfBlob)}
                width="100%"
                height="100%"
                style={{
                  transform: `scale(${zoom}) translate(${offsetX}px, ${offsetY}px)`,
                  transformOrigin: 'top left',
                  border: 'none',
                  pointerEvents: 'none', // Adicionado para permitir arrastar o elemento pai
                }}
                title="Pré-visualização do PDF"
              />
            </div>
            {/* <div className="absolute inset-0 pointer-events-none" /> Removido, pois o pointer-events: none foi movido para o iframe */}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground text-center">
            <FileText className="h-12 w-12 mb-3" />
            <span>Nenhum PDF gerado para pré-visualização.</span>
            <span>Gere um relatório para visualizar o PDF aqui.</span>
          </div>
        )}
      </CardContent>
      <div className="p-6 pt-4 border-t flex justify-end space-x-2">
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
      </div>
    </Card>
  );
};