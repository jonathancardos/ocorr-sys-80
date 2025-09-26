import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const data = [
  { name: "Baixo", value: 65, color: "hsl(var(--risk-low))" },
  { name: "Moderado", value: 20, color: "hsl(var(--warning))" },
  { name: "Grave", value: 12, color: "hsl(var(--risk-grave))" },
  { name: "Crítico", value: 3, color: "hsl(var(--risk-critical))" },
];

export const RiskChart = () => {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={120}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [`${value}%`, "Porcentagem"]}
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