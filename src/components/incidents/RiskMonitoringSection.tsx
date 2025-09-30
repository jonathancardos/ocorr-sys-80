import React from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircleIcon } from "lucide-react";

interface RiskMonitoringSectionProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
}

export const RiskMonitoringSection: React.FC<RiskMonitoringSectionProps> = ({
  formData,
  handleInputChange,
}) => {
  return (
    <div className="rounded-lg border bg-card p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <AlertCircleIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Monitoramento de Risco</h2>
          <p className="text-sm text-muted-foreground">Relatórios e análises de risco</p>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Observações de Risco</Label>
          <Textarea
            placeholder="Observações sobre monitoramento de risco, alertas, análises..."
            value={formData.riskObservations}
            onChange={(e) => handleInputChange("riskObservations", e.target.value)}
            className="min-h-[120px]"
          />
        </div>
      </div>
    </div>
  );
};