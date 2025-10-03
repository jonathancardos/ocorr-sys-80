import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Info } from 'lucide-react';

interface OmnilinkStatusPieChartProps {
  emDia: number;
  prestVencer: number;
  vencido: number;
  unknown: number;
}

export const OmnilinkStatusPieChart: React.FC<OmnilinkStatusPieChartProps> = ({
  emDia,
  prestVencer,
  vencido,
  unknown,
}) => {
  const data = [
    { name: "Em Dia", value: emDia, color: "hsl(var(--success))" },
    { name: "Prestes a Vencer", value: prestVencer, color: "hsl(var(--warning))" },
    { name: "Vencido", value: vencido, color: "hsl(var(--destructive))" },
    { name: "Não Informado", value: unknown, color: "hsl(var(--muted-foreground))" },
  ];

  const filteredData = data.filter(entry => entry.value > 0);

  return (
    <div className="dashboard-card-new h-full flex flex-col">
      <h2 className="dashboard-title-new">
        <ShieldCheck className="h-5 w-5" /> Distribuição de Status Omnilink
      </h2>
      <p className="text-sm text-muted-foreground mt-1">
        Visão geral dos status de validade do Omnilink Score na frota.
      </p>
      <div className="flex-1 w-full h-64">
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
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
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Info className="h-10 w-10 mb-3" />
            <p>Nenhum dado de status Omnilink para exibir.</p>
          </div>
        )}
      </div>
    </div>
  );
};