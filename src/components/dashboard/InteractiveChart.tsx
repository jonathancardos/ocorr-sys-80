import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, BarChart3, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChartData {
  name: string;
  value: number;
  date?: string;
}

interface InteractiveChartProps {
  title: string;
  data: ChartData[];
  type?: "area" | "bar" | "line";
  color?: string;
  subtitle?: string;
  className?: string;
}

const chartTypes = [
  { type: "area" as const, icon: Activity, label: "Área" },
  { type: "bar" as const, icon: BarChart3, label: "Barras" },
  { type: "line" as const, icon: TrendingUp, label: "Linha" },
];

export const InteractiveChart = ({ 
  title, 
  data, 
  type = "area", 
  color = "hsl(var(--primary))",
  subtitle,
  className 
}: InteractiveChartProps) => {
  const [activeType, setActiveType] = useState(type);
  const [dateRange, setDateRange] = useState("7d");
  const [hoveredData, setHoveredData] = useState<ChartData | null>(null);

  const dateRanges = [
    { value: "7d", label: "7 dias" },
    { value: "30d", label: "30 dias" },
    { value: "90d", label: "90 dias" },
    { value: "1y", label: "1 ano" },
  ];

  const filteredData = useMemo(() => {
    // Simular filtro por data - em produção, isso viria do backend
    return data;
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
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                boxShadow: "0 4px 20px -4px hsl(var(--foreground) / 0.1)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
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
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                boxShadow: "0 4px 20px -4px hsl(var(--foreground) / 0.1)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
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
              <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
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
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                boxShadow: "0 4px 20px -4px hsl(var(--foreground) / 0.1)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color}
              strokeWidth={2}
              fillOpacity={1} 
              fill={`url(#gradient-${title})`}
            />
          </AreaChart>
        );
    }
  };

  return (
    <Card className={cn(
      "group overflow-hidden border-0 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-xl",
      "hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500",
      "before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:to-transparent before:opacity-0",
      "hover:before:opacity-100 before:transition-opacity before:duration-300",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
              {title}
            </CardTitle>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          
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
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2 mt-4">
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
      </CardHeader>

      <CardContent className="pt-0">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};