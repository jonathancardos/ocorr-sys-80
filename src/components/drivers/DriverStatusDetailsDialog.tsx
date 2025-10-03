"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Info, ShieldCheck, CalendarDays } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getCnhStatus, getDetailedOmnilinkStatus, formatDate } from '@/lib/driver-utils'; // Added formatDate import

type Driver = Tables<'drivers'>;

interface DriverStatusDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  drivers: Driver[];
  statusType: 'cnh' | 'omnilink';
}

export const DriverStatusDetailsDialog: React.FC<DriverStatusDetailsDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  drivers,
  statusType,
}) => {
  const getCnhBadgeVariant = (status: 'valid' | 'expiring_soon' | 'expired' | 'unknown') => {
    switch (status) {
      case 'valid': return 'success';
      case 'expiring_soon': return 'warning';
      case 'expired': return 'destructive';
      default: return 'secondary';
    }
  };

  const getOmnilinkBadgeVariant = (status: 'em_dia' | 'prest_vencer' | 'vencido' | 'unknown') => {
    switch (status) {
      case 'em_dia': return 'success';
      case 'prest_vencer': return 'warning';
      case 'vencido': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full h-[80vh] flex flex-col bg-card/20 backdrop-blur-md border border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-4 -mx-4">
          <div className="px-4">
            {drivers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome Completo</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Validade CNH</TableHead> {/* Always show CNH expiry */}
                    {statusType === 'cnh' && (
                      <>
                        <TableHead>CNH</TableHead>
                        <TableHead>Status CNH</TableHead>
                      </>
                    )}
                    {statusType === 'omnilink' && (
                      <>
                        <TableHead>Reg. Omnilink</TableHead>
                        <TableHead>Venc. Omnilink</TableHead>
                        <TableHead>Status Omnilink</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((driver) => {
                    const cnhStatus = getCnhStatus(driver.cnh_expiry);
                    const omnilinkStatus = getDetailedOmnilinkStatus(driver.omnilink_score_registration_date);
                    return (
                      <TableRow key={driver.id}>
                        <TableCell className="font-medium">{driver.full_name}</TableCell>
                        <TableCell>{driver.cpf}</TableCell>
                        <TableCell>{formatDate(driver.cnh_expiry)}</TableCell> {/* Always show CNH expiry */}
                        {statusType === 'cnh' && (
                          <>
                            <TableCell>{driver.cnh || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={getCnhBadgeVariant(cnhStatus.status)}>
                                {cnhStatus.status === 'valid' ? 'Em Dia' : cnhStatus.status === 'expiring_soon' ? 'Prest. Vencer' : cnhStatus.status === 'expired' ? 'Vencida' : 'N/A'}
                              </Badge>
                            </TableCell>
                          </>
                        )}
                        {statusType === 'omnilink' && (
                          <>
                            <TableCell>{formatDate(driver.omnilink_score_registration_date)}</TableCell>
                            <TableCell>{formatDate(omnilinkStatus.expiryDate)}</TableCell>
                            <TableCell>
                              <Badge variant={getOmnilinkBadgeVariant(omnilinkStatus.status)}>
                                {omnilinkStatus.status === 'em_dia' ? 'Em Dia' : omnilinkStatus.status === 'prest_vencer' ? 'Prest. Vencer' : omnilinkStatus.status === 'vencido' ? 'Vencido' : 'N/A'}
                              </Badge>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Info className="h-10 w-10 mx-auto mb-3" />
                <p>Nenhum motorista encontrado para este status.</p>
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