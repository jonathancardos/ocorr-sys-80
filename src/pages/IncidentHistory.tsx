import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  FileText,
  Loader2,
  ArrowUp,
  ArrowDown,
  FilterX
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { IncidentsOverviewCharts } from "@/components/history/IncidentsOverviewCharts"; // Import the new charts component
import { formatDate, formatTime } from '@/lib/driver-utils'; // Import new utility functions

type Incident = Tables<'incidents'>;
type SortColumn = keyof Incident | null;
type SortDirection = 'asc' | 'desc';

export const IncidentHistory = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [sortColumn, setSortColumn] = useState<SortColumn>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Fetch real incidents data
  const { data: incidents, isLoading, error } = useQuery<Incident[], Error>({
    queryKey: ['incidents'],
    queryFn: async () => {
      const { data, error } = await supabase.from('incidents').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredAndSortedIncidents = useMemo(() => {
    let currentIncidents = incidents || [];

    // Apply search term
    if (searchTerm) {
      currentIncidents = currentIncidents.filter(incident =>
        incident.incident_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.boNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== "all") {
      currentIncidents = currentIncidents.filter(incident => incident.status === filterStatus);
    }

    // Apply severity filter
    if (filterSeverity !== "all") {
      currentIncidents = currentIncidents.filter(incident => incident.severity === filterSeverity);
    }

    // Apply sorting
    if (sortColumn) {
      currentIncidents.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        // Handle null/undefined values for sorting
        if (valA === null || valA === undefined) return sortDirection === 'asc' ? 1 : -1;
        if (valB === null || valB === undefined) return sortDirection === 'asc' ? -1 : 1;
        return 0;
      });
    }

    return currentIncidents;
  }, [incidents, searchTerm, filterStatus, filterSeverity, sortColumn, sortDirection]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "resolved":
        return "success";
      case "open": // For 'Em análise' or 'Pendente'
        return "warning";
      default:
        return "outline";
    }
  };

  const getSeverityVariant = (severity: string | null) => {
    switch (severity) {
      case "baixo":
        return "riskLow";
      case "moderado":
        return "riskModerate";
      case "grave":
        return "riskGrave";
      case "critico": // Mapping 'gravissimo' to 'critico' for badge variant
        return "riskCritical";
      default:
        return "secondary";
    }
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return null;
    }
    return sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterSeverity('all');
    setSortColumn('created_at');
    setSortDirection('desc');
    toast.info("Filtros limpos", {
      description: "Todos os filtros foram removidos.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-destructive">
          <p>Erro ao carregar ocorrências: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

      {/* Overview Charts Section */}
      <IncidentsOverviewCharts incidents={incidents || []} />

      {/* Filters */}
      <Card className="modern-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Filtros de Ocorrências
          </CardTitle>
          <CardDescription>
            Refine sua busca por ocorrências específicas.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nº, título, descrição, local ou B.O..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="open">Em Análise/Pendente</SelectItem>
                  <SelectItem value="resolved">Concluído</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Risco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Riscos</SelectItem>
                  <SelectItem value="baixo">Baixo</SelectItem>
                  <SelectItem value="moderado">Moderado</SelectItem>
                  <SelectItem value="grave">Grave</SelectItem>
                  <SelectItem value="critico">Crítico</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="w-full sm:w-auto" onClick={handleClearFilters}>
                <FilterX className="h-4 w-4" />
                <span className="ml-2 sm:hidden">Limpar</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card className="modern-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Resultados ({filteredAndSortedIncidents.length} ocorrências)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => handleSort('incident_number')} className="cursor-pointer hover:text-primary whitespace-nowrap">
                    <div className="flex items-center">
                      Ocorrência {renderSortIcon('incident_number')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('date_occurred')} className="cursor-pointer hover:text-primary whitespace-nowrap">
                    <div className="flex items-center">
                      Data/Hora {renderSortIcon('date_occurred')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('title')} className="cursor-pointer hover:text-primary whitespace-nowrap">
                    <div className="flex items-center">
                      Título {renderSortIcon('title')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('location')} className="cursor-pointer hover:text-primary whitespace-nowrap">
                    <div className="flex items-center">
                      Local {renderSortIcon('location')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('cost_estimate')} className="cursor-pointer hover:text-primary whitespace-nowrap">
                    <div className="flex items-center">
                      Custo Estimado {renderSortIcon('cost_estimate')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('severity')} className="cursor-pointer hover:text-primary whitespace-nowrap">
                    <div className="flex items-center">
                      Risco {renderSortIcon('severity')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('status')} className="cursor-pointer hover:text-primary whitespace-nowrap">
                    <div className="flex items-center">
                      Status {renderSortIcon('status')}
                    </div>
                  </TableHead>
                  <TableHead className="text-right whitespace-nowrap">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedIncidents.length > 0 ? (
                  filteredAndSortedIncidents.map((incident) => (
                    <TableRow key={incident.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{incident.incident_number || '-'}</div>
                          <div className="text-xs text-muted-foreground">{incident.boNumber || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{formatDate(incident.date_occurred)}</div>
                          <div className="text-xs text-muted-foreground">{formatTime(incident.date_occurred)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium max-w-[150px] truncate">{incident.title || '-'}</TableCell>
                      <TableCell>
                        <div className="max-w-32 truncate" title={incident.location || ''}>
                          {incident.location || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {incident.cost_estimate ? `R$ ${incident.cost_estimate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getSeverityVariant(incident.severity)}>
                          {incident.severity || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(incident.status)}>
                          {incident.status === 'open' ? 'Em Análise' : incident.status === 'resolved' ? 'Concluído' : 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                      <p>Nenhuma ocorrência encontrada com os filtros aplicados.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};