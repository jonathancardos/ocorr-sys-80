import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, CheckCircle, XCircle, AlertTriangle, Calendar, ArrowLeft, PieChart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useNavigate } from 'react-router-dom';
import { getCnhStatus, getDetailedOmnilinkStatus } from '@/lib/driver-utils'; // Import getDetailedOmnilinkStatus
import { ResponsiveContainer, Pie, Cell, Legend, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

type Driver = Tables<'drivers'>;

interface StatusPieChartProps {
  data: { name: string; value: number; color: string }[];
  title: string;
}

const StatusPieChart: React.FC<StatusPieChartProps> = ({ data, title }) => {
  const filteredData = data.filter(entry => entry.value > 0);

  return (
    <Card className="modern-card h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center p-0">
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={filteredData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {filteredData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} motoristas`, name]}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem"
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center text-muted-foreground p-4">
            Nenhum dado para exibir.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const DriverOmnilinkStatusDetails: React.FC = () => {
  const navigate = useNavigate();

  const { data: drivers, isLoading, error } = useQuery<Driver[], Error>({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('drivers').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { cnhStatuses, omnilinkStatuses } = useMemo(() => {
    if (!drivers) {
      return {
        cnhStatuses: { valid: 0, expiringSoon: 0, expired: 0, unknown: 0 },
        omnilinkStatuses: { emDia: 0, prestVencer: 0, vencido: 0, unknown: 0 }, // UPDATED: granular statuses
      };
    }

    let cnhValid = 0;
    let cnhExpiringSoon = 0;
    let cnhExpired = 0;
    let cnhUnknown = 0;

    let omnilinkEmDia = 0;
    let omnilinkPrestVencer = 0; // NEW
    let omnilinkVencido = 0; // NEW
    let omnilinkUnknown = 0;

    drivers.forEach(driver => {
      // CNH Status
      const cnhStatus = getCnhStatus(driver.cnh_expiry);
      switch (cnhStatus.status) {
        case 'valid':
          cnhValid++;
          break;
        case 'expiring_soon':
          cnhExpiringSoon++;
          break;
        case 'expired':
          cnhExpired++;
          break;
        case 'unknown':
          cnhUnknown++;
          break;
      }

      // Omnilink Status (UPDATED LOGIC)
      const detailedOmnilinkStatus = getDetailedOmnilinkStatus(driver.omnilink_score_registration_date);
      switch (detailedOmnilinkStatus.status) {
        case 'em_dia':
          omnilinkEmDia++;
          break;
        case 'prest_vencer':
          omnilinkPrestVencer++;
          break;
        case 'vencido':
          omnilinkVencido++;
          break;
        case 'unknown':
          omnilinkUnknown++;
          break;
      }
    });

    return {
      cnhStatuses: { valid: cnhValid, expiringSoon: cnhExpiringSoon, expired: cnhExpired, unknown: cnhUnknown },
      omnilinkStatuses: { emDia: omnilinkEmDia, prestVencer: omnilinkPrestVencer, vencido: omnilinkVencido, unknown: omnilinkUnknown }, // UPDATED
    };
  }, [drivers]);

  const cnhPieChartData = [
    { name: "Em Dia", value: cnhStatuses.valid, color: "hsl(var(--success))" },
    { name: "Próximo Vencimento", value: cnhStatuses.expiringSoon, color: "hsl(var(--warning))" },
    { name: "Vencida", value: cnhStatuses.expired, color: "hsl(var(--destructive))" },
    { name: "Não Informado", value: cnhStatuses.unknown, color: "hsl(var(--muted-foreground))" },
  ];

  const omnilinkPieChartData = [
    { name: "Em Dia", value: omnilinkStatuses.emDia, color: "hsl(var(--success))" },
    { name: "Prestes a Vencer", value: omnilinkStatuses.prestVencer, color: "hsl(var(--warning))" }, // NEW
    { name: "Vencido", value: omnilinkStatuses.vencido, color: "hsl(var(--destructive))" }, // NEW
    { name: "Não Informado", value: omnilinkStatuses.unknown, color: "hsl(var(--muted-foreground))" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-destructive">
          <p>Erro ao carregar dados dos motoristas: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-foreground">Detalhes do Status de Motoristas</h2>
            <p className="text-muted-foreground">Visão geral e detalhada dos status de CNH e Omnilink Score.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card: Total de Motoristas */}
        <Card className="modern-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Motoristas</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drivers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Motoristas cadastrados no sistema</p>
          </CardContent>
        </Card>

        {/* Card: CNH em Dia */}
        <Card className="modern-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CNH em Dia</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cnhStatuses.valid}</div>
            <p className="text-xs text-muted-foreground">CNHs válidas e sem vencimento próximo</p>
          </CardContent>
        </Card>

        {/* Card: CNH Próximo Vencimento */}
        <Card className="modern-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CNH Próximo Vencimento</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cnhStatuses.expiringSoon}</div>
            <p className="text-xs text-muted-foreground">Vencem nos próximos 3 meses</p>
          </CardContent>
        </Card>

        {/* Card: CNH Vencida */}
        <Card className="modern-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CNH Vencida</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cnhStatuses.expired}</div>
            <p className="text-xs text-muted-foreground">CNHs já expiradas</p>
          </CardContent>
        </Card>

        {/* Card: Omnilink Em Dia */}
        <Card className="modern-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Omnilink Em Dia</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{omnilinkStatuses.emDia}</div>
            <p className="text-xs text-muted-foreground">Motoristas com cadastro Omnilink em dia</p>
          </CardContent>
        </Card>

        {/* Card: Omnilink Prestes a Vencer */}
        <Card className="modern-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Omnilink Prestes a Vencer</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{omnilinkStatuses.prestVencer}</div>
            <p className="text-xs text-muted-foreground">Cadastros Omnilink vencendo nos próximos 3 meses</p>
          </CardContent>
        </Card>

        {/* Card: Omnilink Vencido */}
        <Card className="modern-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Omnilink Vencido</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{omnilinkStatuses.vencido}</div>
            <p className="text-xs text-muted-foreground">Cadastros Omnilink já expirados</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusPieChart data={cnhPieChartData} title="Distribuição de Status da CNH" />
        <StatusPieChart data={omnilinkPieChartData} title="Distribuição de Status Omnilink" />
      </div>
    </div>
  );
};