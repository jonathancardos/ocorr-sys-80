"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Lock, Info, BarChart2, Car, XCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Vehicle } from '@/types/vehicles';
import { VehicleStatusDetailsDialog } from './VehicleStatusDetailsDialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'; // NEW: Import Accordion components

interface VehicleBlockerAndPriorityStatsCardProps {
  totalVehicles: number;
  vehiclesWithBlockerInstalled: number;
  vehiclesBlockerNotInstalledExplicitly: number;
  vehiclesBlockerStatusUnknown: number; // Renamed from vehiclesBlockerNotInstalling
  vehiclesPriority1: number;
  vehiclesPriority2: number;
  vehiclesPriority3: number;
  onClick?: () => void;
  allVehicles: Vehicle[];
}

export const VehicleBlockerAndPriorityStatsCard: React.FC<VehicleBlockerAndPriorityStatsCardProps> = ({
  totalVehicles,
  vehiclesWithBlockerInstalled,
  vehiclesBlockerNotInstalledExplicitly,
  vehiclesBlockerStatusUnknown, // Updated prop name
  vehiclesPriority1,
  vehiclesPriority2,
  vehiclesPriority3,
  onClick,
  allVehicles,
}) => {
  const blockerInstalledPercentage = totalVehicles > 0 ? Math.round((vehiclesWithBlockerInstalled / totalVehicles) * 100) : 0;
  const blockerNotInstalledPercentage = totalVehicles > 0 ? Math.round((vehiclesBlockerNotInstalledExplicitly / totalVehicles) * 100) : 0;
  const blockerUnknownPercentage = totalVehicles > 0 ? Math.round((vehiclesBlockerStatusUnknown / totalVehicles) * 100) : 0; // Updated prop name

  // NEW: Calculate vehicles without blocker for each priority
  const vehiclesPriority1NoBlocker = allVehicles.filter(v => v.priority === 1 && v.blocker_installed === false).length;
  const vehiclesPriority2NoBlocker = allVehicles.filter(v => v.priority === 2 && v.blocker_installed === false).length;
  const vehiclesPriority3NoBlocker = allVehicles.filter(v => v.priority === 3 && v.blocker_installed === false).length;

  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogDescription, setDialogDescription] = useState('');
  const [dialogVehicles, setDialogVehicles] = useState<Vehicle[]>([]);
  const [dialogStatusType, setDialogStatusType] = useState<'blocker' | 'priority'>('blocker');

  const handleOpenDetailsDialog = (
    title: string,
    description: string,
    filteredVehicles: Vehicle[],
    statusType: 'blocker' | 'priority'
  ) => {
    setDialogTitle(title);
    setDialogDescription(description);
    setDialogVehicles(filteredVehicles);
    setDialogStatusType(statusType);
    setIsDetailsDialogOpen(true);
  };

  const isCardClickable = !!onClick;

  return (
    <Card
      className={cn(
        "modern-card col-span-full sm:col-span-2 lg:col-span-2 overflow-hidden",
        isCardClickable && "cursor-pointer hover:shadow-elevated transition-all duration-300"
      )}
      onClick={isCardClickable ? onClick : undefined}
    >
      <Accordion type="single" collapsible defaultValue="">
        <AccordionItem value="fleet-stats">
          <CardHeader className="pb-4">
            <AccordionTrigger className="flex items-center justify-between w-full">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-primary" />
                Estatísticas da Frota
              </CardTitle>
            </AccordionTrigger>
          </CardHeader>
          <AccordionContent>
            <CardContent className="space-y-6">
        {/* Total de Veículos - Destaque */}
        <div className="flex items-center justify-center p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground mb-1">Total de Veículos na Frota</p>
            <p className="text-5xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
              {totalVehicles}
            </p>
          </div>
        </div>

        {/* Status do Bloqueador - Melhorado */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <Lock className="h-4 w-4" />
            Status do Bloqueador
          </h4>
          
          <div className="grid gap-3">
            {/* Instalado */}
            <div 
              className="group relative overflow-hidden rounded-xl border border-border bg-card/50 hover:bg-card transition-all cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetailsDialog(
                  "Veículos com Bloqueador Instalado",
                  "Lista de veículos que possuem bloqueador instalado.",
                  allVehicles.filter(v => v.blocker_installed === true),
                  'blocker'
                );
              }}
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-success/10 p-2">
                    <Lock className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Instalado</p>
                    <p className="text-xs text-muted-foreground">Bloqueador funcionando</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-success">{vehiclesWithBlockerInstalled}</p>
                  <p className="text-xs text-muted-foreground">{blockerInstalledPercentage}%</p>
                </div>
              </div>
            </div>

            {/* Não Instalado */}
            <div 
              className="group relative overflow-hidden rounded-xl border border-border bg-card/50 hover:bg-card transition-all cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetailsDialog(
                  "Veículos com Bloqueador Não Instalado",
                  "Lista de veículos que não possuem bloqueador instalado.",
                  allVehicles.filter(v => v.blocker_installed === false),
                  'blocker'
                );
              }}
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-destructive/10 p-2">
                    <XCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Não Instalado</p>
                    <p className="text-xs text-muted-foreground">Aguardando instalação</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-destructive">{vehiclesBlockerNotInstalledExplicitly}</p>
                  <p className="text-xs text-muted-foreground">{blockerNotInstalledPercentage}%</p>
                </div>
              </div>
            </div>

            {/* Outros Status */}
            <div 
              className="group relative overflow-hidden rounded-xl border border-border bg-card/50 hover:bg-card transition-all cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetailsDialog(
                  "Veículos com Outros Status de Bloqueador",
                  "Lista de veículos cujo status de bloqueador não foi classificado (nulo ou texto não reconhecido).",
                  allVehicles.filter(v => v.blocker_installed === null),
                  'blocker'
                );
              }}
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <HelpCircle className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Outros Status</p>
                    <p className="text-xs text-muted-foreground">Não classificados</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-muted-foreground">{vehiclesBlockerStatusUnknown}</p>
                  <p className="text-xs text-muted-foreground">{blockerUnknownPercentage}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prioridades - Layout Moderno */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Car className="h-4 w-4" />
            Veículos por Prioridade
          </h4>
          
          <div className="grid grid-cols-3 gap-3">
            {/* Prioridade 1 */}
            <div 
              className="relative overflow-hidden rounded-xl border border-destructive/20 bg-gradient-to-br from-destructive/10 to-destructive/5 p-4 cursor-pointer hover:shadow-lg transition-all group"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetailsDialog(
                  "Veículos Prioridade 1 (Alta)",
                  "Lista de veículos classificados com Prioridade 1 (Alta).",
                  allVehicles.filter(v => v.priority === 1),
                  'priority'
                );
              }}
            >
              <div className="text-center space-y-2">
                <Badge variant="destructive" className="text-xs font-semibold">P1</Badge>
                <p className="text-4xl font-bold text-destructive">{vehiclesPriority1}</p>
                <p className="text-xs text-muted-foreground">Instalados</p>
                {vehiclesPriority1NoBlocker > 0 ? (
                  <Badge variant="destructive" className="text-xs w-full">
                    {vehiclesPriority1NoBlocker} Pendentes
                  </Badge>
                ) : (
                  <Badge variant="success" className="text-xs w-full">
                    ✓ Completo
                  </Badge>
                )}
              </div>
            </div>

            {/* Prioridade 2 */}
            <div 
              className="relative overflow-hidden rounded-xl border border-warning/20 bg-gradient-to-br from-warning/10 to-warning/5 p-4 cursor-pointer hover:shadow-lg transition-all group"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetailsDialog(
                  "Veículos Prioridade 2 (Média)",
                  "Lista de veículos classificados com Prioridade 2 (Média).",
                  allVehicles.filter(v => v.priority === 2),
                  'priority'
                );
              }}
            >
              <div className="text-center space-y-2">
                <Badge variant="warning" className="text-xs font-semibold">P2</Badge>
                <p className="text-4xl font-bold text-warning">{vehiclesPriority2}</p>
                <p className="text-xs text-muted-foreground">Instalados</p>
                {vehiclesPriority2NoBlocker > 0 ? (
                  <Badge variant="destructive" className="text-xs w-full">
                    {vehiclesPriority2NoBlocker} Pendentes
                  </Badge>
                ) : (
                  <Badge variant="success" className="text-xs w-full">
                    ✓ Completo
                  </Badge>
                )}
              </div>
            </div>

            {/* Prioridade 3 */}
            <div 
              className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-4 cursor-pointer hover:shadow-lg transition-all group"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetailsDialog(
                  "Veículos Prioridade 3 (Baixa)",
                  "Lista de veículos classificados com Prioridade 3 (Baixa).",
                  allVehicles.filter(v => v.priority === 3),
                  'priority'
                );
              }}
            >
              <div className="text-center space-y-2">
                <Badge variant="default" className="text-xs font-semibold">P3</Badge>
                <p className="text-4xl font-bold text-primary">{vehiclesPriority3}</p>
                <p className="text-xs text-muted-foreground">Instalados</p>
                {vehiclesPriority3NoBlocker > 0 ? (
                  <Badge variant="destructive" className="text-xs w-full">
                    {vehiclesPriority3NoBlocker} Pendentes
                  </Badge>
                ) : (
                  <Badge variant="success" className="text-xs w-full">
                    ✓ Completo
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Details Dialog */}
      <VehicleStatusDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        title={dialogTitle}
        description={dialogDescription}
        vehicles={dialogVehicles}
        statusType={dialogStatusType}
      />
    </Card>
  );
};