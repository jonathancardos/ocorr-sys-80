import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from "recharts";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, BarChart3, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfMonth, subMonths, startOfWeek, subWeeks, startOfYear, subYears, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChartData {
  name: string;
  value: number;
  date?: string; // Original date string for filtering
}

interface IncidentsByTimeChartProps {
  data: ChartData[]; // Data already processed by month/week/year
  type?: "area" | "bar" | "line";
  color?: string;
  className?: string;
}

const chartTypes = [
  { type: "area" as const, icon: Activity, label: "Área" },
  { type: "bar" as const, icon: BarChart3, label: "Barras" },
  { type: "line" as const, icon: TrendingUp, label: "Linha" },
];

export const IncidentsByTimeChart = ({ 
  data, 
  type = "area", 
  color = "hsl(var(--primary))",
  className 
}: IncidentsByTimeChartProps) => {
  const [activeType, setActiveType] = useState(type);
  const [dateRange, setDateRange] = useState("6m"); // Default to 6 months

  const dateRanges = [
    { value: "1m", label: "1 Mês" },
    { value: "3m", label: "3 Meses" },
    { value: "6m", label: "6 Meses" },
    { value: "1y", label: "1 Ano" },
    { value: "all", label: "Todo Período" },
  ];

  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case "1m":
        startDate = subMonths(now, 1);
        break;
      case "3m":
        startDate = subMonths(now, 3);
        break;
      case "6m":
        startDate = subMonths(now, 6);
        break;
      case "1y":
        startDate = subYears(now, 1);
        break;
      case "all":
      default:
        return data; // No date filtering
    }

    // Assuming 'name' in data is in a format like 'Jan 24' or '01/24'
    // We need to parse it back to a Date object for comparison
    return data.filter(item => {
      // Example: "Jan 24" -> "Jan 1, 2024"
      const year = parseInt(item.name.slice(-2), 10) + 2000; // Assuming 20xx years
      const monthAbbr = item.name.slice(0, 3);
      const monthIndex = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(monthAbbr.toLowerCase());
      
      if (monthIndex === -1) return true; // If parsing fails, include it (or handle as error)

      const itemDate = new Date(year, monthIndex, 1); // First day of the month
      return isAfter(itemDate, startDate);
    });
  }, [data, dateRange]);

  const renderChart = () => {
    const commonProps = {
      data: filteredData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (activeType) {
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              formatter={(value, name) => [`${value} ocorrências`, name]}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                boxShadow: "0 4px 20px -4px hsl(var(--foreground) / 0.1)",
              }}
            />
            <Bar 
              dataKey="value" 
              fill={color}
              radius={[4, 4, 0, 0]}
              className="hover:opacity-80 transition-opacity duration-200"
            />
          </BarChart>
        );
      
      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              formatter={(value, name) => [`${value} ocorrências`, name]}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                boxShadow: "0 4px 20px -4px hsl(var(--foreground) / 0.1)",
              }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color}
              strokeWidth={3}
              dot={{ r: 6, fill: color }}
              activeDot={{ r: 8, fill: color, stroke: "hsl(var(--background))", strokeWidth: 2 }}
            />
          </LineChart>
        );
      
      default:
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id={`gradient-incidents-by-time`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              formatter={(value, name) => [`${value} ocorrências`, name]}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                boxShadow: "0 4px 20px -4px hsl(var(--foreground) / 0.1)",
              }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color}
              strokeWidth={2}
              fillOpacity={1} 
              fill={`url(#gradient-incidents-by-time)`}
            />
          </AreaChart>
        );
    }
  };

  return (
    <div className={cn("h-80 w-full", className)}>
      <div className="flex items-center justify-between mb-4">
        {/* Chart Type Selector */}
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl">
          {chartTypes.map(({ type: chartType, icon: Icon, label }) => (
            <Button
              key={chartType}
              variant={activeType === chartType ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveType(chartType)}
              className={cn(
                "h-8 w-8 p-0 rounded-lg transition-all duration-200",
                activeType === chartType 
                  ? "bg-primary text-primary-foreground shadow-lg" 
                  : "hover:bg-primary/10"
              )}
              title={label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-1">
            {dateRanges.map(({ value, label }) => (
              <Button
                key={value}
                variant={dateRange === value ? "default" : "ghost"}
                size="sm"
                onClick={() => setDateRange(value)}
                className={cn(
                  "h-7 px-3 text-xs font-medium transition-all duration-200",
                  dateRange === value 
                    ? "bg-primary/20 text-primary hover:bg-primary/30" 
                    : "hover:bg-muted/80"
                )}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};