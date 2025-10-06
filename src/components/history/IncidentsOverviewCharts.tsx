import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { IncidentsByTimeChart } from './IncidentsByTimeChart';
import { IncidentSeverityPieChart } from './IncidentSeverityPieChart';

type Incident = Tables<'incidents'>;

interface IncidentsOverviewChartsProps {
  incidents: Incident[];
}

export const IncidentsOverviewCharts: React.FC<IncidentsOverviewChartsProps> = ({ incidents }) => {
  // Process data for IncidentsByTimeChart (e.g., by month)
  const incidentsByMonth = useMemo(() => {
    const monthlyData: { [key: string]: number } = {};
    incidents.forEach(incident => {
      if (incident.created_at) {
        const monthYear = new Date(incident.created_at).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        monthlyData[monthYear] = (monthlyData[monthYear] || 0) + 1;
      }
    });
    return Object.entries(monthlyData).map(([name, value]) => ({ name, value }));
  }, [incidents]);

  // Process data for IncidentSeverityPieChart
  const incidentSeverityData = useMemo(() => {
    const severityCounts: { [key: string]: number } = {
      baixo: 0,
      moderado: 0,
      grave: 0,
      critico: 0, // 'gravissimo' mapped to 'critico'
    };
    incidents.forEach(incident => {
      if (incident.severity) {
        const normalizedSeverity = incident.severity === 'gravissimo' ? 'critico' : incident.severity;
        if (severityCounts.hasOwnProperty(normalizedSeverity)) {
          severityCounts[normalizedSeverity]++;
        }
      }
    });
    return [
      { name: "Baixo", value: severityCounts.baixo, color: "hsl(var(--risk-low))" },
      { name: "Moderado", value: severityCounts.moderado, color: "hsl(var(--risk-moderate))" },
      { name: "Grave", value: severityCounts.grave, color: "hsl(var(--risk-grave))" },
      { name: "Crítico", value: severityCounts.critico, color: "hsl(var(--risk-critical))" },
    ].filter(entry => entry.value > 0); // Only show slices with values
  }, [incidents]);

  if (!incidents) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="modern-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Ocorrências por Período
          </CardTitle>
          <CardDescription>
            Análise da quantidade de ocorrências ao longo do tempo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IncidentsByTimeChart data={incidentsByMonth} />
        </CardContent>
      </Card>

      <Card className="modern-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            Distribuição de Risco
          </CardTitle>
          <CardDescription>
            Proporção de ocorrências por nível de severidade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IncidentSeverityPieChart data={incidentSeverityData} />
        </CardContent>
      </Card>
    </div>
  );
};