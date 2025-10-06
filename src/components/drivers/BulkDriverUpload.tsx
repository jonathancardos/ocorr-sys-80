import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Upload, FileText, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { TablesInsert, Tables } from '@/integrations/supabase/types';
import * as XLSX from 'xlsx';
import { format, parseISO, parse } from 'date-fns'; // Importado 'parse'
import { ptBR } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth to get current user ID
import { calculateOmnilinkScoreStatus, calculateOmnilinkScoreExpiry } from '@/lib/driver-utils'; // Import from new utility

interface BulkDriverUploadProps {
  onUploadComplete: () => void;
  onClose: () => void;
}

interface ParsedDriverData {
  full_name: string;
  cpf: string;
  type: string | null;
  omnilink_score_registration_date: string | null;
  omnilink_score_expiry_date: string | null;
  omnilink_score_status: string | null;
  cnh_expiry: string | null;
  cnh: string | null;
  phone: string | null;
  status_indicacao: 'indicado' | 'retificado' | 'nao_indicado' | null;
}

type Step = 'selectFile' | 'mapColumns' | 'previewData';

const BulkDriverUpload: React.FC<BulkDriverUploadProps> = ({ onUploadComplete, onClose }) => {
  const { user } = useAuth(); // Get current user for uploaded_by field
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('selectFile');
  const [file, setFile] = useState<File | null>(null);
  const [spreadsheetHeaders, setSpreadsheetHeaders] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<Record<keyof ParsedDriverData, string | null>>({
    full_name: null,
    cpf: null,
    type: null,
    omnilink_score_registration_date: null,
    omnilink_score_expiry_date: null,
    omnilink_score_status: null,
    cnh_expiry: null,
    cnh: null,
    phone: null,
    status_indicacao: null,
  });
  const [parsedData, setParsedData] = useState<ParsedDriverData[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const dbColumns = {
    full_name: "Nome Completo do Motorista",
    cpf: "CPF do Motorista",
    type: "Tipo (Motorista/Agregado)",
    omnilink_score_registration_date: "Data de Cadastro Omnilink Score",
    cnh_expiry: "Validade da CNH",
    cnh: "CNH do Motorista",
    phone: "Telefone do Motorista",
    status_indicacao: "Status de Indicação",
  };

  // CNH removido dos campos obrigatórios
  const requiredColumns: (keyof ParsedDriverData)[] = ['full_name', 'cpf'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setParsedData([]);
      setUploadErrors([]);
      extractHeaders(selectedFile);
      setStep('mapColumns');
    }
  };

  const extractHeaders = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const headers: string[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[];
      setSpreadsheetHeaders(headers);

      // Attempt to auto-map common columns
      const autoMapped: Record<keyof ParsedDriverData, string | null> = { ...columnMappings };
      headers.forEach(header => {
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes('nome') && lowerHeader.includes('completo')) autoMapped.full_name = header;
        if (lowerHeader.includes('cpf')) autoMapped.cpf = header;
        if (lowerHeader.includes('tipo')) autoMapped.type = header;
        // Improved auto-mapping for omnilink_score_registration_date
        if ((lowerHeader.includes('reg.') || lowerHeader.includes('registro') || lowerHeader.includes('data')) && lowerHeader.includes('omnilink')) autoMapped.omnilink_score_registration_date = header;
        if ((lowerHeader.includes('validade') || lowerHeader.includes('vencimento')) && lowerHeader.includes('cnh')) autoMapped.cnh_expiry = header;
        if (lowerHeader.includes('cnh') && !lowerHeader.includes('validade') && !lowerHeader.includes('vencimento')) autoMapped.cnh = header;
        if (lowerHeader.includes('telefone') || lowerHeader.includes('fone')) autoMapped.phone = header;
        if (lowerHeader.includes('status') && lowerHeader.includes('indica')) autoMapped.status_indicacao = header;
      });
      setColumnMappings(autoMapped);
    };
    reader.readAsBinaryString(file);
  };

  const handleColumnMappingChange = (dbField: keyof ParsedDriverData, value: string) => {
    // Se o valor for "unmapped", defina como null
    setColumnMappings(prev => ({ ...prev, [dbField]: value === "unmapped" ? null : value }));
  };

  const parseMappedData = () => {
    console.log("parseMappedData called.");
    if (!file) {
      console.error("parseMappedData: No file selected.");
      toast.error("Nenhum arquivo selecionado", {
        description: "Por favor, selecione um arquivo de planilha antes de prosseguir.",
      });
      return;
    }

    const missingRequired = requiredColumns.filter(col => !columnMappings[col]);
    console.log("parseMappedData: Missing required columns:", missingRequired);

    if (missingRequired.length > 0) {
      const missingLabels = missingRequired.map(col => dbColumns[col]).join(', ');
      console.error("parseMappedData: Mapeamento incompleto. Faltando:", missingLabels);
      toast.error("Mapeamento incompleto", {
        description: `Por favor, mapeie as colunas obrigatórias: ${missingLabels}.`,
      });
      return;
    }

    console.log("parseMappedData: All required columns mapped. Proceeding to parse data.");

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' }); // Removed dateNF here
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json: any[] = XLSX.utils.sheet_to_json(worksheet, { raw: true }); // Get raw values

      const mappedData: ParsedDriverData[] = json.map((row, index) => {
        const getCellValue = (dbField: keyof ParsedDriverData) => {
          const header = columnMappings[dbField];
          return header ? row[header] : null;
        };

        const parseDateValue = (value: any): string | null => {
          let dateObj: Date | null = null;

          if (typeof value === 'number') {
            // Assume it's an Excel date serial number
            const excelDate = XLSX.SSF.parse_date_code(value);
            if (excelDate) {
              // Construct a Date object from the parsed Excel date components
              dateObj = new Date(excelDate.y, excelDate.m - 1, excelDate.d, excelDate.H, excelDate.M, excelDate.S);
            }
          } else if (typeof value === 'string' && value.trim() !== '') {
            // Try ISO format first (YYYY-MM-DD, YYYY/MM/DD, etc.)
            dateObj = parseISO(value);

            if (isNaN(dateObj.getTime())) {
              // Try DD/MM/YYYY
              try {
                dateObj = parse(value, 'dd/MM/yyyy', new Date());
              } catch (e) { /* ignore */ }
            }
          }

          if (dateObj && !isNaN(dateObj.getTime())) {
            return format(dateObj, 'yyyy-MM-dd');
          }
          return null;
        };

        const registrationDateStr = parseDateValue(getCellValue('omnilink_score_registration_date'));
        let omnilink_score_registration_date: string | null = registrationDateStr;
        let omnilink_score_expiry_date: string | null = null;
        let omnilink_score_status: string | null = null;

        if (omnilink_score_registration_date) {
          try {
            omnilink_score_expiry_date = calculateOmnilinkScoreExpiry(omnilink_score_registration_date);
            omnilink_score_status = calculateOmnilinkScoreStatus(omnilink_score_registration_date);
          } catch (e) {
            console.warn(`Invalid date format for row ${index + 1}, Omnilink Registration Date: ${omnilink_score_registration_date}`);
          }
        }

        const cnh_expiry = parseDateValue(getCellValue('cnh_expiry'));

        const fullName = getCellValue('full_name') || '';
        const cpf = String(getCellValue('cpf') || '').replace(/\D/g, ''); // Remove non-digits

        let statusIndicacao: 'indicado' | 'retificado' | 'nao_indicado' | null = null;
        const rawStatusIndicacao = String(getCellValue('status_indicacao') || '').toLowerCase();
        
        // Prioritize "não indicado" check
        if (rawStatusIndicacao.includes('não indicado') || rawStatusIndicacao.includes('nao indicado')) {
          statusIndicacao = 'nao_indicado';
        } else if (rawStatusIndicacao.includes('retificado')) {
          statusIndicacao = 'retificado';
        } else if (rawStatusIndicacao.includes('indicado')) {
          statusIndicacao = 'indicado';
        } else {
          statusIndicacao = 'nao_indicado'; // Default to 'nao_indicado' if not specified or invalid
        }

        return {
          full_name: fullName,
          cpf: cpf,
          type: getCellValue('type') || null,
          omnilink_score_registration_date,
          omnilink_score_expiry_date,
          omnilink_score_status,
          cnh: String(getCellValue('cnh') || '').replace(/\D/g, '') || null,
          phone: String(getCellValue('phone') || '').replace(/\D/g, '') || null,
          cnh_expiry,
          status_indicacao: statusIndicacao,
        };
      }).filter(driver => driver.full_name && driver.cpf); // Only include rows with name and CPF

      setParsedData(mappedData);
      if (mappedData.length === 0 && json.length > 0) {
        toast.warning("Nenhum dado válido encontrado", {
          description: "Verifique se as colunas obrigatórias foram mapeadas corretamente e estão preenchidas.",
        });
      } else if (mappedData.length < json.length) {
        toast.info("Algumas linhas foram ignoradas", {
          description: "Linhas sem 'Nome Completo' ou 'CPF' foram desconsideradas.",
        });
      }
      setStep('previewData');
    };
    reader.readAsBinaryString(file);
  };

  const bulkInsertDriversMutation = useMutation({
    mutationFn: async (driversToProcess: ParsedDriverData[]) => {
      const driversToInsert: TablesInsert<'drivers'>[] = [];
      const driversToPendingApproval: TablesInsert<'drivers_pending_approval'>[] = [];
      const uploadedById = user?.id || null;

      // Fetch all existing CPF and CNHs from the 'drivers' table
      const { data: existingDrivers, error: fetchError } = await supabase
        .from('drivers')
        .select('id, cpf, cnh');

      if (fetchError) throw new Error(`Erro ao buscar motoristas existentes: ${fetchError.message}`);

      const existingCpfMap = new Set(existingDrivers?.map(d => d.cpf));
      const existingCnhMap = new Set(existingDrivers?.filter(d => d.cnh).map(d => d.cnh));

      // Track duplicates within the current upload batch
      const batchCpfMap = new Set<string>();
      const batchCnhMap = new Set<string>();

      for (const driver of driversToProcess) {
        let reason: string | null = null;
        let originalDriverId: string | null = null;

        // Check for duplicate CPF in existing drivers
        if (existingCpfMap.has(driver.cpf)) {
          reason = 'duplicate_cpf';
          originalDriverId = existingDrivers?.find(d => d.cpf === driver.cpf)?.id || null;
        }
        // Check for duplicate CNH in existing drivers (only if CNH is provided)
        if (driver.cnh && existingCnhMap.has(driver.cnh)) {
          reason = reason ? `${reason}, duplicate_cnh` : 'duplicate_cnh';
          if (!originalDriverId) { // Only set if not already linked by CPF
            originalDriverId = existingDrivers?.find(d => d.cnh === driver.cnh)?.id || null;
          }
        }

        // Check for duplicate CPF within the current batch
        if (batchCpfMap.has(driver.cpf)) {
          reason = reason ? `${reason}, batch_duplicate_cpf` : 'batch_duplicate_cpf';
        } else {
          batchCpfMap.add(driver.cpf);
        }

        // Check for duplicate CNH within the current batch (only if CNH is provided)
        if (driver.cnh && batchCnhMap.has(driver.cnh)) {
          reason = reason ? `${reason}, batch_duplicate_cnh` : 'batch_duplicate_cnh';
        } else if (driver.cnh) {
          batchCnhMap.add(driver.cnh);
        }

        if (reason) {
          driversToPendingApproval.push({
            ...driver,
            status: 'pending',
            reason: reason,
            original_driver_id: originalDriverId,
            uploaded_by: uploadedById,
          });
        } else {
          driversToInsert.push(driver);
        }
      }

      let insertedCount = 0;
      let pendingCount = 0;

      if (driversToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('drivers')
          .insert(driversToInsert);
        if (insertError) {
          console.error('Error inserting unique drivers:', insertError);
          throw new Error(`Erro ao inserir motoristas únicos: ${insertError.message}`);
        }
        insertedCount = driversToInsert.length;
      }

      if (driversToPendingApproval.length > 0) {
        const { error: pendingError } = await supabase
          .from('drivers_pending_approval')
          .insert(driversToPendingApproval);
        if (pendingError) {
          console.error('Error inserting pending drivers:', pendingError);
          throw new Error(`Erro ao enviar motoristas para aprovação: ${pendingError.message}`);
        }
        pendingCount = driversToPendingApproval.length;
      }

      return { insertedCount, pendingCount };
    },
    onSuccess: ({ insertedCount, pendingCount }) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['driversPendingApproval'] }); // Invalidate new query key
      
      let description = '';
      if (insertedCount > 0) {
        description += `${insertedCount} motorista(s) cadastrado(s) com sucesso.`;
      }
      if (pendingCount > 0) {
        if (description) description += ' ';
        description += `${pendingCount} motorista(s) enviado(s) para aprovação do administrador.`;
      }
      if (insertedCount === 0 && pendingCount === 0) {
        description = "Nenhum motorista foi processado. Verifique os dados da planilha.";
      }

      toast.success("Upload em massa concluído!", {
        description: description,
      });
      onUploadComplete();
      onClose();
    },
    onError: (err: any) => {
      console.error('Error during bulk upload:', err);
      toast.error("Erro no upload em massa", {
        description: err.message || "Não foi possível cadastrar os motoristas.",
      });
      setUploadErrors([err.message || "Erro desconhecido ao inserir dados."]);
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  const handleBulkUpload = async () => {
    if (parsedData.length === 0) {
      toast.error("Nenhum dado para upload", {
        description: "Por favor, selecione um arquivo com dados válidos.",
      });
      return;
    }

    setUploading(true);
    setUploadErrors([]);

    await bulkInsertDriversMutation.mutateAsync(parsedData);
  };

  const getIndicacaoStatusBadgeVariant = (status: 'indicado' | 'retificado' | 'nao_indicado' | null) => {
    switch (status) {
      case 'indicado':
        return 'success';
      case 'retificado':
        return 'warning';
      case 'nao_indicado':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {step === 'selectFile' && (
        <div className="space-y-2">
          <Label htmlFor="spreadsheet-upload">Selecione a Planilha (.xlsx, .csv)</Label>
          <Input
            id="spreadsheet-upload"
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </DialogFooter>
        </div>
      )}

      {step === 'mapColumns' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Mapear Colunas da Planilha</h3>
          <p className="text-sm text-muted-foreground">
            Associe as colunas da sua planilha aos campos do sistema. Campos marcados com <span className="text-destructive">*</span> são obrigatórios.
          </p>
          <ScrollArea className="h-60 pr-4">
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(dbColumns).map(([dbField, label]) => (
                <div key={dbField} className="space-y-2">
                  <Label htmlFor={`map-${dbField}`}>
                    {label}
                    {requiredColumns.includes(dbField as keyof ParsedDriverData) && <span className="text-destructive">*</span>}
                  </Label>
                  <Select
                    value={columnMappings[dbField as keyof ParsedDriverData] || "unmapped"}
                    onValueChange={(value) => handleColumnMappingChange(dbField as keyof ParsedDriverData, value)}
                  >
                    <SelectTrigger id={`map-${dbField}`}>
                      <SelectValue placeholder="Selecione a coluna da planilha" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      <SelectItem value="unmapped">Nenhum</SelectItem> {/* Opção para desassociar */}
                      {spreadsheetHeaders.map(header => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setStep('selectFile')}>
              Voltar
            </Button>
            <Button type="button" onClick={parseMappedData} disabled={uploading}>
              <ArrowRight className="mr-2 h-4 w-4" />
              Próximo (Pré-visualizar)
            </Button>
          </DialogFooter>
        </div>
      )}

      {step === 'previewData' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Pré-visualização dos Dados ({parsedData.length} motoristas)</h3>
          <div className="overflow-x-auto custom-scrollbar max-h-60 border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>CNH</TableHead>
                  <TableHead>Validade CNH</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Reg. Omnilink</TableHead>
                  <TableHead>Venc. Omnilink</TableHead>
                  <TableHead>Status Omnilink</TableHead>
                  <TableHead>Status Indicação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedData.slice(0, 5).map((driver, index) => ( // Show first 5 rows as preview
                  <TableRow key={index}>
                    <TableCell className="font-medium">{driver.full_name}</TableCell>
                    <TableCell>{driver.cpf}</TableCell>
                    <TableCell>{driver.type || '-'}</TableCell>
                    <TableCell>{driver.cnh || '-'}</TableCell>
                    <TableCell>{driver.cnh_expiry ? format(parseISO(driver.cnh_expiry), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</TableCell>
                    <TableCell>{driver.phone || '-'}</TableCell>
                    <TableCell>{driver.omnilink_score_registration_date ? format(parseISO(driver.omnilink_score_registration_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</TableCell>
                    <TableCell>{driver.omnilink_score_expiry_date ? format(parseISO(driver.omnilink_score_expiry_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</TableCell>
                    <TableCell>
                      <Badge variant={driver.omnilink_score_status === 'em_dia' ? 'success' : 'destructive'}>
                        {driver.omnilink_score_status === 'em_dia' ? 'Em Dia' : 'Inapto'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getIndicacaoStatusBadgeVariant(driver.status_indicacao)}>
                        {driver.status_indicacao === 'indicado' ? 'Indicado' : driver.status_indicacao === 'retificado' ? 'Retificado' : 'Não Indicado'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {parsedData.length > 5 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground">
                      ... e mais {parsedData.length - 5} motoristas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {uploadErrors.length > 0 && (
            <div className="text-destructive text-sm space-y-1">
              <p className="font-semibold">Erros no Upload:</p>
              <ul className="list-disc pl-5">
                {uploadErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setStep('mapColumns')}>
              Voltar
            </Button>
            <Button
              type="button"
              onClick={handleBulkUpload}
              disabled={uploading || parsedData.length === 0}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Iniciar Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      )}
    </div>
  );
};

export default BulkDriverUpload;