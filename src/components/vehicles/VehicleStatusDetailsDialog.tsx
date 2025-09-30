"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Car, Info } from 'lucide-react';
import { Vehicle } from '@/types/vehicles';
import { Badge } from '@/components/ui/badge';

interface VehicleStatusDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  vehicles: Vehicle[];
  statusType: 'blocker' | 'priority'; // To help determine which raw text to show
}

export const VehicleStatusDetailsDialog: React.FC<VehicleStatusDetailsDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  vehicles,
  statusType,
}) => {
  const getPriorityLabel = (priority: number | null) => {
    switch (priority) {
      case 1: return 'Alta';
      case 2: return 'Média';
      case 3: return 'Baixa';
      default: return 'N/A';
    }
  };

  const getBlockerLabel = (blockerInstalled: boolean | null) => {
    if (blockerInstalled === true) return 'Sim';
    if (blockerInstalled === false) return 'Não';
    return 'N/A';
  };

  const getPriorityBadgeVariant = (priority: number | null) => {
    switch (priority) {
      case 1: return 'destructive'; // 1 = Alta
      case 2: return 'warning';     // 2 = Média
      case 3: return 'default';     // 3 = Baixa
      default: return 'secondary';
    }
  };

  const getBlockerBadgeVariant = (blockerInstalled: boolean | null) => {
    if (blockerInstalled === true) return 'success';
    if (blockerInstalled === false) return 'destructive';
    return 'secondary';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full h-[80vh] flex flex-col bg-card/20 backdrop-blur-md border border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-4 -mx-4">
          <div className="px-4">
            {vehicles.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Placa</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>{statusType === 'blocker' ? 'Bloqueador' : 'Prioridade'}</TableHead> {/* Dynamic header */}
                    <TableHead>Motivo/Texto Original</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">{vehicle.plate}</TableCell>
                      <TableCell>{vehicle.model || '-'}</TableCell>
                      <TableCell>
                        {statusType === 'blocker' ? (
                          <Badge variant={getBlockerBadgeVariant(vehicle.blocker_installed)}>
                            {getBlockerLabel(vehicle.blocker_installed)}
                          </Badge>
                        ) : (
                          <Badge variant={getPriorityBadgeVariant(vehicle.priority)}>
                            {getPriorityLabel(vehicle.priority)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {statusType === 'blocker' ? (
                          vehicle.raw_blocker_installed_text || 'N/A'
                        ) : (
                          vehicle.raw_priority_text || 'N/A'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Info className="h-10 w-10 mx-auto mb-3" />
                <p>Nenhum veículo encontrado para este status.</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};