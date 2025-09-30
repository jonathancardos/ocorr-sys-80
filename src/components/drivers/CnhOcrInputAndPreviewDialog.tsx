"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scan, CheckCircle, X, Loader2, ArrowRight } from 'lucide-react';
import { CnhOcrButton } from './CnhOcrButton';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CnhOcrInputAndPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOcrDataConfirmed: (cnhNumber: string, cnhExpiry: string) => void;
}

export const CnhOcrInputAndPreviewDialog: React.FC<CnhOcrInputAndPreviewDialogProps> = ({
  isOpen,
  onClose,
  onOcrDataConfirmed,
}) => {
  const [cnhNumber, setCnhNumber] = useState<string>('');
  const [cnhExpiry, setCnhExpiry] = useState<string>('');
  const [ocrProcessed, setOcrProcessed] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleOcrComplete = (number: string, expiry: string) => {
    setCnhNumber(number);
    setCnhExpiry(expiry);
    setOcrProcessed(true);
  };

  const handleConfirm = () => {
    if (!cnhNumber || !cnhExpiry) {
      toast.error("Dados incompletos", {
        description: "Por favor, preencha o número da CNH e a data de validade.",
      });
      return;
    }
    setIsConfirming(true);
    onOcrDataConfirmed(cnhNumber, cnhExpiry);
    onClose(); // Close this dialog
    setIsConfirming(false);
  };

  const handleCloseDialog = () => {
    setCnhNumber('');
    setCnhExpiry('');
    setOcrProcessed(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-[500px] bg-card/20 backdrop-blur-md border border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5 text-primary" />
            Cadastro com OCR (CNH)
          </DialogTitle>
          <DialogDescription>
            Use a câmera ou faça upload de uma imagem da CNH para extrair os dados automaticamente.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {!ocrProcessed ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <p className="text-muted-foreground text-sm">
                Clique no botão abaixo para iniciar o processo de OCR.
              </p>
              <CnhOcrButton onOcrComplete={handleOcrComplete} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center text-success">
                <CheckCircle className="h-8 w-8 mr-2" />
                <span className="text-lg font-semibold">Dados extraídos com sucesso!</span>
              </div>
              <p className="text-muted-foreground text-sm text-center">
                Revise os dados abaixo e, se estiverem corretos, clique em "Continuar para Cadastro".
              </p>
              <div className="space-y-2">
                <Label htmlFor="ocr-cnh-number">Número da CNH</Label>
                <Input
                  id="ocr-cnh-number"
                  value={cnhNumber}
                  onChange={(e) => setCnhNumber(e.target.value)}
                  placeholder="Número da CNH"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ocr-cnh-expiry">Validade da CNH</Label>
                <Input
                  id="ocr-cnh-expiry"
                  type="date"
                  value={cnhExpiry}
                  onChange={(e) => setCnhExpiry(e.target.value)}
                  placeholder="YYYY-MM-DD"
                />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCloseDialog} disabled={isConfirming}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          {ocrProcessed && (
            <Button onClick={handleConfirm} disabled={isConfirming || !cnhNumber || !cnhExpiry}>
              {isConfirming ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              Continuar para Cadastro
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};