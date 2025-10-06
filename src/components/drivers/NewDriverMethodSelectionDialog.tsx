"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Scan, UserPlus, X } from 'lucide-react';

interface NewDriverMethodSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectManual: () => void;
  onSelectOcr: () => void;
}

export const NewDriverMethodSelectionDialog: React.FC<NewDriverMethodSelectionDialogProps> = ({
  isOpen,
  onClose,
  onSelectManual,
  onSelectOcr,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card/20 backdrop-blur-md border border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Cadastrar Novo Motorista
          </DialogTitle>
          <DialogDescription>
            Escolha como deseja cadastrar o novo motorista.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            onClick={onSelectManual}
            className="w-full flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Cadastrar Manualmente
          </Button>
          <Button
            onClick={onSelectOcr}
            variant="outline"
            className="w-full flex items-center gap-2"
          >
            <Scan className="h-4 w-4" />
            Cadastrar com OCR (CNH)
          </Button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};