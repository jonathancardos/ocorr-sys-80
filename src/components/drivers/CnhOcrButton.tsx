"use client";

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Loader2, Scan } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client'; // Import supabase client for Edge Function call

interface CnhOcrButtonProps {
  onOcrComplete: (cnhNumber: string, cnhExpiry: string, fullName: string) => void; // UPDATED: Adicionado fullName
  disabled?: boolean;
}

export const CnhOcrButton = React.forwardRef<HTMLDivElement, CnhOcrButtonProps>(({ onOcrComplete, disabled }, ref) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error("Formato de arquivo inválido", {
        description: "Por favor, selecione um arquivo de imagem (JPG, PNG, etc.).",
      });
      return;
    }

    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        // Call the Supabase Edge Function
        const edgeFunctionUrl = `https://iywrcosymxjynxspzjmi.supabase.co/functions/v1/ocr-cnh`; // Replace with your project ID

        const response = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // No Authorization header needed for anonymous Edge Function,
            // but if it were protected, you'd add:
            // 'Authorization': `Bearer ${supabase.auth.session()?.access_token}`,
          },
          body: JSON.stringify({ imageData: base64data }),
        });

        const responseData = await response.json();

        if (!response.ok || responseData.error) {
          throw new Error(responseData.error || 'Falha ao processar OCR via Edge Function');
        }

        const { cnhData } = responseData;
        if (cnhData && cnhData.cnh_number && cnhData.cnh_expiry_date && cnhData.full_name) { // UPDATED: Verificando full_name
          onOcrComplete(cnhData.cnh_number, cnhData.cnh_expiry_date, cnhData.full_name); // UPDATED: Passando full_name
          toast.success("OCR concluído!", {
            description: "Dados da CNH preenchidos automaticamente.",
          });
        } else {
          throw new Error("Dados da CNH (número, validade ou nome) não encontrados na resposta do OCR."); // UPDATED: Mensagem de erro mais detalhada
        }
      };
      reader.onerror = (error) => {
        throw new Error(`Erro ao ler o arquivo: ${error}`);
      };

    } catch (error: any) {
      console.error('Erro no OCR da CNH:', error);
      toast.error("Erro no OCR da CNH", {
        description: error.message || "Não foi possível extrair os dados da CNH.",
      });
    } finally {
      setIsLoading(false);
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div ref={ref} className="flex items-center gap-2">
      <Input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        disabled={isLoading || disabled}
      />
      <Button
        type="button"
        variant="outline"
        onClick={handleButtonClick}
        disabled={isLoading || disabled}
        className="flex items-center gap-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Scan className="h-4 w-4" />
        )}
        OCR CNH
      </Button>
    </div>
  );
});

CnhOcrButton.displayName = "CnhOcrButton";