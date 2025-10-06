import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ModernStatsCard } from "./ModernStatsCard";
import { 
  FileText, 
  AlertTriangle, 
  Users, 
  TrendingUp,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  Truck,
  Activity,
  Shield,
  Target,
  ShieldCheck // Added ShieldCheck for the new card
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { OmnilinkStatusCard } from "./OmnilinkStatusCard"; // Import the new unified card
import { getDetailedOmnilinkStatus } from '@/lib/driver-utils'; // NEW: Import getDetailedOmnilinkStatus
import { startOfMonth, endOfMonth, format } from 'date-fns'; // Import date-fns utilities
import { ptBR } from 'date-fns/locale'; // Import ptBR locale

export const ModernMetricsGrid = () => {
  const navigate = useNavigate();

  const currentMonthName = format(new Date(), 'MMMM', { locale: ptBR }); // Get current month name in Portuguese

  // Fetch incidents data
  const { data: incidents } = useQuery({
    queryKey: ['dashboard-incidents'],
    queryFn: async () => {
      const { data, error } = await supabase.from('incidents').select('*');
      if (error) throw error;
      return data;
    },
  });

  // Fetch ALL drivers data
  const { data: allDrivers } = useQuery({
    queryKey: ['dashboard-all-drivers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('drivers').select('*');
      if (error) throw error;
      return data;
    },
  });

  // Fetch vehicles data
  const { data: vehicles } = useQuery({
    queryKey: ['dashboard-vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vehicles').select('*');
      if (error) throw error;
      return data;
    },
  });

  // Calculate metrics
  const totalIncidents = incidents?.length || 0;
  const graveIncidents = incidents?.filter(i => i.severity === 'grave' || i.severity === 'critico').length || 0;
  const totalDrivers = allDrivers?.length || 0; // Total drivers for the new card
  
  // Calculate drivers registered this month from allDrivers based on omnilink_score_registration_date
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const driversThisMonth = allDrivers?.filter(driver => {
    if (!driver.omnilink_score_registration_date) return false; // Only count if Omnilink registration date exists
    const registrationDate = new Date(driver.omnilink_score_registration_date);
    return registrationDate.getMonth() === currentMonth && registrationDate.getFullYear() === currentYear;
  }).length || 0;

  let omnilinkEmDiaCount = 0;
  let omnilinkPrestVencerCount = 0;
  let omnilinkVencidoCount = 0;

  allDrivers?.forEach(driver => {
    const detailedStatus = getDetailedOmnilinkStatus(driver.omnilink_score_registration_date);
    switch (detailedStatus.status) {
      case 'em_dia':
        omnilinkEmDiaCount++;
        break;
      case 'prest_vencer':
        omnilinkPrestVencerCount++;
        break;
      case 'vencido':
        omnilinkVencidoCount++;
        break;
    }
  });

  const activeDrivers = allDrivers?.length || 0; // Assuming all registered drivers are active for this metric
  const indicados = allDrivers?.filter(d => d.status_indicacao === 'indicado' || d.status_indicacao === 'retificado').length || 0;
  const naoIndicados = allDrivers?.filter(d => d.status_indicacao === 'nao_indicado').length || 0;
  const totalVehicles = vehicles?.length || 0;

  // Calculate changes (mock data for demo)
  const incidentChange = Math.floor(Math.random() * 20) - 10;
  const driverChange = Math.floor(Math.random() * 10) + 1;
  const vehicleChange = Math.floor(Math.random() * 15) + 5;

  const metricsData = [
    {
      title: "Total de Ocorrências",
      value: totalIncidents,
      change: {
        value: incidentChange,
        label: "este mês",
        isPositive: incidentChange < 0, // Negative is good for incidents
      },
      icon: FileText,
      onClick: () => navigate("/history"),
    },
    {
      title: "Cadastros de motoristas",
      value: driversThisMonth,
      change: {
        value: driversThisMonth,
        label: `novos em ${currentMonthName}`,
        isPositive: driversThisMonth > 0,
      },
      icon: Users,
      onClick: () => navigate(`/drivers?month=${currentMonth + 1}&year=${currentYear}`),
    },
    {
      title: "Frota Ativa",
      value: totalVehicles,
      change: {
        value: vehicleChange,
        label: "crescimento",
        isPositive: true,
      },
      icon: Truck,
      onClick: () => navigate("/vehicles"),
    },
    // Unified Omnilink Status Card
    {
      title: "Status Omnilink", // This will be overridden by OmnilinkStatusCard's internal title
      value: totalDrivers, // This will be overridden by OmnilinkStatusCard's internal value
      icon: ShieldCheck, // This will be overridden by OmnilinkStatusCard's internal icon
      onClick: () => navigate("/driver-omnilink-status"), // Navigate to the new details page
      isUnifiedOmnilinkCard: true, // Custom flag to identify this entry
    },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {metricsData.map((metric, index) => (
        metric.isUnifiedOmnilinkCard ? (
          <OmnilinkStatusCard
            key={metric.title}
            totalDrivers={totalDrivers}
            onClick={metric.onClick}
          />
        ) : (
          <ModernStatsCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            change={metric.change}
            icon={metric.icon}
            onClick={metric.onClick}
            className="animate-fade-in"
          />
        )
      ))}
    </div>
  );
};