import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { calculateOmnilinkScoreStatus } from '@/lib/driver-utils'; // Import from new utility
import { Info } from 'lucide-react'; // Import Info icon

interface DriverIndicacaoChartProps {
  indicados: number;
  retificados: number; // NEW
  naoIndicados: number;
}

export const DriverIndicacaoChart = ({ indicados, retificados, naoIndicados }: DriverIndicacaoChartProps) => { // NEW
  const data = [
    { name: "Indicados", value: indicados, color: "hsl(var(--success))" },
    { name: "Retificados", value: retificados, color: "hsl(var(--warning))" }, // NEW
    { name: "Não Indicados", value: naoIndicados, color: "hsl(var(--destructive))" },
  ];

  // Filter out entries with 0 value to avoid rendering empty slices
  const filteredData = data.filter(entry => entry.value > 0);

  return (
    <div className="dashboard-card-new h-full flex flex-col">
      <h2 className="dashboard-title-new">
        <Info className="h-5 w-5" /> Status de Indicação de Motoristas
      </h2>
      <p className="text-sm text-muted-foreground mt-1">
        Distribuição de motoristas por status de indicação.
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
            <p>Nenhum dado de indicação para exibir.</p>
          </div>
        )}
      </div>
    </div>
  );
};