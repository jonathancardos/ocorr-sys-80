import { ModernMetricsGrid } from "./ModernMetricsGrid";
import { ModernChartsSection } from "./ModernChartsSection";
// import { RecentIncidents } from "./RecentIncidents"; // Removido
import { useNavigate } from "react-router-dom";

export const Dashboard = () => { // Removed onNewIncident prop
  const navigate = useNavigate();

  const handleNewIncident = () => {
    navigate("/new-incident");
  };

  return (
    <div className="min-h-screen space-y-8 animate-fade-in">
      {/* Modern Welcome Section - REMOVED */}

      {/* Modern Metrics Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
              Painel de Controle
            </h2>
            <p className="text-muted-foreground text-lg mt-2">
              Métricas em tempo real e insights inteligentes
            </p>
          </div>
        </div>
        
        <ModernMetricsGrid />
      </div>

      {/* Modern Charts Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 bg-gradient-to-b from-primary to-accent rounded-full" />
          <h3 className="text-2xl font-bold text-foreground">
            Análise Visual
          </h3>
        </div>
        
        <ModernChartsSection />
      </div>

      {/* Enhanced Recent Incidents - REMOVIDO */}
      {/*
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 bg-gradient-to-b from-accent to-primary rounded-full" />
          <h3 className="text-2xl font-bold text-foreground">
            Atividade Recente
          </h3>
        </div>
        
        <div className="rounded-3xl bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-xl border border-border/50 overflow-hidden">
          <RecentIncidents />
        </div>
      </div>
      */}
    </div>
  );
};