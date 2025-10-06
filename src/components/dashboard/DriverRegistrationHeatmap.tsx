"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Calendar, Clock, TrendingUp, BarChart3, Info, XCircle } from 'lucide-react'; // Adicionado XCircle
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { format, parseISO, differenceInDays, differenceInMonths, differenceInYears, addDays, addMonths, addYears, isAfter, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getDetailedOmnilinkStatus, OmnilinkDetailedStatus } from '@/lib/driver-utils';
import { DriverDetailsDialog } from '@/components/drivers/DriverDetailsDialog'; // NEW: Import DriverDetailsDialog

type Driver = Tables<'drivers'>;
type TimeGranularity = 'days' | 'months' | 'years';

interface ChartDataItem {
  name: string; // e.g., "Venc. (0-30d)"
  indicado: number;
  retificado: number;
  nao_indicado: number; // NEW: Add nao_indicado
  total: number;
  // Store detailed breakdown for tooltip
  details: {
    indicado: { vencidos: number; prest_vencer: number; em_dia: number; unknown_omnilink: number; };
    retificado: { vencidos: number; prest_vencer: number; em_dia: number; unknown_omnilink: number; };
    nao_indicado: { vencidos: number; prest_vencer: number; em_dia: number; unknown_omnilink: number; }; // NEW
  };
}

const indicacaoColorMap = {
  indicado: 'hsl(var(--success))', // Base green
  retificado: 'hsl(var(--warning))', // Base yellow
  nao_indicado: 'hsl(var(--destructive))', // Base red
};

const omnilinkColorMap = {
  vencidos: 'hsl(var(--destructive))',
  prest_vencer: 'hsl(var(--warning))',
  em_dia: 'hsl(var(--success))',
  unknown_omnilink: 'hsl(var(--muted-foreground))',
};

export const DriverRegistrationHeatmap: React.FC = () => {
  const [timeGranularity, setTimeGranularity] = useState<TimeGranularity>('months');

  // NEW: State for the DriverDetailsDialog
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogDescription, setDialogDescription] = useState('');
  const [selectedOmnilinkStatusRangeKey, setSelectedOmnilinkStatusRangeKey] = useState('');
  const [selectedIndicacaoStatusKey, setSelectedIndicacaoStatusKey] = useState<'indicado' | 'retificado' | 'nao_indicado'>('nao_indicado');


  const { data: drivers, isLoading, error } = useQuery<Driver[], Error>({
    queryKey: ['driversForHeatmap'],
    queryFn: async () => {
      const { data, error } = await supabase.from('drivers').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const processedChartData = useMemo(() => {
    if (!drivers || drivers.length === 0) return [];

    const dataMap: { [key: string]: ChartDataItem } = {};
    const today = startOfDay(new Date());

    drivers.forEach(driver => {
      const regDateStr = driver.omnilink_score_registration_date;
      const detailedOmnilinkStatus = getDetailedOmnilinkStatus(regDateStr);
      
      let omnilinkStatusCategory: OmnilinkDetailedStatus['status'];
      if (driver.omnilink_score_status === 'inapto') {
        omnilinkStatusCategory = 'vencido';
      } else if (driver.omnilink_score_status === 'em_dia') {
        omnilinkStatusCategory = 'em_dia';
      } else {
        omnilinkStatusCategory = detailedOmnilinkStatus.status;
      }

      const indicacaoStatusCategory = (driver.status_indicacao || 'nao_indicado') as 'indicado' | 'retificado' | 'nao_indicado';

      let key = '';
      let label = '';

      const daysToOrSinceExpiry = detailedOmnilinkStatus.daysDifference;
      const monthsToOrSinceExpiry = detailedOmnilinkStatus.monthsDifference;

      let yearsToOrSinceExpiry = 0;
      if (detailedOmnilinkStatus.expiryDate) {
        yearsToOrSinceExpiry = differenceInYears(detailedOmnilinkStatus.expiryDate, today);
      }

      switch (timeGranularity) {
        case 'days':
          if (omnilinkStatusCategory === 'vencido') {
            const absDaysSinceExpiry = Math.abs(daysToOrSinceExpiry);
            if (absDaysSinceExpiry <= 30) { key = 'vencidos_0-30d'; label = 'Venc. (0-30d)'; }
            else if (absDaysSinceExpiry <= 90) { key = 'vencidos_31-90d'; label = 'Venc. (31-90d)'; }
            else if (absDaysSinceExpiry <= 180) { key = 'vencidos_91-180d'; label = 'Venc. (91-180d)'; }
            else { key = 'vencidos_180d+'; label = 'Venc. (180d+)'; }
          } else if (omnilinkStatusCategory === 'prest_vencer') {
            if (daysToOrSinceExpiry <= 30) { key = 'prest_vencer_0-30d'; label = 'Prest. Venc. (0-30d)'; }
            else if (daysToOrSinceExpiry <= 90) { key = 'prest_vencer_31-90d'; label = 'Prest. Venc. (31-90d)'; }
            else { key = 'prest_vencer_90d+'; label = 'Prest. Venc. (90d+)'; }
          } else if (omnilinkStatusCategory === 'em_dia') {
            if (daysToOrSinceExpiry <= 90) { key = 'em_dia_0-90d'; label = 'Em Dia (0-90d)'; }
            else if (daysToOrSinceExpiry <= 180) { key = 'em_dia_91-180d'; label = 'Em Dia (91-180d)'; }
            else { key = 'em_dia_180d+'; label = 'Em Dia (180d+)'; }
          } else if (omnilinkStatusCategory === 'unknown') {
            key = 'unknown_omnilink_any'; label = 'Não Informado (Qualquer)';
          }
          break;

        case 'months':
          if (omnilinkStatusCategory === 'vencido') {
            const absMonthsSinceExpiry = Math.abs(monthsToOrSinceExpiry);
            if (absMonthsSinceExpiry <= 1) { key = 'vencidos_0-1m'; label = 'Venc. (0-1m)'; }
            else if (absMonthsSinceExpiry <= 3) { key = 'vencidos_1-3m'; label = 'Venc. (1-3m)'; }
            else if (absMonthsSinceExpiry <= 6) { key = 'vencidos_3-6m'; label = 'Venc. (3-6m)'; }
            else { key = 'vencidos_6m+'; label = 'Venc. (6m+)'; }
          } else if (omnilinkStatusCategory === 'prest_vencer') {
            if (monthsToOrSinceExpiry <= 1) { key = 'prest_vencer_0-1m'; label = 'Prest. Venc. (0-1m)'; }
            else if (monthsToOrSinceExpiry <= 3) { key = 'prest_vencer_1-3m'; label = 'Prest. Venc. (1-3m)'; }
            else { key = 'prest_vencer_3m+'; label = 'Prest. Venc. (3m+)'; }
          } else if (omnilinkStatusCategory === 'em_dia') {
            if (monthsToOrSinceExpiry <= 3) { key = 'em_dia_0-3m'; label = 'Em Dia (0-3m)'; }
            else if (monthsToOrSinceExpiry <= 6) { key = 'em_dia_3-6m'; label = 'Em Dia (3-6m)'; }
            else { key = 'em_dia_6m+'; label = 'Em Dia (6m+)'; }
          } else if (omnilinkStatusCategory === 'unknown') {
            key = 'unknown_omnilink_any'; label = 'Não Informado (Qualquer)';
          }
          break;

        case 'years':
          if (omnilinkStatusCategory === 'vencido') {
            const absYearsSinceExpiry = detailedOmnilinkStatus.expiryDate ? Math.abs(differenceInYears(detailedOmnilinkStatus.expiryDate, today)) : 0;
            if (absYearsSinceExpiry <= 1) { key = 'vencidos_0-1y'; label = 'Venc. (0-1a)'; }
            else if (absYearsSinceExpiry <= 3) { key = 'vencidos_1-3y'; label = 'Venc. (1-3a)'; }
            else { key = 'vencidos_3y+'; label = 'Venc. (3a+)'; }
          } else if (omnilinkStatusCategory === 'prest_vencer') {
            key = 'prest_vencer_any'; label = 'Prest. Venc. (Qualquer)';
          } else if (omnilinkStatusCategory === 'em_dia') {
            key = 'em_dia_any'; label = 'Em Dia (Qualquer)';
          } else if (omnilinkStatusCategory === 'unknown') {
            key = 'unknown_omnilink_any'; label = 'Não Informado (Qualquer)';
          }
          break;
      }

      if (!key) return;

      if (!dataMap[key]) {
        dataMap[key] = {
          name: label,
          indicado: 0, retificado: 0, nao_indicado: 0, total: 0,
          details: {
            indicado: { vencidos: 0, prest_vencer: 0, em_dia: 0, unknown_omnilink: 0 },
            retificado: { vencidos: 0, prest_vencer: 0, em_dia: 0, unknown_omnilink: 0 },
            nao_indicado: { vencidos: 0, prest_vencer: 0, em_dia: 0, unknown_omnilink: 0 },
          },
        };
      }

      dataMap[key][indicacaoStatusCategory]++;
      dataMap[key].total++;

      const omnilinkDetailKey = omnilinkStatusCategory === 'unknown' ? 'unknown_omnilink' : omnilinkStatusCategory;
      dataMap[key].details[indicacaoStatusCategory][omnilinkDetailKey]++;
    });

    const sortOrder = {
      'vencidos': 1,
      'prest_vencer': 2,
      'em_dia': 3,
      'unknown_omnilink': 4,
    };

    const timeRangeOrder = {
      '0-30d': 1, '31-90d': 2, '91-180d': 3, '180d+': 4,
      '0-1m': 1, '1-3m': 2, '3-6m': 3, '6m+': 4,
      '0-1y': 1, '1-3y': 2, '3y+': 3,
      'any': 1,
    };

    const finalData: ChartDataItem[] = Object.values(dataMap)
      .filter(item => item.total > 0)
      .sort((a, b) => {
        const getStatusKey = (name: string) => {
          if (name.startsWith('Venc.')) return 'vencidos';
          if (name.startsWith('Prest. Venc.')) return 'prest_vencer';
          if (name.startsWith('Em Dia')) return 'em_dia';
          if (name.startsWith('Não Informado')) return 'unknown_omnilink';
          return '';
        };

        const statusA = getStatusKey(a.name);
        const statusB = getStatusKey(b.name);

        const orderA = sortOrder[statusA as keyof typeof sortOrder] || 99;
        const orderB = sortOrder[statusB as keyof typeof sortOrder] || 99;

        if (orderA !== orderB) {
          return orderA - orderB;
        }

        const getRangeKey = (name: string) => {
          const match = name.match(/\((.*?)\)/);
          return match ? match[1].replace(/\s/g, '_').toLowerCase() : 'any';
        };

        const rangeA = getRangeKey(a.name);
        const rangeB = getRangeKey(b.name);

        const rangeOrderA = timeRangeOrder[rangeA as keyof typeof timeRangeOrder] || 99;
        const rangeOrderB = timeRangeOrder[rangeB as keyof typeof timeRangeOrder] || 99;

        return rangeOrderA - rangeOrderB;
      });

    return finalData;
  }, [drivers, timeGranularity]);

  // Custom Tooltip Content
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0].payload as ChartDataItem;
      const totalForCategory = dataItem.total;

      // Determine border color based on the first active bar's color
      const firstBarColor = payload[0].fill;
      const borderColor = firstBarColor.includes('url(#') ? 'rgba(255,255,255,0.2)' : firstBarColor; // Fallback for gradients

      return (
        <div 
          className="rounded-lg border p-4 shadow-lg text-sm"
          style={{ 
            backgroundColor: 'rgba(20,20,20,0.9)', 
            borderColor: borderColor,
            borderWidth: '1px',
            color: '#ddd',
          }}
        >
          <p className="font-bold text-white mb-2">{String(label)}</p>
          <p className="text-muted-foreground mb-2">Total de Motoristas: {String(totalForCategory)}</p>
          <div className="space-y-1">
            {['indicado', 'retificado', 'nao_indicado'].map(indicacaoKey => {
              const count = dataItem[indicacaoKey as keyof ChartDataItem] as number;
              if (count === 0) return null;

              const indicacaoLabel = indicacaoKey === 'indicado' ? 'Indicado' : indicacaoKey === 'retificado' ? 'Retificado' : 'Não Indicado';
              const indicacaoColor = indicacaoColorMap[indicacaoKey as keyof typeof indicacaoColorMap];
              const percentage = totalForCategory > 0 ? ((count / totalForCategory) * 100).toFixed(1) : 0;

              const omnilinkDetails = dataItem.details[indicacaoKey as keyof ChartDataItem['details']];

              return (
                <div key={indicacaoKey} className="mb-2">
                  <p className="font-semibold" style={{ color: indicacaoColor }}>
                    {indicacaoLabel}: {String(count)} ({String(percentage)}%)
                  </p>
                  <ul className="ml-4 text-xs text-muted-foreground">
                    {Object.entries(omnilinkDetails).map(([omnilinkKey, omnilinkCount]) => {
                      if (omnilinkCount === 0) return null;
                      const omnilinkLabel = omnilinkKey === 'vencidos' ? 'Vencidos' :
                                            omnilinkKey === 'prest_vencer' ? 'Prestes a Vencer' :
                                            omnilinkKey === 'em_dia' ? 'Em Dia' : 'Não Informado (Omnilink)';
                      const omnilinkColor = omnilinkColorMap[omnilinkKey as keyof typeof omnilinkColorMap];
                      const omnilinkPercentage = count > 0 ? ((omnilinkCount / count) * 100).toFixed(1) : 0;
                      return (
                        <li key={omnilinkKey} style={{ color: omnilinkColor }}>
                          - {omnilinkLabel}: {String(omnilinkCount)} ({String(omnilinkPercentage)}%)
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // NEW: Handle bar click to open dialog
  const handleBarClick = (data: ChartDataItem, indicacaoKey: 'indicado' | 'retificado' | 'nao_indicado') => {
    setDialogTitle(`Motoristas: ${data.name} - ${indicacaoKey === 'indicado' ? 'Indicado' : indicacaoKey === 'retificado' ? 'Retificado' : 'Não Indicado'}`);
    setDialogDescription(`Lista de motoristas com status Omnilink na faixa "${data.name}" e status de indicação "${indicacaoKey === 'indicado' ? 'Indicado' : indicacaoKey === 'retificado' ? 'Retificado' : 'Não Indicado'}".`);
    setSelectedOmnilinkStatusRangeKey(data.name.replace('Venc. (', 'vencidos_').replace('Prest. Venc. (', 'prest_vencer_').replace('Em Dia (', 'em_dia_').replace('Não Informado (Qualquer)', 'unknown_omnilink_any').replace(')', '').replace(/\s/g, '_').toLowerCase());
    setSelectedIndicacaoStatusKey(indicacaoKey);
    setIsDetailsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card className="modern-card h-full flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-2">Carregando dados dos motoristas...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="modern-card h-full flex flex-col items-center justify-center">
        <XCircle className="h-8 w-8 text-destructive" />
        <p className="text-destructive mt-2">Erro ao carregar dados: {error.message}</p>
      </Card>
    );
  }

  return (
    <div className="dashboard-card-new h-full flex flex-col">
      <h2 className="dashboard-title-new">
        <Calendar className="h-5 w-5" /> Mapa de Calor de Registro de Motoristas
      </h2>
      <p className="text-sm text-muted-foreground mt-1">
        Visualização da distribuição de registros de motoristas ao longo do tempo.
      </p>

      <div className="flex items-center justify-end mt-4 mb-4">
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
          <Button
            variant={timeGranularity === 'days' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTimeGranularity('days')}
            className={cn(
              "h-7 px-3 text-xs font-medium transition-all duration-200",
              timeGranularity === 'days' ? "bg-primary/20 text-primary hover:bg-primary/30" : "hover:bg-muted/80"
            )}
          >
            Dias
          </Button>
          <Button
            variant={timeGranularity === 'months' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTimeGranularity('months')}
            className={cn(
              "h-7 px-3 text-xs font-medium transition-all duration-200",
              timeGranularity === 'months' ? "bg-primary/20 text-primary hover:bg-primary/30" : "hover:bg-muted/80"
            )}
          >
            Meses
          </Button>
          <Button
            variant={timeGranularity === 'years' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTimeGranularity('years')}
            className={cn(
              "h-7 px-3 text-xs font-medium transition-all duration-200",
              timeGranularity === 'years' ? "bg-primary/20 text-primary hover:bg-primary/30" : "hover:bg-muted/80"
            )}
          >
            Anos
          </Button>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[300px] sm:h-64">
        {processedChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={processedChartData}
              margin={{ 
                top: 20, 
                right: 10, 
                left: 0, 
                bottom: 60 
              }}
              barCategoryGap="20%"
            >
              <defs>
                {/* Gradient for Indicado */}
                <linearGradient id="gradientIndicado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--success-light))" />
                  <stop offset="100%" stopColor="hsl(var(--success))" />
                </linearGradient>
                {/* Gradient for Retificado */}
                <linearGradient id="gradientRetificado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--warning-light))" />
                  <stop offset="100%" stopColor="hsl(var(--warning))" />
                </linearGradient>
                {/* Gradient for Não Indicado */}
                <linearGradient id="gradientNaoIndicado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--destructive-light))" />
                  <stop offset="100%" stopColor="hsl(var(--destructive))" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
              <XAxis
                dataKey="name"
                stroke="#ddd"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                angle={-35}
                textAnchor="end"
                height={80}
                interval={0}
                tick={{ 
                  dy: 10,
                  fontSize: '0.7rem'
                }}
              />
              <YAxis
                stroke="#ddd"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={45}
                label={{ 
                  value: 'Nº de Motoristas', 
                  angle: -90, 
                  position: 'insideLeft', 
                  style: { 
                    textAnchor: 'middle', 
                    fill: '#ddd',
                    fontSize: '0.75rem'
                  },
                  dx: -10
                }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                content={CustomTooltip}
              />
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '10px',
                  fontSize: '0.75rem',
                  marginBottom: '10px'
                }}
                iconType="circle"
                iconSize={8}
                align="center"
                verticalAlign="bottom"
                height={36}
              />
              <Bar
                dataKey="indicado"
                stackId="a"
                fill="url(#gradientIndicado)"
                name="Indicado"
                radius={[8, 8, 0, 0]}
                animationDuration={1000}
                animationEasing="ease-out"
                filter="drop-shadow(0 0 4px rgba(40, 167, 69, 0.5))"
                onClick={(data: any) => handleBarClick(data.payload, 'indicado')}
                className="cursor-pointer"
              />
              <Bar
                dataKey="retificado"
                stackId="a"
                fill="url(#gradientRetificado)"
                name="Retificado"
                radius={[8, 8, 0, 0]}
                animationDuration={1000}
                animationEasing="ease-out"
                filter="drop-shadow(0 0 4px rgba(255, 193, 7, 0.5))"
                onClick={(data: any) => handleBarClick(data.payload, 'retificado')}
                className="cursor-pointer"
              />
              <Bar
                dataKey="nao_indicado"
                stackId="a"
                fill="url(#gradientNaoIndicado)"
                name="Não Indicado"
                radius={[8, 8, 0, 0]}
                animationDuration={1000}
                animationEasing="ease-out"
                filter="drop-shadow(0 0 4px rgba(220, 53, 69, 0.5))"
                onClick={(data: any) => handleBarClick(data.payload, 'nao_indicado')}
                className="cursor-pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Info className="h-10 w-10 mb-3" />
            <p>Nenhum dado de motorista encontrado para o período selecionado.</p>
          </div>
        )}
      </div>

      {/* NEW: Render the DriverDetailsDialog */}
      <DriverDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        title={dialogTitle}
        description={dialogDescription}
        omnilinkStatusRangeKey={selectedOmnilinkStatusRangeKey}
        indicacaoStatusKey={selectedIndicacaoStatusKey}
      />
    </div>
  );
};