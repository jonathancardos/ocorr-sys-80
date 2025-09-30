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
  vehiclesBlockerNotInstalling: number;
  vehiclesBlockerStatusUnknown: number;
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
  vehiclesBlockerNotInstalling,
  vehiclesBlockerStatusUnknown,
  vehiclesPriority1,
  vehiclesPriority2,
  vehiclesPriority3,
  onClick,
  allVehicles,
}) => {
  const blockerInstalledPercentage = totalVehicles > 0 ? Math.round((vehiclesWithBlockerInstalled / totalVehicles) * 100) : 0;
  const blockerNotInstalledPercentage = totalVehicles > 0 ? Math.round((vehiclesBlockerNotInstalledExplicitly / totalVehicles) * 100) : 0;
  const blockerNotInstallingPercentage = totalVehicles > 0 ? Math.round((vehiclesBlockerNotInstalling / totalVehicles) * 100) : 0;
  const blockerUnknownPercentage = totalVehicles > 0 ? Math.round((vehiclesBlockerStatusUnknown / totalVehicles) * 100) : 0;

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
        "modern-card col-span-full sm:col-span-2 lg:col-span-2",
        isCardClickable && "cursor-pointer hover:shadow-elevated transition-all duration-300"
      )}
      onClick={isCardClickable ? onClick : undefined}
    >
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="fleet-stats" className="border-none">
          <AccordionTrigger className="p-6 flex flex-row items-center justify-between space-y-0 hover:no-underline">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-primary" />
              Estatísticas da Frota
            </CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </AccordionTrigger>
          <AccordionContent>
            <CardContent className="space-y-6 pt-0"> {/* Removed top padding as AccordionContent adds its own */}
              {/* Total de Veículos */}
              <div className="flex items-center justify-between pb-4 border-b border-border/50">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl group-hover:blur-2xl transition-all duration-300" />
                    <div className="relative rounded-2xl bg-gradient-to-br from-foreground to-foreground/80 p-3 text-background transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                      <Car className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground">Total de Veículos</h4>
                    <p className="text-3xl font-bold text-foreground">{totalVehicles}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-sm">Veículos Cadastrados</Badge>
              </div>

              {/* Bloqueador Instalado */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Status do Bloqueador</h4>
                <div className="space-y-3">
                  {/* Instalado */}
                  <div 
                    className="flex items-center justify-between cursor-pointer hover:bg-muted/20 p-2 rounded-md transition-colors"
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
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium">Instalado</span>
                    </div>
                    <span className="text-sm text-foreground">{vehiclesWithBlockerInstalled} ({blockerInstalledPercentage}%)</span>
                  </div>
                  <Progress value={blockerInstalledPercentage} className="h-2" indicatorClassName="bg-success" />

                  {/* Não Instalado (Explicitamente) */}
                  <div 
                    className="flex items-center justify-between cursor-pointer hover:bg-muted/20 p-2 rounded-md transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetailsDialog(
                        "Veículos com Bloqueador Não Instalado",
                        "Lista de veículos que não possuem bloqueador instalado e não há indicação de 'não vai instalar'.",
                        allVehicles.filter(v => 
                          v.blocker_installed === false && 
                          !(v.raw_blocker_installed_text?.toLowerCase().includes('não vai instalar') || v.raw_blocker_installed_text?.toLowerCase().includes('nao vai instalar'))
                        ),
                        'blocker'
                      );
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium">Não Instalado</span>
                    </div>
                    <span className="text-sm text-foreground">{vehiclesBlockerNotInstalledExplicitly} ({blockerNotInstalledPercentage}%)</span>
                  </div>
                  <Progress value={blockerNotInstalledPercentage} className="h-2" indicatorClassName="bg-destructive" />

                  {/* Outros Status Não Classificados */}
                  <div 
                    className="flex items-center justify-between cursor-pointer hover:bg-muted/20 p-2 rounded-md transition-colors"
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
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Outros Status Não Classificados</span>
                    </div>
                    <span className="text-sm text-foreground">{vehiclesBlockerStatusUnknown} ({blockerUnknownPercentage}%)</span>
                  </div>
                  <Progress value={blockerUnknownPercentage} className="h-2" indicatorClassName="bg-muted-foreground" />
                </div>
              </div>

              {/* Prioridades */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Veículos por Prioridade</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Prioridade 1 */}
                  <div 
                    className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted/30 border border-border/50 cursor-pointer hover:bg-muted/40 transition-colors"
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
                    <Badge variant="destructive" className="mb-1">Prioridade 1</Badge>
                    <span className="text-xl font-bold text-foreground">{vehiclesPriority1}</span>
                    <span className="text-xs text-muted-foreground">Alta</span>
                    {vehiclesPriority1NoBlocker > 0 ? (
                      <Badge variant="destructive" className="mt-1 text-xs">
                        {vehiclesPriority1NoBlocker} Não Instalados
                      </Badge>
                    ) : (
                      <Badge variant="success" className="mt-1 text-xs">
                        Todos Instalados
                      </Badge>
                    )}
                  </div>
                  {/* Prioridade 2 */}
                  <div 
                    className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted/30 border border-border/50 cursor-pointer hover:bg-muted/40 transition-colors"
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
                    <Badge variant="warning" className="mb-1">Prioridade 2</Badge>
                    <span className="text-xl font-bold text-foreground">{vehiclesPriority2}</span>
                    <span className="text-xs text-muted-foreground">Média</span>
                    {vehiclesPriority2NoBlocker > 0 ? (
                      <Badge variant="destructive" className="mt-1 text-xs">
                        {vehiclesPriority2NoBlocker} Não Instalados
                      </Badge>
                    ) : (
                      <Badge variant="success" className="mt-1 text-xs">
                        Todos Instalados
                      </Badge>
                    )}
                  </div>
                  {/* Prioridade 3 */}
                  <div 
                    className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted/30 border border-border/50 cursor-pointer hover:bg-muted/40 transition-colors"
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
                    <Badge variant="default" className="mb-1">Prioridade 3</Badge>
                    <span className="text-xl font-bold text-foreground">{vehiclesPriority3}</span>
                    <span className="text-xs text-muted-foreground">Baixa</span>
                    {vehiclesPriority3NoBlocker > 0 ? (
                      <Badge variant="destructive" className="mt-1 text-xs">
                        {vehiclesPriority3NoBlocker} Não Instalados
                      </Badge>
                    ) : (
                      <Badge variant="success" className="mt-1 text-xs">
                        Todos Instalados
                      </Badge>
                    )}
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