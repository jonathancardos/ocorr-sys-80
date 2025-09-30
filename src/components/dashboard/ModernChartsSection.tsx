import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InteractiveChart } from "./InteractiveChart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, TrendingUp, BarChart3, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays, subMonths, subYears, startOfDay } from 'date-fns'; // Import date-fns utilities
import { DoubleBlockerProgressChart } from './DoubleBlockerProgressChart'; // NEW: Import the new chart
import { DriverRegistrationHeatmap } from './DriverRegistrationHeatmap'; // NEW: Import the new heatmap chart
// REMOVIDO: import { DriverIndicacaoChart } from './DriverIndicacaoChart'; // NEW: Import DriverIndicacaoChart
// REMOVIDO: import { OmnilinkStatusPieChart } from './OmnilinkStatusPieChart'; // NEW: Import OmnilinkStatusPieChart
import { getDetailedOmnilinkStatus } from '@/lib/driver-utils'; // NEW: Import getDetailedOmnilinkStatus
import { useMemo } from "react";

export const ModernChartsSection = () => {
  // Fetch real data from Supabase
  const { data: incidents } = useQuery({
    queryKey: ['chart-incidents'],
    queryFn: async () => {
      const { data, error } = await supabase.from('incidents').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: drivers } = useQuery({
    queryKey: ['chart-drivers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('drivers').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // Process incident data for charts
  const incidentChartData = incidents?.map(incident => ({
    name: format(new Date(incident.created_at), 'MMM yy'), // e.g., 'Jan 24'
    value: 1, // Each incident counts as 1
    date: format(new Date(incident.created_at), 'yyyy-MM-dd'),
  })).reduce((acc, curr) => {
    const existing = acc.find(item => item.name === curr.name);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push(curr);
    }
    return acc;
  }, [] as { name: string; value: number; date: string }[]) || [];

  // NEW: Calculate driver metrics for new charts
  const { indicadosCount, retificadosCount, naoIndicadosCount, omnilinkEmDiaCount, omnilinkPrestVencerCount, omnilinkVencidoCount, omnilinkUnknownCount } = useMemo(() => {
    let indicados = 0;
    let retificados = 0;
    let naoIndicados = 0;
    let emDia = 0;
    let prestVencer = 0;
    let vencido = 0;
    let unknownOmnilink = 0;

    drivers?.forEach(driver => {
      // Counts for Indication Status
      if (driver.status_indicacao === 'indicado') {
        indicados++;
      } else if (driver.status_indicacao === 'retificado') {
        retificados++;
      } else if (driver.status_indicacao === 'nao_indicado') {
        naoIndicados++;
      }

      // Counts for Omnilink Status
      const detailedOmnilinkStatus = getDetailedOmnilinkStatus(driver.omnilink_score_registration_date);
      switch (detailedOmnilinkStatus.status) {
        case 'em_dia':
          emDia++;
          break;
        case 'prest_vencer':
          prestVencer++;
          break;
        case 'vencido':
          vencido++;
          break;
        case 'unknown':
          unknownOmnilink++;
          break;
      }
    });

    return {
      indicadosCount: indicados,
      retificadosCount: retificados,
      naoIndicadosCount: naoIndicados,
      omnilinkEmDiaCount: emDia,
      omnilinkPrestVencerCount: prestVencer,
      omnilinkVencidoCount: vencido,
      omnilinkUnknownCount: unknownOmnilink,
    };
  }, [drivers]);


  // Generate mock data with dates for other charts
  const today = startOfDay(new Date());

  const generateMockDataWithDates = (baseValue: number, numDays: number, startFrom: Date = today) => {
    const mockData = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const date = subDays(startFrom, i);
      mockData.push({
        name: format(date, 'dd MMM'),
        value: Math.floor(Math.random() * baseValue) + (baseValue / 2),
        date: format(date, 'yyyy-MM-dd'),
      });
    }
    return mockData;
  };

  const generateMonthlyMockDataWithDates = (baseValue: number, numMonths: number, startFrom: Date = today) => {
    const mockData = [];
    for (let i = numMonths - 1; i >= 0; i--) {
      const date = subMonths(startFrom, i);
      mockData.push({
        name: format(date, 'MMM yy'),
        value: Math.floor(Math.random() * baseValue) + (baseValue / 2),
        date: format(date, 'yyyy-MM-dd'),
      });
    }
    return mockData;
  };

  // Driver performance data (mock with dates)
  const driverPerformanceData = generateMonthlyMockDataWithDates(50, 6); // 6 months of data

  // Risk level distribution (mock with dates)
  const riskData = [
    { name: 'Baixo', value: incidents?.filter(i => i.severity === 'baixo').length || 12, date: format(today, 'yyyy-MM-dd') },
    { name: 'Moderado', value: incidents?.filter(i => i.severity === 'moderado').length || 8, date: format(today, 'yyyy-MM-dd') },
    { name: 'Alto', value: incidents?.filter(i => i.severity === 'grave').length || 5, date: format(today, 'yyyy-MM-dd') },
    { name: 'Crítico', value: incidents?.filter(i => i.severity === 'critico').length || 2, date: format(today, 'yyyy-MM-dd') },
  ];

  // Weekly performance data (mock with dates)
  const weeklyData = generateMockDataWithDates(100, 7); // 7 days of data

  return (
    <div className="space-y-8">
      {/* Main Charts Grid */}
      <div className="grid gap-8 lg:grid-cols-2"> {/* Changed to 2 columns for better layout */}
        {/* Double Blocker Progress Chart */}
        <DoubleBlockerProgressChart />

        {/* Driver Registration Heatmap */}
        <DriverRegistrationHeatmap />

        {/* REMOVIDO: NEW: Driver Indication Status Chart */}
        {/* REMOVIDO: <DriverIndicacaoChart
          indicados={indicadosCount}
          retificados={retificadosCount}
          naoIndicados={naoIndicadosCount}
        /> */}

        {/* REMOVIDO: NEW: Omnilink Status Pie Chart */}
        {/* REMOVIDO: <OmnilinkStatusPieChart
          emDia={omnilinkEmDiaCount}
          prestVencer={omnilinkPrestVencerCount}
          vencido={omnilinkVencidoCount}
          unknown={omnilinkUnknownCount}
        /> */}
      </div>

      {/* Secondary Charts - This section remains as is, or can be removed if no other charts are needed */}
      {/* Removido o InteractiveChart de Performance Semanal */}
    </div>
  );
};