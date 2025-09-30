import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Import Card components

interface ModernStatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "destructive";
  onClick?: () => void;
  className?: string;
}

export const ModernStatsCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  variant = "default",
  onClick,
  className
}: ModernStatsCardProps) => {
  const isClickable = !!onClick;

  return (
    <div 
      className={cn(
        "dashboard-card-new", // Apply the new dashboard card style
        isClickable && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <h2 className="dashboard-title-new">
        <Icon className="h-5 w-5" /> {title}
      </h2>
      <p className="text-4xl font-bold mt-4 text-foreground">
        {value}
      </p>
      
      {change && (
        <div className="flex items-center gap-2 mt-2">
          <span className={cn(
            "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all duration-300",
            change.isPositive !== false
              ? "bg-success/10 text-success"
              : "bg-destructive/10 text-destructive"
          )}>
            {change.isPositive !== false ? "+" : ""}{change.value}%
          </span>
          <span className="text-xs text-muted-foreground">
            {change.label}
          </span>
        </div>
      )}
    </div>
  );
};