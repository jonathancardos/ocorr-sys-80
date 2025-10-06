"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { User, Info, CalendarDays, ShieldCheck, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tables } from '@/integrations/supabase/types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCnhStatus, getDetailedOmnilinkStatus } from '@/lib/driver-utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DriverStatusDetailsDialog } from './DriverStatusDetailsDialog';

type Driver = Tables<'drivers'>;

interface DriverCnhOmnilinkStatsCardProps {
  allDrivers: Driver[];
  onClick?: () => void;
}

export const DriverCnhOmnilinkStatsCard: React.FC<DriverCnhOmnilinkStatsCardProps> = ({
  allDrivers,
  onClick,
}) => {
  const {
    totalDrivers,
    cnhValid,
    cnhExpiringSoon,
    cnhExpired,
    cnhUnknown,
    omnilinkEmDia,
    omnilinkPrestVencer,
    omnilinkVencido,
    omnilinkUnknown,
  } = React.useMemo(() => {
    let cnhValid = 0;
    let cnhExpiringSoon = 0;
    let cnhExpired = 0;
    let cnhUnknown = 0;

    let omnilinkEmDia = 0;
    let omnilinkPrestVencer = 0;
    let omnilinkVencido = 0;
    let omnilinkUnknown = 0;

    allDrivers.forEach(driver => {
      // CNH Status
      const cnhStatus = getCnhStatus(driver.cnh_expiry);
      switch (cnhStatus.status) {
        case 'valid': cnhValid++; break;
        case 'expiring_soon': cnhExpiringSoon++; break;
        case 'expired': cnhExpired++; break;
        case 'unknown': cnhUnknown++; break;
      }

      // Omnilink Status
      const detailedOmnilinkStatus = getDetailedOmnilinkStatus(driver.omnilink_score_registration_date);
      switch (detailedOmnilinkStatus.status) {
        case 'em_dia': omnilinkEmDia++; break;
        case 'prest_vencer': omnilinkPrestVencer++; break;
        case 'vencido': omnilinkVencido++; break;
        case 'unknown': omnilinkUnknown++; break;
      }
    });

    return {
      totalDrivers: allDrivers.length,
      cnhValid, cnhExpiringSoon, cnhExpired, cnhUnknown,
      omnilinkEmDia, omnilinkPrestVencer, omnilinkVencido, omnilinkUnknown,
    };
  }, [allDrivers]);

  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogDescription, setDialogDescription] = useState('');
  const [dialogDrivers, setDialogDrivers] = useState<Driver[]>([]);
  const [dialogStatusType, setDialogStatusType] = useState<'cnh' | 'omnilink'>('cnh');

  const handleOpenDetailsDialog = (
    title: string,
    description: string,
    filteredDrivers: Driver[],
    statusType: 'cnh' | 'omnilink'
  ) => {
    setDialogTitle(title);
    setDialogDescription(description);
    setDialogDrivers(filteredDrivers);
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
        <AccordionItem value="driver-stats" className="border-none">
          <AccordionTrigger className="p-6 flex flex-row items-center justify-between space-y-0 hover:no-underline">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Estatísticas de Motoristas
            </CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </AccordionTrigger>
          <AccordionContent>
            <CardContent className="space-y-6 pt-0">
              {/* Total de Motoristas */}
              <div className="flex items-center justify-between pb-4 border-b border-border/50">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl group-hover:blur-2xl transition-all duration-300" />
                    <div className="relative rounded-2xl bg-gradient-to-br from-foreground to-foreground/80 p-3 text-background transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                      <User className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground">Total de Motoristas</h4>
                    <p className="text-3xl font-bold text-foreground">{totalDrivers}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-sm">Motoristas Cadastrados</Badge>
              </div>

              {/* Status da CNH */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Status da CNH</h4>
                <div className="space-y-3">
                  {/* CNH Em Dia */}
                  <div
                    className="flex items-center justify-between cursor-pointer hover:bg-muted/20 p-2 rounded-md transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetailsDialog(
                        "Motoristas com CNH Em Dia",
                        "Lista de motoristas com CNH válida e sem vencimento próximo.",
                        allDrivers.filter(d => getCnhStatus(d.cnh_expiry).status === 'valid'),
                        'cnh'
                      );
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium">Em Dia</span>
                    </div>
                    <span className="text-sm text-foreground">{cnhValid} ({totalDrivers > 0 ? (cnhValid / totalDrivers * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <Progress value={totalDrivers > 0 ? (cnhValid / totalDrivers * 100) : 0} className="h-2 [&>div]:bg-success" />

                  {/* CNH Prestes a Vencer */}
                  <div
                    className="flex items-center justify-between cursor-pointer hover:bg-muted/20 p-2 rounded-md transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetailsDialog(
                        "Motoristas com CNH Prestes a Vencer",
                        "Lista de motoristas com CNH vencendo nos próximos 3 meses.",
                        allDrivers.filter(d => getCnhStatus(d.cnh_expiry).status === 'expiring_soon'),
                        'cnh'
                      );
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <span className="text-sm font-medium">Prestes a Vencer</span>
                    </div>
                    <span className="text-sm text-foreground">{cnhExpiringSoon} ({totalDrivers > 0 ? (cnhExpiringSoon / totalDrivers * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <Progress value={totalDrivers > 0 ? (cnhExpiringSoon / totalDrivers * 100) : 0} className="h-2 [&>div]:bg-warning" />

                  {/* CNH Vencida */}
                  <div
                    className="flex items-center justify-between cursor-pointer hover:bg-muted/20 p-2 rounded-md transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetailsDialog(
                        "Motoristas com CNH Vencida",
                        "Lista de motoristas com CNH já expirada.",
                        allDrivers.filter(d => getCnhStatus(d.cnh_expiry).status === 'expired'),
                        'cnh'
                      );
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium">Vencida</span>
                    </div>
                    <span className="text-sm text-foreground">{cnhExpired} ({totalDrivers > 0 ? (cnhExpired / totalDrivers * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <Progress value={totalDrivers > 0 ? (cnhExpired / totalDrivers * 100) : 0} className="h-2 [&>div]:bg-destructive" />

                  {/* CNH Não Informada */}
                  <div
                    className="flex items-center justify-between cursor-pointer hover:bg-muted/20 p-2 rounded-md transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetailsDialog(
                        "Motoristas com CNH Não Informada",
                        "Lista de motoristas sem data de validade da CNH informada.",
                        allDrivers.filter(d => getCnhStatus(d.cnh_expiry).status === 'unknown'),
                        'cnh'
                      );
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Não Informada</span>
                    </div>
                    <span className="text-sm text-foreground">{cnhUnknown} ({totalDrivers > 0 ? (cnhUnknown / totalDrivers * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <Progress value={totalDrivers > 0 ? (cnhUnknown / totalDrivers * 100) : 0} className="h-2 [&>div]:bg-muted-foreground" />
                </div>
              </div>

              {/* Status Omnilink Score */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Status Omnilink Score</h4>
                <div className="space-y-3">
                  {/* Omnilink Em Dia */}
                  <div
                    className="flex items-center justify-between cursor-pointer hover:bg-muted/20 p-2 rounded-md transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetailsDialog(
                        "Motoristas com Omnilink Em Dia",
                        "Lista de motoristas com Omnilink Score em dia.",
                        allDrivers.filter(d => getDetailedOmnilinkStatus(d.omnilink_score_registration_date).status === 'em_dia'),
                        'omnilink'
                      );
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium">Em Dia</span>
                    </div>
                    <span className="text-sm text-foreground">{omnilinkEmDia} ({totalDrivers > 0 ? (omnilinkEmDia / totalDrivers * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <Progress value={totalDrivers > 0 ? (omnilinkEmDia / totalDrivers * 100) : 0} className="h-2 [&>div]:bg-success" />

                  {/* Omnilink Prestes a Vencer */}
                  <div
                    className="flex items-center justify-between cursor-pointer hover:bg-muted/20 p-2 rounded-md transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetailsDialog(
                        "Motoristas com Omnilink Prestes a Vencer",
                        "Lista de motoristas com Omnilink Score prestes a vencer.",
                        allDrivers.filter(d => getDetailedOmnilinkStatus(d.omnilink_score_registration_date).status === 'prest_vencer'),
                        'omnilink'
                      );
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <span className="text-sm font-medium">Prestes a Vencer</span>
                    </div>
                    <span className="text-sm text-foreground">{omnilinkPrestVencer} ({totalDrivers > 0 ? (omnilinkPrestVencer / totalDrivers * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <Progress value={totalDrivers > 0 ? (omnilinkPrestVencer / totalDrivers * 100) : 0} className="h-2 [&>div]:bg-warning" />

                  {/* Omnilink Vencido */}
                  <div
                    className="flex items-center justify-between cursor-pointer hover:bg-muted/20 p-2 rounded-md transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetailsDialog(
                        "Motoristas com Omnilink Vencido",
                        "Lista de motoristas com Omnilink Score já vencido.",
                        allDrivers.filter(d => getDetailedOmnilinkStatus(d.omnilink_score_registration_date).status === 'vencido'),
                        'omnilink'
                      );
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium">Vencido</span>
                    </div>
                    <span className="text-sm text-foreground">{omnilinkVencido} ({totalDrivers > 0 ? (omnilinkVencido / totalDrivers * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <Progress value={totalDrivers > 0 ? (omnilinkVencido / totalDrivers * 100) : 0} className="h-2 [&>div]:bg-destructive" />

                  {/* Omnilink Não Informado */}
                  <div
                    className="flex items-center justify-between cursor-pointer hover:bg-muted/20 p-2 rounded-md transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetailsDialog(
                        "Motoristas com Omnilink Não Informado",
                        "Lista de motoristas sem data de cadastro Omnilink informada.",
                        allDrivers.filter(d => getDetailedOmnilinkStatus(d.omnilink_score_registration_date).status === 'unknown'),
                        'omnilink'
                      );
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Não Informado</span>
                    </div>
                    <span className="text-sm text-foreground">{omnilinkUnknown} ({totalDrivers > 0 ? (omnilinkUnknown / totalDrivers * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <Progress value={totalDrivers > 0 ? (omnilinkUnknown / totalDrivers * 100) : 0} className="h-2 [&>div]:bg-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Details Dialog */}
      <DriverStatusDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        title={dialogTitle}
        description={dialogDescription}
        drivers={dialogDrivers}
        statusType={dialogStatusType}
      />
    </Card>
  );
};