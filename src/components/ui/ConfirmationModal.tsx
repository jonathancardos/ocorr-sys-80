import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSaveDraft?: () => void; // Optional for saving draft
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  saveDraftText?: string; // Optional for saving draft button text
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onSaveDraft,
  title,
  description,
  confirmText = "Sim, cancelar",
  cancelText = "Não, continuar editando",
  saveDraftText = "Salvar rascunho",
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onClose} className="mt-0">
            {cancelText}
          </AlertDialogCancel>
          {onSaveDraft && (
            <Button variant="secondary" onClick={onSaveDraft}>
              {saveDraftText}
            </Button>
          )}
          <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90">
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};