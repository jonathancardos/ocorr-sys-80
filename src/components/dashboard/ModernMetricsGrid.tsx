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
  Target
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ModernMetricsGrid = () => {
  const navigate = useNavigate();

  // Fetch incidents data
  const { data: incidents } = useQuery({
    queryKey: ['dashboard-incidents'],
    queryFn: async () => {
      const { data, error } = await supabase.from('incidents').select('*');
      if (error) throw error;
      return data;
    },
  });

  // Fetch drivers data
  const { data: drivers } = useQuery({
    queryKey: ['dashboard-drivers'],
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
  const activeDrivers = drivers?.length || 0;
  const omnilinkEmDia = drivers?.filter(d => d.omnilink_score_status === 'em_dia').length || 0;
  const omnilinkInapto = drivers?.filter(d => d.omnilink_score_status === 'inapto').length || 0;
  const indicados = drivers?.filter(d => d.status_indicacao === 'indicado' || d.status_indicacao === 'retificado').length || 0;
  const naoIndicados = drivers?.filter(d => d.status_indicacao === 'nao_indicado').length || 0;
  const totalVehicles = vehicles?.length || 0;

  // Calculate changes (mock data for demo)
  const incidentChange = Math.floor(Math.random() * 20) - 10;
  const graveChange = Math.floor(Math.random() * 20) - 15;
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
      title: "Ocorrências Críticas",
      value: graveIncidents,
      change: {
        value: graveChange,
        label: "vs mês anterior",
        isPositive: graveChange < 0,
      },
      icon: AlertTriangle,
      onClick: () => navigate("/history"),
    },
    {
      title: "Motoristas Ativos",
      value: activeDrivers,
      change: {
        value: driverChange,
        label: "novos motoristas",
        isPositive: true,
      },
      icon: Users,
      onClick: () => navigate("/drivers"),
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
    {
      title: "Omnilink Em Dia",
      value: omnilinkEmDia,
      change: {
        value: Math.floor((omnilinkEmDia / (omnilinkEmDia + omnilinkInapto)) * 100) || 0,
        label: "taxa de conformidade",
        isPositive: true,
      },
      icon: CheckCircle,
      onClick: () => navigate("/drivers"),
    },
    {
      title: "Omnilink Inapto",
      value: omnilinkInapto,
      change: {
        value: Math.floor((omnilinkInapto / (omnilinkEmDia + omnilinkInapto)) * 100) || 0,
        label: "precisam atenção",
        isPositive: false,
      },
      icon: XCircle,
      onClick: () => navigate("/drivers"),
    },
    {
      title: "Motoristas Indicados",
      value: indicados,
      change: {
        value: Math.floor((indicados / (indicados + naoIndicados)) * 100) || 0,
        label: "taxa de indicação",
        isPositive: true,
      },
      icon: UserCheck,
      onClick: () => navigate("/drivers"),
    },
    {
      title: "Não Indicados",
      value: naoIndicados,
      change: {
        value: Math.floor((naoIndicados / (indicados + naoIndicados)) * 100) || 0,
        label: "pendentes",
        isPositive: false,
      },
      icon: UserX,
      onClick: () => navigate("/drivers"),
    },
    {
      title: "Índice de Segurança",
      value: `${Math.floor(((omnilinkEmDia + indicados) / (activeDrivers * 2)) * 100) || 95}%`,
      change: {
        value: 3,
        label: "melhoria contínua",
        isPositive: true,
      },
      icon: Shield,
      onClick: () => navigate("/reports"),
    },
    {
      title: "Performance Geral",
      value: `${Math.floor((totalIncidents > 0 ? (1 - graveIncidents / totalIncidents) : 1) * 100)}%`,
      change: {
        value: 8,
        label: "otimização",
        isPositive: true,
      },
      icon: Target,
      onClick: () => navigate("/reports"),
    },
    {
      title: "Atividade Mensal",
      value: `${totalIncidents + activeDrivers}`,
      change: {
        value: 12,
        label: "crescimento",
        isPositive: true,
      },
      icon: Activity,
      onClick: () => navigate("/reports"),
    },
    {
      title: "Valor em Gestão",
      value: "R$ 2.4M",
      change: {
        value: 15,
        label: "valorização",
        isPositive: true,
      },
      icon: TrendingUp,
      onClick: () => navigate("/reports"),
    },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
      {metricsData.map((metric, index) => (
        <ModernStatsCard
          key={metric.title}
          title={metric.title}
          value={metric.value}
          change={metric.change}
          icon={metric.icon}
          onClick={metric.onClick}
          className="animate-fade-in"
        />
      ))}
    </div>
  );
};