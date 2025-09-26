import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
        "group relative overflow-hidden rounded-3xl border bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-xl transition-all duration-500 cursor-pointer",
        "hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 hover:scale-[1.02]",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:to-transparent before:opacity-0",
        "hover:before:opacity-100 before:transition-opacity before:duration-300",
        "after:absolute after:inset-0 after:rounded-3xl after:bg-gradient-to-r after:from-transparent after:via-primary/10 after:to-transparent",
        "after:translate-x-[-100%] hover:after:translate-x-[100%] after:transition-transform after:duration-700",
        isClickable && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 right-4 h-32 w-32 rounded-full bg-gradient-radial from-primary/20 to-transparent blur-xl" />
        <div className="absolute bottom-4 left-4 h-20 w-20 rounded-full bg-gradient-radial from-accent/20 to-transparent blur-lg" />
      </div>

      <div className="relative p-6 sm:p-8">
        {/* Icon */}
        <div className="mb-6 flex justify-end">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl group-hover:blur-2xl transition-all duration-300" />
            <div className="relative rounded-2xl bg-gradient-to-br from-foreground to-foreground/80 p-4 text-background transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300">
            {title}
          </h3>
          
          <div className="space-y-3">
            <p className="text-3xl sm:text-4xl font-bold text-foreground group-hover:scale-105 transition-transform duration-300">
              {value}
            </p>
            
            {change && (
              <div className="flex items-center gap-2">
                <span className={cn(
                  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all duration-300",
                  change.isPositive !== false
                    ? "bg-success/10 text-success group-hover:bg-success/20"
                    : "bg-destructive/10 text-destructive group-hover:bg-destructive/20"
                )}>
                  {change.isPositive !== false ? "+" : ""}{change.value}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {change.label}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Animated Border */}
        <div className="absolute inset-0 rounded-3xl border-2 border-transparent bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
      </div>
    </div>
  );
};