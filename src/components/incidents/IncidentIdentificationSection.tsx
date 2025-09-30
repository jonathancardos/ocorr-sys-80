import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "lucide-react";

interface IncidentIdentificationSectionProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
  isIncidentNumberLoading: boolean;
}

export const IncidentIdentificationSection: React.FC<IncidentIdentificationSectionProps> = ({
  formData,
  handleInputChange,
  isIncidentNumberLoading,
}) => {
  return (
    <div className="rounded-lg border bg-card p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Identificação da Ocorrência</h2>
          <p className="text-sm text-muted-foreground">Informações básicas sobre a ocorrência e registro policial</p>
        </div>
      </div>
      
      <div className="space-y-8">
        {/* Sub-seção: Detalhes da Ocorrência */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Detalhes da Ocorrência</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="incidentNumber" className="text-sm font-medium">
                Nº da Ocorrência <span className="text-destructive">*</span>
              </Label>
              <Input
                id="incidentNumber"
                placeholder="Ex: OC001"
                value={isIncidentNumberLoading ? "Carregando..." : formData.incidentNumber}
                onChange={(e) => handleInputChange("incidentNumber", e.target.value)}
                className="h-11"
                disabled={isIncidentNumberLoading}
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="incidentDate" className="text-sm font-medium">
                Data da Ocorrência <span className="text-destructive">*</span>
              </Label>
              <Input
                id="incidentDate"
                type="date"
                value={formData.incidentDate}
                onChange={(e) => handleInputChange("incidentDate", e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="incidentTime" className="text-sm font-medium">
                Horário da Ocorrência <span className="text-destructive">*</span>
              </Label>
              <Input
                id="incidentTime"
                type="time"
                value={formData.incidentTime}
                onChange={(e) => handleInputChange("incidentTime", e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-3 md:col-span-2">
              <Label className="text-sm font-medium">Onde a ocorrência aconteceu? <span className="text-destructive">*</span></Label>
              <RadioGroup
                value={formData.locationType}
                onValueChange={(value: "establishment" | "public_road") => handleInputChange("locationType", value)}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="establishment" id="locationType-establishment" />
                  <Label htmlFor="locationType-establishment">Em estabelecimento (Doca/Pátio)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="public_road" id="locationType-public_road" />
                  <Label htmlFor="locationType-public_road">Em rodovia/rua/via pública</Label>
                </div>
              </RadioGroup>
            </div>

            {formData.locationType === "establishment" && (
              <>
                <div className="space-y-3">
                  <Label htmlFor="establishmentName" className="text-sm font-medium">
                    Nome do Estabelecimento <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="establishmentName"
                    placeholder="Ex: Centro de Distribuição X"
                    value={formData.establishmentName}
                    onChange={(e) => handleInputChange("establishmentName", e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="establishmentAddress" className="text-sm font-medium">
                    Endereço Completo do Estabelecimento <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="establishmentAddress"
                    placeholder="Ex: Rua das Flores, 123, Bairro, Cidade/UF"
                    value={formData.establishmentAddress}
                    onChange={(e) => handleInputChange("establishmentAddress", e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-3 md:col-span-2">
                  <Label htmlFor="establishmentCircumstances" className="text-sm font-medium">
                    Circunstâncias do Ocorrido no Estabelecimento
                  </Label>
                  <Textarea
                    id="establishmentCircumstances"
                    placeholder="Descreva o que aconteceu nas dependências do estabelecimento..."
                    value={formData.establishmentCircumstances}
                    onChange={(e) => handleInputChange("establishmentCircumstances", e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Existe doca no estabelecimento?</Label>
                  <RadioGroup
                    value={formData.hasDock}
                    onValueChange={(value: "yes" | "no") => handleInputChange("hasDock", value)}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="hasDock-yes" />
                      <Label htmlFor="hasDock-yes">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="hasDock-no" />
                      <Label htmlFor="hasDock-no">Não</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Tem estacionamento disponível?</Label>
                  <RadioGroup
                    value={formData.hasParking}
                    onValueChange={(value: "yes" | "no") => handleInputChange("hasParking", value)}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="hasParking-yes" />
                      <Label htmlFor="hasParking-yes">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="hasParking-no" />
                      <Label htmlFor="hasParking-no">Não</Label>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}

            {formData.locationType === "public_road" && (
              <>
                <div className="space-y-3 md:col-span-2">
                  <Label htmlFor="roadDetailedLocation" className="text-sm font-medium">
                    Descrição Detalhada do Local (Rodovia/Rua) <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="roadDetailedLocation"
                    placeholder="Ex: BR-116, KM 250, próximo ao posto de gasolina 'X', sentido Sul."
                    value={formData.roadDetailedLocation}
                    onChange={(e) => handleInputChange("roadDetailedLocation", e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-3 md:col-span-2">
                  <Label htmlFor="roadSuspicions" className="text-sm font-medium">
                    Suspeitas sobre Veículos ou Indivíduos Próximos
                  </Label>
                  <Textarea
                    id="roadSuspicions"
                    placeholder="Descreva qualquer veículo ou pessoa suspeita observada..."
                    value={formData.roadSuspicions}
                    onChange={(e) => handleInputChange("roadSuspicions", e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="roadTrafficConditions" className="text-sm font-medium">
                    Condições do Trânsito no Momento
                  </Label>
                  <Input
                    id="roadTrafficConditions"
                    placeholder="Ex: Trânsito intenso, fluxo normal, parado, etc."
                    value={formData.roadTrafficConditions}
                    onChange={(e) => handleInputChange("roadTrafficConditions", e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="roadWitnesses" className="text-sm font-medium">
                    Existência de Testemunhas (Nome e Contato)
                  </Label>
                  <Textarea
                    id="roadWitnesses"
                    placeholder="Nomes e contatos de possíveis testemunhas..."
                    value={formData.roadWitnesses}
                    onChange={(e) => handleInputChange("roadWitnesses", e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sub-seção: Registro Policial (B.O.) */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Registro Policial (B.O.)</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="boNumber" className="text-sm font-medium">
                Nº do B.O. <span className="text-destructive">*</span>
              </Label>
              <Input
                id="boNumber"
                placeholder="Ex: 123456789"
                value={formData.boNumber}
                onChange={(e) => handleInputChange("boNumber", e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="boDate" className="text-sm font-medium">
                Data do B.O. <span className="text-destructive">*</span>
              </Label>
              <Input
                id="boDate"
                type="date"
                value={formData.boDate}
                onChange={(e) => handleInputChange("boDate", e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Registrado no mesmo dia da ocorrência?</Label>
              <RadioGroup
                value={formData.sameDay}
                onValueChange={(value: "yes" | "no") => handleInputChange("sameDay", value)}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="sameDay-yes" />
                  <Label htmlFor="sameDay-yes">Sim</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="sameDay-no" />
                  <Label htmlFor="sameDay-no">Não</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label htmlFor="responsible" className="text-sm font-medium">
                Responsável pelo Registro <span className="text-destructive">*</span>
              </Label>
              <Input
                id="responsible"
                placeholder="Nome completo"
                value={formData.responsible}
                onChange={(e) => handleInputChange("responsible", e.target.value)}
                className="h-11"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};