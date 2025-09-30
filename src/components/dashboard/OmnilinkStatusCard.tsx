import { ModernStatsCard } from "./ModernStatsCard";
import { ShieldCheck } from "lucide-react";
import React from "react";

interface OmnilinkStatusCardProps {
  totalDrivers: number;
  onClick: () => void;
}

export const OmnilinkStatusCard: React.FC<OmnilinkStatusCardProps> = ({ totalDrivers, onClick }) => {
  return (
    <ModernStatsCard
      title="Status Omnilink"
      value={totalDrivers}
      change={{
        value: 0, // No specific percentage change for the combined card
        label: "motoristas cadastrados",
        isPositive: true,
      }}
      icon={ShieldCheck}
      onClick={onClick}
    />
  );
};