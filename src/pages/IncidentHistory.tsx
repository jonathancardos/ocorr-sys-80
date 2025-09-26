import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Calendar,
  Download,
  Eye,
  Filter,
  Search,
  FileText
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
    status: "Concluído",
    boNumber: "BO123456789",
    cargoValue: "R$ 150.000",
    lossValue: "R$ 25.000"
  },
  {
    id: "OC002",
    date: "2024-01-14", 
    time: "09:15",
    location: "Rod. Anhanguera, KM 45 - Campinas/SP",
    driver: "Maria Santos",
    vehicle: "Volvo XYZ-5678",
    riskLevel: "riskModerate" as const,
    status: "Em análise",
    boNumber: "BO987654321",
    cargoValue: "R$ 85.000",
    lossValue: "R$ 8.500"
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
    boNumber: "BO456789123",
    cargoValue: "R$ 45.000",
    lossValue: "R$ 2.100"
  },
  {
    id: "OC004",
    date: "2024-01-12",
    time: "11:20",
    location: "Terminal de Cargas - Santos/SP", 
    driver: "Ana Costa",
    vehicle: "Iveco GHI-3456",
    riskLevel: "riskCritical" as const,
    status: "Concluído",
    boNumber: "BO789123456",
    cargoValue: "R$ 320.000",
    lossValue: "R$ 180.000"
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

export const IncidentHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");

  const filteredIncidents = mockIncidents.filter(incident => {
    const matchesSearch = 
      incident.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.boNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || incident.status === filterStatus;
    const matchesRisk = filterRisk === "all" || incident.riskLevel === filterRisk;
    
    return matchesSearch && matchesStatus && matchesRisk;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"> {/* Make header responsive */}
        <div>
          <h2 className="text-3xl font-bold text-foreground">Histórico de Ocorrências</h2>
          <p className="text-muted-foreground">
            Consulte e gerencie todas as ocorrências registradas
          </p>
        </div>
        <Button className="bg-gradient-corporate shadow-corporate">
          <Download className="mr-2 h-4 w-4" />
          Exportar Relatório
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ocorrência, motorista, veículo ou B.O..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2"> {/* Make filters responsive */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-40"> {/* Adjust width for mobile */}
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Em análise">Em análise</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterRisk} onValueChange={setFilterRisk}>
                <SelectTrigger className="w-full sm:w-40"> {/* Adjust width for mobile */}
                  <SelectValue placeholder="Risco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Riscos</SelectItem>
                  <SelectItem value="riskLow">Baixo</SelectItem>
                  <SelectItem value="riskModerate">Moderado</SelectItem>
                  <SelectItem value="riskGrave">Grave</SelectItem>
                  <SelectItem value="riskCritical">Crítico</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="w-full sm:w-auto"> {/* Adjust width for mobile */}
                <Filter className="h-4 w-4" />
                <span className="ml-2 sm:hidden">Filtrar</span> {/* Show text on mobile */}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Resultados ({filteredIncidents.length} ocorrências)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto custom-scrollbar"> {/* Add overflow-x-auto for responsive tables */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ocorrência</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Valor Carga</TableHead>
                  <TableHead>Perda</TableHead>
                  <TableHead>Risco</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncidents.map((incident) => (
                  <TableRow key={incident.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{incident.id}</div>
                        <div className="text-xs text-muted-foreground">{incident.boNumber}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{incident.date}</div>
                        <div className="text-xs text-muted-foreground">{incident.time}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{incident.driver}</TableCell>
                    <TableCell className="font-medium">{incident.vehicle}</TableCell>
                    <TableCell>
                      <div className="max-w-32 truncate" title={incident.location}>
                        {incident.location}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {incident.cargoValue}
                    </TableCell>
                    <TableCell className="font-medium text-destructive">
                      {incident.lossValue}
                    </TableCell>
                    <TableCell>
                      <Badge variant={incident.riskLevel}>
                        {incident.riskLevel.replace('risk', '').toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(incident.status)}>
                        {incident.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};