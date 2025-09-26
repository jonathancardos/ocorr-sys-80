import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  variant?: "default" | "success" | "warning" | "destructive";
}

export const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  variant = "default" 
}: StatsCardProps) => {
  const variantClasses = {
    default: "bg-gradient-card border-border",
    success: "bg-gradient-to-br from-success/5 to-success/10 border-success/20",
    warning: "bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20",
    destructive: "bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20",
  };

  const iconClasses = {
    default: "text-primary",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
  };

  return (
    <Card className={cn("shadow-card hover:shadow-elevated transition-all duration-300", variantClasses[variant])}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <h3 className="text-2xl font-bold text-foreground">
              {value}
            </h3>
            {trend && (
              <p className={cn(
                "text-xs mt-1",
                trend.value > 0 
                  ? variant === "destructive" ? "text-destructive" : "text-success"
                  : "text-muted-foreground"
              )}>
                {trend.value > 0 ? "+" : ""}{trend.value}% {trend.label}
              </p>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-xl bg-white/50",
            iconClasses[variant]
          )}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};