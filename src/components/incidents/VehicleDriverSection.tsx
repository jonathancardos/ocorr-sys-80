import React, { useEffect, useState } from 'react';
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Truck, UserPlus, Plus, Lock, Info } from "lucide-react"; // Added Lock and Info icons
import { cn } from "@/lib/utils";
import { Tables } from "@/integrations/supabase/types";
import { Vehicle } from '@/types/vehicles';
import { CnhStatus, OmnilinkDetailedStatus, getCnhStatus, getDetailedOmnilinkStatus } from '@/lib/driver-utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'; // Import Tooltip

type Driver = Tables<'drivers'>;

interface VehicleDriverSectionProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
  isLoadingDrivers: boolean;
  drivers: Driver[] | undefined;
  handleDriverSelect: (driverId: string) => void;
  setIsNewDriverDialogOpen: (isOpen: boolean) => void;
  isLoadingVehicles: boolean;
  vehicles: Vehicle[] | undefined;
  handleVehicleSelect: (vehicleId: string) => void;
  setIsNewVehicleDialogOpen: (isOpen: boolean) => void;
  cnhStatus: CnhStatus;
}

export const VehicleDriverSection: React.FC<VehicleDriverSectionProps> = ({
  formData,
  handleInputChange,
  isLoadingDrivers,
  drivers,
  handleDriverSelect,
  setIsNewDriverDialogOpen,
  isLoadingVehicles,
  vehicles,
  handleVehicleSelect,
  setIsNewVehicleDialogOpen,
  cnhStatus,
}) => {
  const [detailedOmnilinkStatus, setDetailedOmnilinkStatus] = useState<OmnilinkDetailedStatus | null>(null);

  useEffect(() => {
    if (formData.omnilinkScoreRegistrationDate) {
      setDetailedOmnilinkStatus(getDetailedOmnilinkStatus(formData.omnilinkScoreRegistrationDate));
    } else {
      setDetailedOmnilinkStatus(null);
    }
  }, [formData.omnilinkScoreRegistrationDate]);

  const getOmnilinkBadgeVariant = (status: OmnilinkDetailedStatus['status']) => {
    switch (status) {
      case 'em_dia': return 'success';
      case 'prest_vencer': return 'warning';
      case 'vencido': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPriorityBadgeVariant = (priority: number | null) => {
    switch (priority) {
      case 1: return 'default';
      case 2: return 'warning';
      case 3: return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="rounded-lg border bg-card p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Truck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Dados do Veículo e Motorista</h2>
          <p className="text-sm text-muted-foreground">Informações sobre o veículo e condutor</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="vehicleId" className="text-sm font-medium">
              Selecionar Veículo <span className="text-destructive">*</span>
            </Label>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsNewVehicleDialogOpen(true)}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Novo Veículo
            </Button>
          </div>
          <Select
            value={formData.vehicleId || ''}
            onValueChange={handleVehicleSelect}
            disabled={isLoadingVehicles}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Selecione um veículo" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingVehicles ? (
                <SelectItem value="loading" disabled>Carregando veículos...</SelectItem>
              ) : (
                <>
                  {vehicles?.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate} - {vehicle.model}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label htmlFor="vehiclePlate" className="text-sm font-medium">
            Placa do Veículo
          </Label>
          <Input
            id="vehiclePlate"
            value={formData.vehiclePlate}
            readOnly
            className="h-11 bg-muted/50"
          />
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="vehicleModel" className="text-sm font-medium">
            Modelo do Veículo
          </Label>
          <Input
            id="vehicleModel"
            value={formData.vehicleModel}
            readOnly
            className="h-11 bg-muted/50"
          />
        </div>

        <div className="space-y-3 md:col-span-2">
          <Label className="text-sm font-medium">Tecnologias do Veículo</Label>
          <div className="flex flex-wrap gap-2">
            {(formData.vehicleTechnology || []).map((tech: string) => (
              <Badge key={tech} variant="outline">{tech}</Badge>
            ))}
            {(formData.vehicleTechnology || []).length === 0 && (
              <span className="text-muted-foreground text-sm">Nenhuma tecnologia selecionada</span>
            )}
          </div>
        </div>

        {/* NEW: Priority Display */}
        <div className="space-y-3">
          <Label htmlFor="vehiclePriority" className="text-sm font-medium">
            Prioridade do Veículo
          </Label>
          <div className="flex items-center gap-2">
            {formData.vehiclePriority ? (
              <Badge variant={getPriorityBadgeVariant(formData.vehiclePriority)}>
                Prioridade {formData.vehiclePriority}
              </Badge>
            ) : (
              <Badge variant="secondary">N/A</Badge>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">Prioridade do veículo (1: Baixa, 2: Média, 3: Alta).</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* NEW: Blocker Installed Display */}
        <div className="space-y-3">
          <Label htmlFor="vehicleBlockerInstalled" className="text-sm font-medium">
            Bloqueador Instalado?
          </Label>
          <div className="flex items-center gap-2">
            {formData.vehicleBlockerInstalled === true ? (
              <Badge variant="success" className="flex items-center gap-1">
                <Lock className="h-3 w-3" /> Sim
              </Badge>
            ) : formData.vehicleBlockerInstalled === false ? (
              <Badge variant="destructive" className="flex items-center gap-1">
                <Lock className="h-3 w-3" /> Não
              </Badge>
            ) : (
              <Badge variant="secondary">N/A</Badge>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">Indica se o veículo possui um bloqueador instalado.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="driverId" className="text-sm font-medium">
              Selecionar Motorista <span className="text-destructive">*</span>
            </Label>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsNewDriverDialogOpen(true)}
              className="flex items-center gap-1"
            >
              <UserPlus className="h-4 w-4" />
              Novo Motorista
            </Button>
          </div>
          <Select
            value={formData.driverId || ''}
            onValueChange={handleDriverSelect}
            disabled={isLoadingDrivers}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Selecione um motorista" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingDrivers ? (
                <SelectItem value="loading" disabled>Carregando motoristas...</SelectItem>
              ) : (
                <>
                  {drivers?.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.full_name} ({driver.cpf})
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label htmlFor="driverName" className="text-sm font-medium">
            Nome do Motorista
          </Label>
          <Input
            id="driverName"
            value={formData.driverName}
            readOnly
            className="h-11 bg-muted/50"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="driverCpf" className="text-sm font-medium">
            CPF do Motorista
          </Label>
          <Input
            id="driverCpf"
            value={formData.driverCpf}
            readOnly
            className="h-11 bg-muted/50"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="driverPhone" className="text-sm font-medium">
            Telefone do Motorista
          </Label>
          <Input
            id="driverPhone"
            value={formData.driverPhone}
            readOnly
            className="h-11 bg-muted/50"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="driverLicense" className="text-sm font-medium">
            CNH do Motorista
          </Label>
          <Input
            id="driverLicense"
            value={formData.driverLicense}
            readOnly
            className="h-11 bg-muted/50"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="licenseExpiry" className="text-sm font-medium">
            Validade da CNH
          </Label>
          <Input
            id="licenseExpiry"
            type="date"
            value={formData.licenseExpiry}
            readOnly
            className="h-11 bg-muted/50"
          />
          {cnhStatus.status !== 'valid' && cnhStatus.status !== 'unknown' && (
            <div className={cn(
              "flex items-center gap-2 text-sm",
              cnhStatus.status === 'expired' && "text-destructive",
              cnhStatus.status === 'expiring_soon' && "text-warning"
            )}>
              <AlertTriangle className="h-4 w-4" />
              {cnhStatus.message}
            </div>
          )}
        </div>

        {/* NEW: Omnilink Score Status Display */}
        <div className="space-y-3">
          <Label htmlFor="omnilinkStatusDisplay" className="text-sm font-medium">
            Status Omnilink Score
          </Label>
          <div className="flex items-center gap-2">
            {detailedOmnilinkStatus && detailedOmnilinkStatus.status !== 'unknown' ? (
              <Badge variant={getOmnilinkBadgeVariant(detailedOmnilinkStatus.status)}>
                {detailedOmnilinkStatus.status === 'em_dia' ? 'Em Dia' : detailedOmnilinkStatus.status === 'prest_vencer' ? 'Prestes a Vencer' : 'Vencido'}
              </Badge>
            ) : (
              <Badge variant="secondary">N/A</Badge>
            )}
            {detailedOmnilinkStatus && detailedOmnilinkStatus.status !== 'em_dia' && detailedOmnilinkStatus.status !== 'unknown' && (
              <div className={cn(
                "flex items-center gap-2 text-sm",
                detailedOmnilinkStatus.status === 'vencido' && "text-destructive",
                detailedOmnilinkStatus.status === 'prest_vencer' && "text-warning"
              )}>
                <AlertTriangle className="h-4 w-4" />
                {detailedOmnilinkStatus.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};