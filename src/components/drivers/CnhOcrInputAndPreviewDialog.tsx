"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scan, CheckCircle, X, Loader2, ArrowRight } from 'lucide-react';
import { CnhOcrButton } from './CnhOcrButton';
import { toast } from 'sonner';
import { format, parseISO, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import InputMask from 'react-input-mask';

interface CnhOcrInputAndPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOcrDataConfirmed: (cnhNumber: string, cnhExpiry: string, fullName: string) => void; // UPDATED: Adicionado fullName
}

export const CnhOcrInputAndPreviewDialog: React.FC<CnhOcrInputAndPreviewDialogProps> = ({
  isOpen,
  onClose,
  onOcrDataConfirmed,
}) => {
  const [cnhNumber, setCnhNumber] = useState<string>('');
  const [cnhExpiry, setCnhExpiry] = useState<string>('');
  const [fullName, setFullName] = useState<string>(''); // NEW: Estado para o nome completo
  const [ocrProcessed, setOcrProcessed] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleCnhExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Remove non-digits for parsing
    const digitsOnly = input.replace(/\D/g, '');

    // Apply mask for display: DD/MM/YYYY
    let formattedInput = '';
    if (digitsOnly.length > 0) {
      formattedInput = digitsOnly.substring(0, 2);
      if (digitsOnly.length > 2) {
        formattedInput += '/' + digitsOnly.substring(2, 4);
      }
      if (digitsOnly.length > 4) {
        formattedInput += '/' + digitsOnly.substring(4, 8);
      }
    }

    // Update the input field value directly for masked display
    e.target.value = formattedInput;

    // Parse to yyyy-MM-dd for internal state if valid
    if (digitsOnly.length === 8) {
      const day = digitsOnly.substring(0, 2);
      const month = digitsOnly.substring(2, 4);
      const year = digitsOnly.substring(4, 8);
      const isoDate = `${year}-${month}-${day}`;
      setCnhExpiry(isoDate);
    } else {
      setCnhExpiry(input); // Keep original input for partial or invalid dates
    }
  };

  const handleOcrComplete = (number: string, expiry: string, name: string) => { // UPDATED: Recebendo name
    setCnhNumber(number);
    setCnhExpiry(expiry);
    setFullName(name); // NEW: Definindo o nome completo
    setOcrProcessed(true);
  };

  const handleConfirm = () => {
    if (!cnhNumber || !cnhExpiry || !fullName) { // UPDATED: Validando fullName
      toast.error("Dados incompletos", {
        description: "Por favor, preencha o número da CNH, a data de validade e o nome completo.", // UPDATED: Mensagem mais detalhada
      });
      return;
    }
    setIsConfirming(true);
    onOcrDataConfirmed(cnhNumber, cnhExpiry, fullName); // UPDATED: Passando fullName
    onClose(); // Close this dialog
    setIsConfirming(false);
  };

  const handleCloseDialog = () => {
    setCnhNumber('');
    setCnhExpiry('');
    setFullName(''); // NEW: Limpando o nome completo
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
                <Label htmlFor="ocr-full-name">Nome Completo</Label> {/* NEW: Campo para nome completo */}
                <Input
                  id="ocr-full-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nome Completo do Motorista"
                />
              </div>
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
                  value={cnhExpiry ? format(parseISO(cnhExpiry), 'dd/MM/yyyy') : ''}
                  onChange={handleCnhExpiryChange}
                  placeholder="DD/MM/AAAA"
                  maxLength={10} // DD/MM/YYYY
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
            <Button onClick={handleConfirm} disabled={isConfirming || !cnhNumber || !cnhExpiry || !fullName}> {/* UPDATED: Desabilitar se fullName estiver vazio */}
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