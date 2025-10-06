import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MapPin } from "lucide-react";

interface TrackingReportSectionProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
}

export const TrackingReportSection: React.FC<TrackingReportSectionProps> = ({
  formData,
  handleInputChange,
}) => {
  return (
    <div className="rounded-lg border bg-card p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <MapPin className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Laudo Siga+ (Rastreamento)</h2>
          <p className="text-sm text-muted-foreground">Informações do sistema de rastreamento</p>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Perda de sinal de rastreamento?</Label>
          <RadioGroup
            value={formData.signalLoss}
            onValueChange={(value: "yes" | "no") => handleInputChange("signalLoss", value)}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="signalLoss-yes" />
              <Label htmlFor="signalLoss-yes">Sim</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="signalLoss-no" />
              <Label htmlFor="signalLoss-no">Não</Label>
            </div>
          </RadioGroup>
        </div>

        {formData.signalLoss === "yes" && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tempo de ausência do sinal</Label>
            <Input
              placeholder="Ex: 15 minutos"
              value={formData.signalLossTime}
              onChange={(e) => handleInputChange("signalLossTime", e.target.value)}
              className="h-11"
            />
          </div>
        )}

        <div className="space-y-3">
          <Label className="text-sm font-medium">Parada em local não programado?</Label>
          <RadioGroup
            value={formData.unauthorizedStop}
            onValueChange={(value: "yes" | "no") => handleInputChange("unauthorizedStop", value)}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="unauthorizedStop-yes" />
              <Label htmlFor="unauthorizedStop-yes">Sim</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="unauthorizedStop-no" />
              <Label htmlFor="unauthorizedStop-no">Não</Label>
            </div>
          </RadioGroup>
        </div>

        {formData.unauthorizedStop === "yes" && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Local da parada</Label>
            <Input
              placeholder="Descreva o local..."
              value={formData.unauthorizedStopLocation}
              onChange={(e) => handleInputChange("unauthorizedStopLocation", e.target.value)}
              className="h-11"
            />
          </div>
        )}

        <div className="space-y-3">
          <Label className="text-sm font-medium">Parada prolongada em local de risco/não autorizado?</Label>
          <RadioGroup
            value={formData.prolongedStop}
            onValueChange={(value: "yes" | "no") => handleInputChange("prolongedStop", value)}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="prolongedStop-yes" />
              <Label htmlFor="prolongedStop-yes">Sim</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="prolongedStop-no" />
              <Label htmlFor="prolongedStop-no">Não</Label>
            </div>
          </RadioGroup>
        </div>

        {formData.prolongedStop === "yes" && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Tempo parado</Label>
              <Input
                placeholder="Ex: 30 minutos"
                value={formData.prolongedStopTime}
                onChange={(e) => handleInputChange("prolongedStopTime", e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium">Justificativa do motorista</Label>
              <Input
                placeholder="Justificativa..."
                value={formData.prolongedStopJustification}
                onChange={(e) => handleInputChange("prolongedStopJustification", e.target.value)}
                className="h-11"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};