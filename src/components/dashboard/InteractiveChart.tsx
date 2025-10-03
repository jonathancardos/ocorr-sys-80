import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Import CardDescription
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, BarChart3, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays, subMonths, subYears, isAfter, parseISO, startOfDay } from 'date-fns'; // Import date-fns utilities

interface ChartData {
  name: string;
  value: number;
  date: string; // Make date mandatory for filtering
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

  const dateRanges = [
    { value: "7d", label: "7 dias" },
    { value: "30d", label: "30 dias" },
    { value: "90d", label: "90 dias" },
    { value: "1y", label: "1 ano" },
  ];

  const filteredData = useMemo(() => {
    const now = startOfDay(new Date());
    let startDateFilter: Date;

    switch (dateRange) {
      case "7d":
        startDateFilter = subDays(now, 7);
        break;
      case "30d":
        startDateFilter = subDays(now, 30);
        break;
      case "90d":
        startDateFilter = subDays(now, 90);
        break;
      case "1y":
        startDateFilter = subYears(now, 1);
        break;
      default:
        return data; // Should not happen with predefined ranges, but as a fallback
    }

    return data.filter(item => {
      try {
        const itemDate = startOfDay(parseISO(item.date));
        return isAfter(itemDate, startDateFilter);
      } catch (e) {
        console.error("Error parsing date for chart item:", item.date, e);
        return false; // Exclude items with invalid dates
      }
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
    <div className={cn("dashboard-card-new h-full flex flex-col", className)}>
      <h2 className="dashboard-title-new">
        {title}
      </h2>
      {subtitle && (
        <CardDescription className="text-sm text-muted-foreground mt-1">{subtitle}</CardDescription>
      )}
      
      <div className="flex items-center justify-between mt-4 mb-4">
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

      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};