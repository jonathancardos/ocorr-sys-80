import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface DriverIndicacaoChartProps {
  indicados: number;
  naoIndicados: number;
}

export const DriverIndicacaoChart = ({ indicados, naoIndicados }: DriverIndicacaoChartProps) => {
  const data = [
    { name: "Indicados", value: indicados, color: "hsl(var(--success))" },
    { name: "Não Indicados", value: naoIndicados, color: "hsl(var(--destructive))" },
  ];

  // Filter out entries with 0 value to avoid rendering empty slices
  const filteredData = data.filter(entry => entry.value > 0);

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={filteredData}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={130}
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
    </div>
  );
};