import React from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Shield } from "lucide-react";

interface OmnilinkReportSectionProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
}

export const OmnilinkReportSection: React.FC<OmnilinkReportSectionProps> = ({
  formData,
  handleInputChange,
}) => {
  return (
    <div className="rounded-lg border bg-card p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Laudo Omnilink (Gestor)</h2>
          <p className="text-sm text-muted-foreground">Status de aptidão do motorista e veredito do analista</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Motorista Apto?</Label>
          <RadioGroup
            value={formData.omnilinkStatus}
            onValueChange={(value: "yes" | "no") => handleInputChange("omnilinkStatus", value)}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="omnilinkStatus-yes" />
              <Label htmlFor="omnilinkStatus-yes">Sim</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="omnilinkStatus-no" />
              <Label htmlFor="omnilinkStatus-no">Não</Label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="md:col-span-2 space-y-3">
          <Label className="text-sm font-medium">Observações Omnilink</Label>
          <Textarea
            placeholder="Observações sobre o status Omnilink..."
            value={formData.omnilinkObservations}
            onChange={(e) => handleInputChange("omnilinkObservations", e.target.value)}
            className="min-h-[120px]"
          />
        </div>

        <div className="md:col-span-2 space-y-3">
          <Label className="text-sm font-medium">Veredito do Analista (Culpa/Não Culpa)</Label>
          <Textarea
            placeholder="O analista deve dar um veredito se houve culpa mediante a situação..."
            value={formData.omnilinkAnalystVerdict}
            onChange={(e) => handleInputChange("omnilinkAnalystVerdict", e.target.value)}
            className="min-h-[120px]"
          />
        </div>
      </div>
    </div>
  );
};