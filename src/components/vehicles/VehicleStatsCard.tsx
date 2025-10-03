import { ModernStatsCard } from "@/components/dashboard/ModernStatsCard";
import { Car, Wrench, XCircle, Lock, Info } from "lucide-react"; // Added Info icon
import React from "react";

interface VehicleStatsCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  onClick: () => void;
  variant?: "default" | "success" | "warning" | "destructive";
}

export const VehicleStatsCard: React.FC<VehicleStatsCardProps> = ({ title, value, icon, onClick, variant = "default" }) => {
  return (
    <ModernStatsCard
      title={title}
      value={value}
      change={{
        value: 0, // No specific percentage change for these cards
        label: "veículos",
        isPositive: true,
      }}
      icon={icon as any}
      onClick={onClick}
      variant={variant}
    />
  );
};