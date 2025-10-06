import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModernWelcomeSectionProps {
  onNewIncident?: () => void;
}

export const ModernWelcomeSection = ({ onNewIncident }: ModernWelcomeSectionProps) => {
  const { profile } = useAuth();

  const currentHour = new Date().getHours();
  const getGreeting = () => {
    if (currentHour < 12) return "Bom dia";
    if (currentHour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const getMotivationalMessage = () => {
    const messages = [
      "Pronto para mais um dia produtivo?",
      "Vamos alcançar novos patamares hoje!",
      "Sua dedicação faz a diferença.",
      "Juntos, construímos o futuro.",
      "Inovação começa aqui.",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-4 text-primary-foreground">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 h-64 w-64 opacity-20">
          <div className="h-full w-full rounded-full bg-gradient-radial from-white/20 to-transparent blur-3xl" />
        </div>
        <div className="absolute bottom-0 left-0 h-48 w-48 opacity-15">
          <div className="h-full w-full rounded-full bg-gradient-radial from-accent/30 to-transparent blur-2xl" />
        </div>
        
        {/* Animated Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div className="h-1 w-1 rounded-full bg-white/30" />
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-full bg-white/20 p-2 backdrop-blur-sm">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight">
              {getGreeting()}, {profile?.full_name || profile?.username || "Usuário"}!
            </h1>
            <p className="text-sm text-primary-foreground/80">
              {getMotivationalMessage()}
            </p>
          </div>
        </div>
      </div>

      {/* Animated Border */}
      <div className="absolute inset-0 rounded-3xl border-2 border-white/20" />
      <div className="absolute inset-0 rounded-3xl border border-white/10 animate-pulse" />
    </div>
  );
};