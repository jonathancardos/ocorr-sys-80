import React from 'react';
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { User } from "lucide-react";

interface DriverEvaluationSectionProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
}

export const DriverEvaluationSection: React.FC<DriverEvaluationSectionProps> = ({
  formData,
  handleInputChange,
}) => {
  return (
    <div className="rounded-lg border bg-card p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Apuração do Condutor</h2>
          <p className="text-sm text-muted-foreground">Perguntas com pesos para avaliação</p>
        </div>
      </div>
      
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Common Questions */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Seguiu instruções da Karne & Keijo? (Peso 4)</Label>
            <RadioGroup
              value={formData.followedInstructions}
              onValueChange={(value: "yes" | "no") => handleInputChange("followedInstructions", value)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="followedInstructions-yes" />
                <Label htmlFor="followedInstructions-yes">Sim</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="followedInstructions-no" />
                <Label htmlFor="followedInstructions-no">Não</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Comunicou anormalidades imediatamente? (Peso 2)</Label>
            <RadioGroup
              value={formData.reportedAnomalies}
              onValueChange={(value: "yes" | "no") => handleInputChange("reportedAnomalies", value)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="reportedAnomalies-yes" />
                <Label htmlFor="reportedAnomalies-yes">Sim</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="reportedAnomalies-no" />
                <Label htmlFor="reportedAnomalies-no">Não</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Há contradições na versão? (Peso 4)</Label>
            <RadioGroup
              value={formData.contradictions}
              onValueChange={(value: "yes" | "no") => handleInputChange("contradictions", value)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="contradictions-yes" />
                <Label htmlFor="contradictions-yes">Sim</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="contradictions-no" />
                <Label htmlFor="contradictions-no">Não</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Entregou chave a terceiros não autorizados? (Peso 4)</Label>
            <RadioGroup
              value={formData.keyToThird}
              onValueChange={(value: "yes" | "no") => handleInputChange("keyToThird", value)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="keyToThird-yes" />
                <Label htmlFor="keyToThird-yes">Sim</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="keyToThird-no" />
                <Label htmlFor="keyToThird-no">Não</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Deixou portas abertas ou vidros abaixados? (Peso 2)</Label>
            <RadioGroup
              value={formData.doorsOpen}
              onValueChange={(value: "yes" | "no") => handleInputChange("doorsOpen", value)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="doorsOpen-yes" />
                <Label htmlFor="doorsOpen-yes">Sim</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="doorsOpen-no" />
                <Label htmlFor="doorsOpen-no">Não</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Motorista se afastou por mais de 5 min? (Peso 2)</Label>
            <RadioGroup
              value={formData.leftVehicleTime}
              onValueChange={(value: "yes" | "no") => handleInputChange("leftVehicleTime", value)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="leftVehicleTime-yes" />
                <Label htmlFor="leftVehicleTime-yes">Sim</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="leftVehicleTime-no" />
                <Label htmlFor="leftVehicleTime-no">Não</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Conditional Questions based on locationType */}
          {formData.locationType === "establishment" && (
            <>
              <div className="space-y-3">
                <Label className="text-sm font-medium">O veículo foi trancado e alarmado? (Peso 1)</Label>
                <RadioGroup
                  value={formData.vehicleLocked}
                  onValueChange={(value: "yes" | "no") => handleInputChange("vehicleLocked", value)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="vehicleLocked-yes" />
                    <Label htmlFor="vehicleLocked-yes">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="vehicleLocked-no" />
                    <Label htmlFor="vehicleLocked-no">Não</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Motorista permaneceu próximo ao veículo? (Peso 1)</Label>
                <RadioGroup
                  value={formData.driverNearVehicle}
                  onValueChange={(value: "yes" | "no") => handleInputChange("driverNearVehicle", value)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="driverNearVehicle-yes" />
                    <Label htmlFor="driverNearVehicle-yes">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="driverNearVehicle-no" />
                    <Label htmlFor="driverNearVehicle-no">Não</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Veículo estacionado em local autorizado? (Peso 2)</Label>
                <RadioGroup
                  value={formData.authorizedParking}
                  onValueChange={(value: "yes" | "no") => handleInputChange("authorizedParking", value)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="authorizedParking-yes" />
                    <Label htmlFor="authorizedParking-yes">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="authorizedParking-no" />
                    <Label htmlFor="authorizedParking-no">Não</Label>
                  </div>
                </RadioGroup>
              </div>
            </>
          )}

          {formData.locationType === "public_road" && (
            <>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Veículo permaneceu ligado sem vigilância? (Peso 3)</Label>
                <RadioGroup
                  value={formData.vehicleRunning}
                  onValueChange={(value: "yes" | "no") => handleInputChange("vehicleRunning", value)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="vehicleRunning-yes" />
                    <Label htmlFor="vehicleRunning-yes">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="vehicleRunning-no" />
                    <Label htmlFor="vehicleRunning-no">Não</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Parou em local seguro/autorizado? (Peso 2)</Label>
                <RadioGroup
                  value={formData.stoppedInSafePlace}
                  onValueChange={(value: "yes" | "no") => handleInputChange("stoppedInSafePlace", value)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="stoppedInSafePlace-yes" />
                    <Label htmlFor="stoppedInSafePlace-yes">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="stoppedInSafePlace-no" />
                    <Label htmlFor="stoppedInSafePlace-no">Não</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Acionou o botão de pânico/alerta? (Peso 3)</Label>
                <RadioGroup
                  value={formData.activatedPanicButton}
                  onValueChange={(value: "yes" | "no") => handleInputChange("activatedPanicButton", value)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="activatedPanicButton-yes" />
                    <Label htmlFor="activatedPanicButton-yes">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="activatedPanicButton-no" />
                    <Label htmlFor="activatedPanicButton-no">Não</Label>
                  </div>
                </RadioGroup>
              </div>
            </>
          )}
        </div>

        {/* Score Display */}
        <div className="rounded-lg border bg-muted/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Pontuação Total</h3>
              <p className="text-sm text-muted-foreground">Baseada nas respostas acima</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{formData.driverScore}</div>
              <div className={`text-sm font-medium ${
                formData.riskLevel === "Gravíssimo" ? "text-destructive" :
                formData.riskLevel === "Grave" ? "text-orange-600" :
                formData.riskLevel === "Moderado" ? "text-yellow-600" :
                "text-green-600"
              }`}>
                {formData.riskLevel}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};