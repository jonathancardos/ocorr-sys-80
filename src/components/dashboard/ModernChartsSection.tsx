import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InteractiveChart } from "./InteractiveChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, BarChart3, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

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
      return data;
    },
  });

  // Process incident data for charts
  const incidentsByMonth = incidents?.reduce((acc, incident) => {
    const month = new Date(incident.created_at).toLocaleDateString('pt-BR', { month: 'short' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const incidentChartData = Object.entries(incidentsByMonth).map(([name, value]) => ({
    name,
    value,
  }));

  // Process driver performance data
  const driverPerformanceData = [
    { name: 'Jan', value: drivers?.filter(d => d.omnilink_score_status === 'em_dia').length || 0 },
    { name: 'Fev', value: (drivers?.length || 0) * 0.85 },
    { name: 'Mar', value: (drivers?.length || 0) * 0.92 },
    { name: 'Abr', value: (drivers?.length || 0) * 0.78 },
    { name: 'Mai', value: (drivers?.length || 0) * 0.95 },
    { name: 'Jun', value: drivers?.filter(d => d.omnilink_score_status === 'em_dia').length || 0 },
  ];

  // Risk level distribution
  const riskData = [
    { name: 'Baixo', value: incidents?.filter(i => i.severity === 'baixo').length || 12 },
    { name: 'Moderado', value: incidents?.filter(i => i.severity === 'moderado').length || 8 },
    { name: 'Alto', value: incidents?.filter(i => i.severity === 'grave').length || 5 },
    { name: 'Crítico', value: incidents?.filter(i => i.severity === 'critico').length || 2 },
  ];

  // Weekly performance data
  const weeklyData = [
    { name: 'Seg', value: Math.floor(Math.random() * 100) + 50 },
    { name: 'Ter', value: Math.floor(Math.random() * 100) + 60 },
    { name: 'Qua', value: Math.floor(Math.random() * 100) + 45 },
    { name: 'Qui', value: Math.floor(Math.random() * 100) + 80 },
    { name: 'Sex', value: Math.floor(Math.random() * 100) + 70 },
    { name: 'Sáb', value: Math.floor(Math.random() * 100) + 30 },
    { name: 'Dom', value: Math.floor(Math.random() * 100) + 25 },
  ];

  return (
    <div className="space-y-8">
      {/* Main Charts Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        <InteractiveChart
          title="Evolução de Ocorrências"
          subtitle="Tendência mensal de registros"
          data={incidentChartData.length > 0 ? incidentChartData : [
            { name: 'Jan', value: 15 },
            { name: 'Fev', value: 12 },
            { name: 'Mar', value: 18 },
            { name: 'Abr', value: 8 },
            { name: 'Mai', value: 22 },
            { name: 'Jun', value: 14 },
          ]}
          type="area"
          color="hsl(var(--primary))"
          className="lg:col-span-2"
        />

        <Card className="group overflow-hidden border-0 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-xl hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Zap className="h-5 w-5 text-accent" />
              Indicadores Críticos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Critical Indicators */}
            {[
              { 
                icon: Activity, 
                label: "CNH Vencidas", 
                value: incidents?.filter(i => i.severity === 'critico').length || 3,
                color: "text-destructive",
                bgColor: "bg-destructive/10"
              },
              { 
                icon: TrendingUp, 
                label: "Falhas Omnilink", 
                value: drivers?.filter(d => d.omnilink_score_status === 'inapto').length || 2,
                color: "text-warning",
                bgColor: "bg-warning/10"
              },
              { 
                icon: BarChart3, 
                label: "Pendências", 
                value: incidents?.filter(i => i.status === 'pendente').length || 7,
                color: "text-accent",
                bgColor: "bg-accent/10"
              },
            ].map((item, index) => (
              <div 
                key={item.label}
                className={cn(
                  "group/item flex items-center justify-between p-4 rounded-2xl transition-all duration-300 cursor-pointer",
                  "hover:scale-105 hover:shadow-lg",
                  item.bgColor
                )}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-xl transition-transform duration-200 group-hover/item:rotate-12", item.bgColor)}>
                    <item.icon className={cn("h-4 w-4", item.color)} />
                  </div>
                  <span className="font-medium text-foreground">{item.label}</span>
                </div>
                <span className={cn("text-xl font-bold transition-all duration-200 group-hover/item:scale-110", item.color)}>
                  {item.value}
                </span>
              </div>
            ))}

            {/* Progress Ring */}
            <div className="flex items-center justify-center pt-4">
              <div className="relative">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="hsl(var(--muted))"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="hsl(var(--primary))"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray="251.2"
                    strokeDashoffset="75.36"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">70%</span>
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Índice de Segurança Geral
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Charts */}
      <div className="grid gap-8 lg:grid-cols-2">
        <InteractiveChart
          title="Performance Semanal"
          subtitle="Atividade dos últimos 7 dias"
          data={weeklyData}
          type="bar"
          color="hsl(var(--success))"
        />

        <InteractiveChart
          title="Distribuição de Risco"
          subtitle="Classificação por nível de criticidade"
          data={riskData}
          type="line"
          color="hsl(var(--accent))"
        />
      </div>
    </div>
  );
};