import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText } from "lucide-react";

interface FinalReportSectionProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
}

export const FinalReportSection: React.FC<FinalReportSectionProps> = ({
  formData,
  handleInputChange,
}) => {
  return (
    <div className="rounded-lg border bg-card p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Laudo Final Consolidado</h2>
          <p className="text-sm text-muted-foreground">Resumo e conclusões finais</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Resumo Omnilink</Label>
          <Textarea
            placeholder="Resumo do status Omnilink..."
            value={formData.omnilinkSummary}
            onChange={(e) => handleInputChange("omnilinkSummary", e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Resumo do Condutor</Label>
          <Textarea
            placeholder="Resumo da avaliação do condutor..."
            value={formData.driverSummary}
            onChange={(e) => handleInputChange("driverSummary", e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Resumo Rastreamento</Label>
          <Textarea
            placeholder="Resumo do rastreamento..."
            value={formData.trackingSummary}
            onChange={(e) => handleInputChange("trackingSummary", e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Resumo da Carga</Label>
          <Textarea
            placeholder="Resumo das informações da carga..."
            value={formData.cargoSummary}
            onChange={(e) => handleInputChange("cargoSummary", e.target.value)}
            className="min-h-[100px]"
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">Resumo Monitoramento de Risco</Label>
        <Textarea
          placeholder="Resumo do monitoramento de risco..."
          value={formData.riskSummary}
          onChange={(e) => handleInputChange("riskSummary", e.target.value)}
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">Conclusão Geral</Label>
        <Select value={formData.finalConclusion} onValueChange={(value) => handleInputChange("finalConclusion", value)}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Selecione a conclusão" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="baixo">Baixo Impacto</SelectItem>
            <SelectItem value="moderado">Moderado</SelectItem>
            <SelectItem value="grave">Grave</SelectItem>
            <SelectItem value="gravissimo">Gravíssimo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">Recomendações e Análise Final</Label>
        <Textarea
          placeholder="Recomendações do analista e análise final..."
          value={formData.recommendations}
          onChange={(e) => handleInputChange("recommendations", e.target.value)}
          className="min-h-[120px]"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">Nome do Analista Responsável</Label>
        <Input
          placeholder="Nome completo do analista"
          value={formData.analystName}
          onChange={(e) => handleInputChange("analystName", e.target.value)}
          className="h-11"
        />
      </div>
    </div>
  );
};