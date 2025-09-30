import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Package } from "lucide-react";

interface CargoEvaluationSectionProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
}

export const CargoEvaluationSection: React.FC<CargoEvaluationSectionProps> = ({
  formData,
  handleInputChange,
}) => {
  return (
    <div className="rounded-lg border bg-card p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Package className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Apuração da Carga</h2>
          <p className="text-sm text-muted-foreground">Informações sobre a carga transportada</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Valor Total da Carga (R$)</Label>
          <Input
            placeholder="0,00"
            value={formData.totalCargoValue}
            onChange={(e) => handleInputChange("totalCargoValue", e.target.value)}
            className="h-11"
          />
        </div>
        
        <div className="space-y-3">
          <Label className="text-sm font-medium">Valor da Carga Furtada (R$)</Label>
          <Input
            placeholder="0,00"
            value={formData.stolenCargoValue}
            onChange={(e) => handleInputChange("stolenCargoValue", e.target.value)}
            className="h-11"
          />
        </div>

        <div className="md:col-span-2 space-y-3">
          <Label className="text-sm font-medium">Observações da Carga</Label>
          <Textarea
            placeholder="Observações adicionais sobre a carga..."
            value={formData.cargoObservations}
            onChange={(e) => handleInputChange("cargoObservations", e.target.value)}
            className="min-h-[120px]"
          />
        </div>
      </div>
    </div>
  );
};