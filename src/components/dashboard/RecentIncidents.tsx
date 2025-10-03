import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Calendar, 
  MapPin, 
  User, 
  Eye,
  Clock
} from "lucide-react";

const mockIncidents = [
  {
    id: "OC001",
    date: "2024-01-15",
    time: "14:30",
    location: "Av. Paulista, 1000 - São Paulo/SP",
    driver: "João Silva",
    vehicle: "Mercedes ABC-1234",
    riskLevel: "riskGrave" as const,
    status: "Em análise",
    boNumber: "BO123456789"
  },
  {
    id: "OC002", 
    date: "2024-01-14",
    time: "09:15",
    location: "Rod. Anhanguera, KM 45 - Campinas/SP",
    driver: "Maria Santos",
    vehicle: "Volvo XYZ-5678",
    riskLevel: "riskModerate" as const,
    status: "Concluído",
    boNumber: "BO987654321"
  },
  {
    id: "OC003",
    date: "2024-01-13", 
    time: "16:45",
    location: "Centro de Distribuição - Guarulhos/SP",
    driver: "Carlos Oliveira",
    vehicle: "Scania DEF-9012",
    riskLevel: "riskLow" as const,
    status: "Pendente",
    boNumber: "BO456789123"
  }
];

const getStatusVariant = (status: string) => {
  switch (status) {
    case "Concluído":
      return "success";
    case "Em análise":
      return "warning";
    case "Pendente":
      return "outline";
    default:
      return "outline";
  }
};

export const RecentIncidents = () => {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Ocorrências Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockIncidents.map((incident) => (
            <div
              key={incident.id}
              className="p-4 rounded-lg border bg-gradient-card/50 hover:shadow-card transition-all duration-300" /* Adjusted transparency */
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2 sm:gap-0"> {/* Adjust for mobile stacking */}
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {incident.id} - {incident.boNumber}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {incident.date} às {incident.time}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={incident.riskLevel}>
                    {incident.riskLevel.replace('risk', '').toLowerCase()}
                  </Badge>
                  <Badge variant={getStatusVariant(incident.status)}>
                    {incident.status}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3"> {/* Ensure stacking on mobile */}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{incident.location}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{incident.driver}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-medium">{incident.vehicle}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};