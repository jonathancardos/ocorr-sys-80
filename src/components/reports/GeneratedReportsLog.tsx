import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Calendar, Download, ExternalLink, FilterX, Search, ArrowUp, ArrowDown, Repeat, Trash2, Share2, Car } from 'lucide-react'; // Added Car icon
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';

type Json = Tables<'generated_reports'>['metadata']; // Import Json type from Tables

// Definindo o tipo para a view, incluindo os campos do perfil
type ReportWithProfile = Tables<'generated_reports'> & {
  profile_full_name: string | null;
  profile_username: string | null;
  profile_email: string | null;
};

type SortColumn = keyof ReportWithProfile | null;
type SortDirection = 'asc' | 'desc';

export const GeneratedReportsLog: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortColumn, setSortColumn] = useState<SortColumn>('generated_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);

  const { data: reports, isLoading, error } = useQuery({
    queryKey: ['reportsWithProfiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports_with_profiles' as any)
        .select('*')
        .order('generated_at', { ascending: false });

      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const filteredAndSortedReports = useMemo(() => {
    let currentReports = reports || [];

    if (searchTerm) {
      currentReports = currentReports.filter(report =>
        report.report_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.profile_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.profile_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getGeneratedViaLabel(report.metadata).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      currentReports = currentReports.filter(report => report.report_type === filterType);
    }

    if (sortColumn) {
      currentReports.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (valA instanceof Date && valB instanceof Date) {
          return sortDirection === 'asc' ? valA.getTime() - valB.getTime() : valB.getTime() - a.getTime();
        }
        if (valA === null || valA === undefined) return sortDirection === 'asc' ? 1 : -1;
        if (valB === null || valB === undefined) return sortDirection === 'asc' ? -1 : 1;
        return 0;
      });
    }

    return currentReports;
  }, [reports, searchTerm, filterType, sortColumn, sortDirection]);

  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from('generated_reports')
        .delete()
        .eq('id', reportId);
      if (error) throw error;
      return reportId;
    },
    onSuccess: (deletedReportId) => {
      queryClient.invalidateQueries({ queryKey: ['reportsWithProfiles'] });
      toast.success("Relatório excluído!", {
        description: "O registro do relatório foi removido do histórico.",
      });
      setSelectedReportIds(prev => prev.filter(id => id !== deletedReportId));
    },
    onError: (err: any) => {
      console.error('Error deleting report:', err);
      toast.error("Erro ao excluir relatório", {
        description: err.message || "Não foi possível excluir o registro do relatório.",
      });
    },
  });

  const bulkDeleteReportsMutation = useMutation({
    mutationFn: async (reportIds: string[]) => {
      const { error } = await supabase
        .from('generated_reports')
        .delete()
        .in('id', reportIds);
      if (error) throw error;
    },
    onSuccess: (data, ids) => {
      queryClient.invalidateQueries({ queryKey: ['reportsWithProfiles'] });
      toast.success("Relatórios excluídos!", {
        description: `${ids.length} registro(s) de relatório(s) foram removido(s) do histórico.`,
      });
      setSelectedReportIds([]);
    },
    onError: (err: any) => {
      console.error('Error bulk deleting reports:', err);
      toast.error("Erro ao excluir relatórios", {
        description: err.message || "Não foi possível excluir os registros de relatórios selecionados.",
      });
    },
  });

  const handleDeleteSelectedReports = () => {
    if (selectedReportIds.length === 0) return;
    bulkDeleteReportsMutation.mutate(selectedReportIds);
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
    setFilterType('all');
    setSortColumn('generated_at');
    setSortDirection('desc');
    toast.info("Filtros limpos", {
      description: "Todos os filtros foram removidos.",
    });
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'driver_report': return 'Relatório de Motoristas';
      case 'vehicle_report': return 'Relatório de Veículos'; // New case
      case 'incident_report': return 'Relatório de Ocorrências';
      default: return type;
    }
  };

  const getGeneratedViaLabel = (metadata: Json | null) => {
    if (metadata && typeof metadata === 'object' && 'sharedVia' in metadata) {
      const sharedVia = (metadata as { sharedVia: string }).sharedVia;
      switch (sharedVia) {
        case 'pdf_download': return 'PDF (Download)';
        case 'whatsapp': return 'WhatsApp';
        default: return 'N/A';
      }
    }
    return 'N/A';
  };

  const handleRegenerateReport = (report: ReportWithProfile) => {
    if (report.report_type === 'driver_report') {
      const startDateParam = report.start_date ? format(parseISO(report.start_date), 'yyyy-MM-dd') : '';
      const endDateParam = report.end_date ? format(parseISO(report.end_date), 'yyyy-MM-dd') : '';
      navigate(`/reports?tab=generators&reportType=driver_report&startDate=${startDateParam}&endDate=${endDateParam}`);
      toast.info("Gerador de relatório aberto", {
        description: "As datas foram pré-preenchidas para você.",
      });
    } else if (report.report_type === 'vehicle_report') { // New case for vehicle report
      // For vehicle reports, we might need to pass the filter type
      const filterParam = report.metadata && typeof report.metadata === 'object' && 'filter' in report.metadata
        ? (report.metadata as { filter: string }).filter
        : 'all';
      navigate(`/reports?tab=generators&reportType=vehicle_report&filterType=${filterParam}`);
      toast.info("Gerador de relatório aberto", {
        description: "O filtro foi pré-selecionado para você.",
      });
    }
    else {
      toast.info("Funcionalidade em desenvolvimento", {
        description: "A re-geração para este tipo de relatório ainda não está disponível.",
      });
    }
  };

  const handleDeleteReport = (reportId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este registro de relatório?")) {
      deleteReportMutation.mutate(reportId);
    }
  };

  const handleSelectReport = (reportId: string, isChecked: boolean) => {
    setSelectedReportIds(prev =>
      isChecked ? [...prev, reportId] : prev.filter(id => id !== reportId)
    );
  };

  const handleSelectAllReports = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedReportIds(filteredAndSortedReports.map(report => report.id));
    } else {
      setSelectedReportIds([]);
    }
  };

  const allReportsSelected = filteredAndSortedReports.length > 0 && selectedReportIds.length === filteredAndSortedReports.length;
  const someReportsSelected = selectedReportIds.length > 0 && selectedReportIds.length < filteredAndSortedReports.length;

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
          <p>Erro ao carregar histórico de relatórios: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="modern-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Histórico de Relatórios Gerados
        </CardTitle>
        <CardDescription>
          Visualize e gerencie todos os relatórios que foram gerados no sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por tipo, nome do arquivo ou gerador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por Tipo" />
            </SelectTrigger>
            <SelectContent className="bg-card/20 backdrop-blur-md border border-border/50">
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="driver_report">Relatório de Motoristas</SelectItem>
              <SelectItem value="vehicle_report">Relatório de Veículos</SelectItem> {/* New filter option */}
              <SelectItem value="incident_report">Relatório de Ocorrências</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="w-full sm:w-auto" onClick={handleClearFilters}>
            <FilterX className="h-4 w-4" />
            <span className="ml-2 sm:hidden">Limpar</span>
          </Button>
        </div>

        {selectedReportIds.length > 0 && (
          <div className="mb-4 flex justify-end">
            <Button
              variant="destructive"
              onClick={handleDeleteSelectedReports}
              disabled={bulkDeleteReportsMutation.isPending}
            >
              {bulkDeleteReportsMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Excluir Selecionados ({selectedReportIds.length})
            </Button>
          </div>
        )}

        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={allReportsSelected}
                    indeterminate={someReportsSelected ? true : undefined}
                    onCheckedChange={(checked: boolean) => handleSelectAllReports(checked)}
                    aria-label="Selecionar todos os relatórios"
                  />
                </TableHead>
                <TableHead onClick={() => handleSort('report_type')} className="cursor-pointer hover:text-primary whitespace-nowrap">
                  <div className="flex items-center">
                    Tipo de Relatório {renderSortIcon('report_type')}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('file_name')} className="cursor-pointer hover:text-primary whitespace-nowrap">
                  <div className="flex items-center">
                    Nome do Arquivo {renderSortIcon('file_name')}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('profile_full_name')} className="cursor-pointer hover:text-primary whitespace-nowrap">
                  <div className="flex items-center">
                    Gerado Por {renderSortIcon('profile_full_name')}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('generated_at')} className="cursor-pointer hover:text-primary whitespace-nowrap">
                  <div className="flex items-center">
                    Data de Geração {renderSortIcon('generated_at')}
                  </div>
                </TableHead>
                <TableHead className="whitespace-nowrap">Gerado Via</TableHead>
                <TableHead onClick={() => handleSort('start_date')} className="cursor-pointer hover:text-primary whitespace-nowrap">
                  <div className="flex items-center">
                    Período (Início) {renderSortIcon('start_date')}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('end_date')} className="cursor-pointer hover:text-primary whitespace-nowrap">
                  <div className="flex items-center">
                    Período (Fim) {renderSortIcon('end_date')}
                  </div>
                </TableHead>
                <TableHead className="text-right whitespace-nowrap">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedReports.length > 0 ? (
                filteredAndSortedReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedReportIds.includes(report.id)}
                        onCheckedChange={(checked: boolean) => handleSelectReport(report.id, checked)}
                        aria-label={`Selecionar relatório ${report.file_name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{getReportTypeLabel(report.report_type)}</TableCell>
                    <TableCell>{report.file_name || '-'}</TableCell>
                    <TableCell>{report.profile_full_name || report.profile_username || 'Usuário Desconhecido'}</TableCell>
                    <TableCell>{format(parseISO(report.generated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                    <TableCell>{getGeneratedViaLabel(report.metadata)}</TableCell>
                    <TableCell>{report.start_date ? format(parseISO(report.start_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</TableCell>
                    <TableCell>{report.end_date ? format(parseISO(report.end_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {report.file_url && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={report.file_url} target="_blank" rel="noopener noreferrer" title="Baixar PDF">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {report.metadata?.sharedVia === 'whatsapp' && (
                          <Button variant="ghost" size="sm" title="Compartilhado via WhatsApp" disabled>
                            <Share2 className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleRegenerateReport(report)} title="Refazer Relatório">
                          <Repeat className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteReport(report.id)} title="Excluir Registro" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    <p>Nenhum relatório gerado encontrado.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};