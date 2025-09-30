"use client";

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Info, ShieldCheck, CalendarDays, Loader2, XCircle } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, differenceInDays, differenceInMonths, differenceInYears, addMonths, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getDetailedOmnilinkStatus, formatDate } from '@/lib/driver-utils';

type Driver = Tables<'drivers'>;

interface DriverDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  omnilinkStatusRangeKey: string; // e.g., 'vencidos_0-30d', 'em_dia_6m+'
  indicacaoStatusKey: 'indicado' | 'retificado' | 'nao_indicado';
}

export const DriverDetailsDialog: React.FC<DriverDetailsDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  omnilinkStatusRangeKey,
  indicacaoStatusKey,
}) => {
  const { data: allDrivers, isLoading, error } = useQuery<Driver[], Error>({
    queryKey: ['allDriversForDetails'],
    queryFn: async () => {
      const { data, error } = await supabase.from('drivers').select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen, // Only fetch when dialog is open
  });

  const filteredDrivers = useMemo(() => {
    if (!allDrivers) return [];

    return allDrivers.filter(driver => {
      // Filter by indicacaoStatusKey
      const matchesIndicacao = driver.status_indicacao === indicacaoStatusKey;
      if (!matchesIndicacao) return false;

      // Filter by omnilinkStatusRangeKey
      const regDateStr = driver.omnilink_score_registration_date;
      const detailedOmnilinkStatus = getDetailedOmnilinkStatus(regDateStr);
      const daysToOrSinceExpiry = detailedOmnilinkStatus.daysDifference;
      const monthsToOrSinceExpiry = detailedOmnilinkStatus.monthsDifference;
      const yearsToOrSinceExpiry = detailedOmnilinkStatus.expiryDate ? differenceInYears(detailedOmnilinkStatus.expiryDate, startOfDay(new Date())) : 0;

      const checkRange = (key: string, days: number, months: number, years: number) => {
        switch (key) {
          case 'vencidos_0-30d': return detailedOmnilinkStatus.status === 'vencido' && Math.abs(days) <= 30;
          case 'vencidos_31-90d': return detailedOmnilinkStatus.status === 'vencido' && Math.abs(days) > 30 && Math.abs(days) <= 90;
          case 'vencidos_91-180d': return detailedOmnilinkStatus.status === 'vencido' && Math.abs(days) > 90 && Math.abs(days) <= 180;
          case 'vencidos_180d+': return detailedOmnilinkStatus.status === 'vencido' && Math.abs(days) > 180;
          case 'vencidos_0-1m': return detailedOmnilinkStatus.status === 'vencido' && Math.abs(months) <= 1;
          case 'vencidos_1-3m': return detailedOmnilinkStatus.status === 'vencido' && Math.abs(months) > 1 && Math.abs(months) <= 3;
          case 'vencidos_3-6m': return detailedOmnilinkStatus.status === 'vencido' && Math.abs(months) > 3 && Math.abs(months) <= 6;
          case 'vencidos_6m+': return detailedOmnilinkStatus.status === 'vencido' && Math.abs(months) > 6;
          case 'vencidos_0-1y': return detailedOmnilinkStatus.status === 'vencido' && Math.abs(years) <= 1;
          case 'vencidos_1-3y': return detailedOmnilinkStatus.status === 'vencido' && Math.abs(years) > 1 && Math.abs(years) <= 3;
          case 'vencidos_3y+': return detailedOmnilinkStatus.status === 'vencido' && Math.abs(years) > 3;
          case 'prest_vencer_0-30d': return detailedOmnilinkStatus.status === 'prest_vencer' && days <= 30;
          case 'prest_vencer_31-90d': return detailedOmnilinkStatus.status === 'prest_vencer' && days > 30 && days <= 90;
          case 'prest_vencer_90d+': return detailedOmnilinkStatus.status === 'prest_vencer' && days > 90;
          case 'prest_vencer_0-1m': return detailedOmnilinkStatus.status === 'prest_vencer' && months <= 1;
          case 'prest_vencer_1-3m': return detailedOmnilinkStatus.status === 'prest_vencer' && months > 1 && months <= 3;
          case 'prest_vencer_3m+': return detailedOmnilinkStatus.status === 'prest_vencer' && months > 3;
          case 'prest_vencer_any': return detailedOmnilinkStatus.status === 'prest_vencer';
          case 'em_dia_0-90d': return detailedOmnilinkStatus.status === 'em_dia' && days <= 90;
          case 'em_dia_91-180d': return detailedOmnilinkStatus.status === 'em_dia' && days > 90 && days <= 180;
          case 'em_dia_180d+': return detailedOmnilinkStatus.status === 'em_dia' && days > 180;
          case 'em_dia_0-3m': return detailedOmnilinkStatus.status === 'em_dia' && months <= 3;
          case 'em_dia_3-6m': return detailedOmnilinkStatus.status === 'em_dia' && months > 3 && months <= 6;
          case 'em_dia_6m+': return detailedOmnilinkStatus.status === 'em_dia' && months > 6;
          case 'em_dia_any': return detailedOmnilinkStatus.status === 'em_dia';
          case 'unknown_omnilink_any': return detailedOmnilinkStatus.status === 'unknown';
          default: return false;
        }
      };

      return checkRange(omnilinkStatusRangeKey, daysToOrSinceExpiry, monthsToOrSinceExpiry, yearsToOrSinceExpiry);
    });
  }, [allDrivers, omnilinkStatusRangeKey, indicacaoStatusKey]);

  const getOmnilinkBadgeVariant = (status: 'em_dia' | 'prest_vencer' | 'vencido' | 'unknown') => {
    switch (status) {
      case 'em_dia': return 'success';
      case 'prest_vencer': return 'warning';
      case 'vencido': return 'destructive';
      default: return 'secondary';
    }
  };

  const getIndicacaoStatusBadgeVariant = (status: 'indicado' | 'retificado' | 'nao_indicado' | null) => {
    switch (status) {
      case 'indicado': return 'success';
      case 'retificado': return 'warning';
      case 'nao_indicado': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col bg-card/20 backdrop-blur-md border border-border/50">
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
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Carregando motoristas...</span>
              </div>
            ) : error ? (
              <div className="text-center text-destructive py-8">
                <XCircle className="h-8 w-8 inline-block mr-2" />
                <p>Erro ao carregar motoristas: {error.message}</p>
              </div>
            ) : filteredDrivers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome Completo</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Reg. Omnilink</TableHead>
                    <TableHead>Venc. Omnilink</TableHead>
                    <TableHead>Status Omnilink</TableHead>
                    <TableHead>Status Indicação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrivers.map((driver) => {
                    const omnilinkStatus = getDetailedOmnilinkStatus(driver.omnilink_score_registration_date);
                    return (
                      <TableRow key={driver.id}>
                        <TableCell className="font-medium">{driver.full_name}</TableCell>
                        <TableCell>{driver.cpf}</TableCell>
                        <TableCell>{driver.type || '-'}</TableCell>
                        <TableCell>{formatDate(driver.omnilink_score_registration_date)}</TableCell>
                        <TableCell>{formatDate(omnilinkStatus.expiryDate)}</TableCell>
                        <TableCell>
                          <Badge variant={getOmnilinkBadgeVariant(omnilinkStatus.status)}>
                            {omnilinkStatus.status === 'em_dia' ? 'Em Dia' : omnilinkStatus.status === 'prest_vencer' ? 'Prest. Vencer' : omnilinkStatus.status === 'vencido' ? 'Vencido' : 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getIndicacaoStatusBadgeVariant(driver.status_indicacao as 'indicado' | 'retificado' | 'nao_indicado' | null)}>
                            {driver.status_indicacao === 'indicado' ? 'Indicado' : driver.status_indicacao === 'retificado' ? 'Retificado' : driver.status_indicacao === 'nao_indicado' ? 'Não Indicado' : 'N/A'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Info className="h-10 w-10 mx-auto mb-3" />
                <p>Nenhum motorista encontrado para os filtros selecionados.</p>
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