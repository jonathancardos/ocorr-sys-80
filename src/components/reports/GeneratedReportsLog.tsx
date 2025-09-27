import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Calendar, Download, ExternalLink, FilterX, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type GeneratedReport = Tables<'generated_reports'> & {
  profiles?: { full_name: string | null; username: string | null };
};
type SortColumn = keyof GeneratedReport | null;
type SortDirection = 'asc' | 'desc';

export const GeneratedReportsLog: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortColumn, setSortColumn] = useState<SortColumn>('generated_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const { data: reports, isLoading, error } = useQuery<GeneratedReport[], Error>({
    queryKey: ['generatedReports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_reports')
        .select('*, profiles(full_name, username)') // Fetch related profile data
        .order('generated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const filteredAndSortedReports = useMemo(() => {
    let currentReports = reports || [];

    // Apply search term
    if (searchTerm) {
      currentReports = currentReports.filter(report =>
        report.report_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      currentReports = currentReports.filter(report => report.report_type === filterType);
    }

    // Apply sorting
    if (sortColumn) {
      currentReports.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (valA instanceof Date && valB instanceof Date) {
          return sortDirection === 'asc' ? valA.getTime() - valB.getTime() : valB.getTime() - valA.getTime();
        }
        // Handle null/undefined values for sorting
        if (valA === null || valA === undefined) return sortDirection === 'asc' ? 1 : -1;
        if (valB === null || valB === undefined) return sortDirection === 'asc' ? -1 : 1;
        return 0;
      });
    }

    return currentReports;
  }, [reports, searchTerm, filterType, sortColumn, sortDirection]);

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
      case 'incident_report': return 'Relatório de Ocorrências';
      default: return type;
    }
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
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="driver_report">Relatório de Motoristas</SelectItem>
              <SelectItem value="incident_report">Relatório de Ocorrências</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="w-full sm:w-auto" onClick={handleClearFilters}>
            <FilterX className="h-4 w-4" />
            <span className="ml-2 sm:hidden">Limpar</span>
          </Button>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow>
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
                <TableHead onClick={() => handleSort('generated_by')} className="cursor-pointer hover:text-primary whitespace-nowrap">
                  <div className="flex items-center">
                    Gerado Por {renderSortIcon('generated_by')}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('generated_at')} className="cursor-pointer hover:text-primary whitespace-nowrap">
                  <div className="flex items-center">
                    Data de Geração {renderSortIcon('generated_at')}
                  </div>
                </TableHead>
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
                    <TableCell className="font-medium">{getReportTypeLabel(report.report_type)}</TableCell>
                    <TableCell>{report.file_name || '-'}</TableCell>
                    <TableCell>{report.profiles?.full_name || report.profiles?.username || 'Usuário Desconhecido'}</TableCell>
                    <TableCell>{format(parseISO(report.generated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                    <TableCell>{report.start_date ? format(parseISO(report.start_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</TableCell>
                    <TableCell>{report.end_date ? format(parseISO(report.end_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</TableCell>
                    <TableCell className="text-right">
                      {report.file_url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={report.file_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {!report.file_url && (
                        <Button variant="ghost" size="sm" disabled>
                          <Download className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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