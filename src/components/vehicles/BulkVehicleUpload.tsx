import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Upload, FileText, CheckCircle, XCircle, ArrowRight, Info } from 'lucide-react'; // Adicionado Info icon
import { TablesInsert, Tables } from '@/integrations/supabase/types';
import * as XLSX from 'xlsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'; // Import Tooltip
import { VehicleInsert } from '@/types/vehicles'; // Import VehicleInsert

interface BulkVehicleUploadProps {
  onUploadComplete: () => void;
  onClose: () => void;
}

interface ParsedVehicleData {
  plate: string;
  model: string | null;
  technology: string[] | null;
  has_workshop: boolean | null;
  priority: number | null;
  blocker_installed: boolean | null;
  raw_priority_text: string | null; // NEW: To store original text for display
  raw_blocker_installed_text: string | null; // NEW: To store original text for display
}

type Step = 'selectFile' | 'mapColumns' | 'previewData';

const BulkVehicleUpload: React.FC<BulkVehicleUploadProps> = ({ onUploadComplete, onClose }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('selectFile');
  const [file, setFile] = useState<File | null>(null);
  const [spreadsheetHeaders, setSpreadsheetHeaders] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<Record<keyof ParsedVehicleData, string | null>>({
    plate: null,
    model: null,
    technology: null,
    has_workshop: null,
    priority: null,
    blocker_installed: null,
    raw_priority_text: null, // NEW
    raw_blocker_installed_text: null, // NEW
  });
  const [parsedData, setParsedData] = useState<ParsedVehicleData[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const dbColumns = {
    plate: "Placa do Veículo",
    model: "Modelo do Veículo",
    technology: "Tecnologias (separadas por vírgula)",
    has_workshop: "Tem Oficina? (Ex: 'Sim', 'Não', 'True', 'False', 1, 0)",
    priority: "Prioridade (Ex: 1, 2, 3, 'Baixa', 'Média', 'Alta')",
    blocker_installed: "Bloqueador Instalado? (Ex: 'Sim', 'Não', 'True', 'False', 1, 0)",
    raw_priority_text: "Prioridade (Texto Original)", // NEW
    raw_blocker_installed_text: "Bloqueador (Texto Original)", // NEW
  };

  const requiredColumns: (keyof ParsedVehicleData)[] = ['plate'];

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

      const autoMapped: Record<keyof ParsedVehicleData, string | null> = { ...columnMappings };
      headers.forEach(header => {
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes('placa')) autoMapped.plate = header;
        if (lowerHeader.includes('modelo')) autoMapped.model = header;
        if (lowerHeader.includes('tecnologia')) autoMapped.technology = header;
        if (lowerHeader.includes('oficina')) autoMapped.has_workshop = header;
        if (lowerHeader.includes('prioridade')) autoMapped.priority = header;
        if (lowerHeader.includes('bloqueador') && lowerHeader.includes('instalado')) autoMapped.blocker_installed = header;
      });
      setColumnMappings(autoMapped);
    };
    reader.readAsBinaryString(file);
  };

  const handleColumnMappingChange = (dbField: keyof ParsedVehicleData, value: string) => {
    setColumnMappings(prev => ({ ...prev, [dbField]: value === "unmapped" ? null : value }));
  };

  const parseMappedData = () => {
    if (!file) {
      toast.error("Nenhum arquivo selecionado", {
        description: "Por favor, selecione um arquivo de planilha antes de prosseguir.",
      });
      return;
    }

    const missingRequired = requiredColumns.filter(col => !columnMappings[col]);
    if (missingRequired.length > 0) {
      const missingLabels = missingRequired.map(col => dbColumns[col]).join(', ');
      toast.error("Mapeamento incompleto", {
        description: `Por favor, mapeie as colunas obrigatórias: ${missingLabels}.`,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json: any[] = XLSX.utils.sheet_to_json(worksheet, { raw: true });

      console.log("BulkVehicleUpload: Column Mappings:", columnMappings);
      console.log("BulkVehicleUpload: Raw JSON data from spreadsheet:", json);

      const mappedData: ParsedVehicleData[] = json.map((row, index) => {
        const getCellValue = (dbField: keyof ParsedVehicleData) => {
          const header = columnMappings[dbField];
          return header ? row[header] : null;
        };

        let plate = String(getCellValue('plate') || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (plate.length === 7 && !plate.includes('-')) {
          plate = plate.slice(0, 3) + '-' + plate.slice(3);
        }

        const model = String(getCellValue('model') || '').trim() || null;
        const technologyRaw = String(getCellValue('technology') || '').trim();
        const technology = technologyRaw ? technologyRaw.split(',').map(t => t.trim()).filter(t => t !== '') : null;
        
        let hasWorkshop: boolean | null = null;
        const rawHasWorkshop = getCellValue('has_workshop');
        if (typeof rawHasWorkshop === 'boolean') {
          hasWorkshop = rawHasWorkshop;
        } else if (typeof rawHasWorkshop === 'number') {
          if (rawHasWorkshop === 1) hasWorkshop = true;
          else if (rawHasWorkshop === 0) hasWorkshop = false;
        } else if (typeof rawHasWorkshop === 'string' && rawHasWorkshop.trim() !== '') {
          const lowerCaseHasWorkshop = rawHasWorkshop.toLowerCase();
          if (['sim', 'true', '1', 's', 't', 'yes'].includes(lowerCaseHasWorkshop)) {
            hasWorkshop = true;
          } else if (['não', 'nao', 'false', '0', 'n', 'f', 'no'].includes(lowerCaseHasWorkshop)) {
            hasWorkshop = false;
          }
        }

        let priority: number | null = null;
        const rawPriority = String(getCellValue('priority') || '').trim();
        const raw_priority_text = rawPriority || null; // Store original text
        console.log(`Row ${index + 1} - Raw Priority: '${rawPriority}'`); // Log para depuração
        if (rawPriority) {
          const lowerCasePriority = rawPriority.toLowerCase();
          console.log(`Row ${index + 1} - Lowercase Priority: '${lowerCasePriority}'`); // Log para depuração

          // Tenta extrair número se for algo como "Prioridade 1" ou apenas o número
          const priorityMatch = lowerCasePriority.match(/(\d+)/);
          if (priorityMatch && !isNaN(parseInt(priorityMatch[1], 10))) {
            priority = parseInt(priorityMatch[1], 10);
          } else {
            // Se não encontrou um número direto, tenta mapear por texto
            if (['baixa', 'low', '1'].includes(lowerCasePriority)) {
              priority = 1;
            } else if (['media', 'média', 'medium', '2'].includes(lowerCasePriority)) {
              priority = 2;
            } else if (['alta', 'high', '3'].includes(lowerCasePriority)) {
              priority = 3;
            }
          }
        }
        console.log(`Row ${index + 1} - Final Priority: ${priority}`); // Log para depuração

        let blockerInstalled: boolean | null = null;
        const rawBlockerInstalled = String(getCellValue('blocker_installed') || '').trim();
        const raw_blocker_installed_text = rawBlockerInstalled || null; // Store original text
        console.log(`Row ${index + 1} - Raw Blocker Installed: '${rawBlockerInstalled}'`); // Log para depuração
        if (rawBlockerInstalled) {
          const lowerCaseBlocker = rawBlockerInstalled.toLowerCase();
          console.log(`Row ${index + 1} - Lowercase Blocker Installed: '${lowerCaseBlocker}'`); // Log para depuração

          if (['sim', 'true', '1', 's', 't', 'yes', 'instalado', 'com bloqueador'].includes(lowerCaseBlocker)) {
            blockerInstalled = true;
          } else if (['não', 'nao', 'false', '0', 'n', 'f', 'no', 'não instalado', 'nao instalado', 'sem bloqueador'].includes(lowerCaseBlocker)) {
            blockerInstalled = false;
          }
        }
        console.log(`Row ${index + 1} - Final Blocker Installed: ${blockerInstalled}`); // Log para depuração

        return {
          plate,
          model,
          technology,
          has_workshop: hasWorkshop,
          priority: priority,
          blocker_installed: blockerInstalled,
          raw_priority_text, // NEW
          raw_blocker_installed_text, // NEW
        };
      }).filter(vehicle => vehicle.plate);

      setParsedData(mappedData);
      if (mappedData.length === 0 && json.length > 0) {
        toast.warning("Nenhum dado válido encontrado", {
          description: "Verifique se as colunas obrigatórias foram mapeadas corretamente e estão preenchidas.",
        });
      } else if (mappedData.length < json.length) {
        toast.info("Algumas linhas foram ignoradas", {
          description: "Linhas sem 'Placa do Veículo' foram desconsideradas.",
        });
      }
      setStep('previewData');
    };
    reader.readAsBinaryString(file);
  };

  const bulkInsertVehiclesMutation = useMutation({
    mutationFn: async (vehiclesToProcess: ParsedVehicleData[]) => {
      const vehiclesToInsert: VehicleInsert[] = [];
      const vehiclesToPendingApproval: TablesInsert<'vehicles_pending_approval'>[] = [];
      const uploadedById = user?.id || null;

      const { data: existingVehicles, error: fetchError } = await supabase
        .from('vehicles')
        .select('id, plate');

      if (fetchError) throw new Error(`Erro ao buscar veículos existentes: ${fetchError.message}`);

      const existingPlateMap = new Set(existingVehicles?.map(v => v.plate));

      const batchPlateMap = new Set<string>();

      for (const vehicle of vehiclesToProcess) {
        let reason: string | null = null;
        let originalVehicleId: string | null = null;

        if (existingPlateMap.has(vehicle.plate)) {
          reason = 'duplicate_plate';
          originalVehicleId = existingVehicles?.find(v => v.plate === vehicle.plate)?.id || null;
        }

        if (batchPlateMap.has(vehicle.plate)) {
          reason = reason ? `${reason}, batch_duplicate_plate` : 'batch_duplicate_plate';
        } else {
          batchPlateMap.add(vehicle.plate);
        }

        if (reason) {
          vehiclesToPendingApproval.push({
            ...vehicle,
            status: 'pending',
            reason: reason,
            original_vehicle_id: originalVehicleId,
            uploaded_by: uploadedById,
          });
        } else {
          vehiclesToInsert.push({ ...vehicle, uploaded_by: uploadedById });
        }
      }

      let insertedCount = 0;
      let pendingCount = 0;

      if (vehiclesToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('vehicles')
          .insert(vehiclesToInsert);
        if (insertError) {
          console.error('Error inserting unique vehicles:', insertError);
          throw new Error(`Erro ao inserir motoristas únicos: ${insertError.message}`);
        }
        insertedCount = vehiclesToInsert.length;
      }

      if (vehiclesToPendingApproval.length > 0) {
        const { error: pendingError } = await supabase
          .from('vehicles_pending_approval')
          .insert(vehiclesToPendingApproval);
        if (pendingError) {
          console.error('Error inserting pending vehicles:', pendingError);
          throw new Error(`Erro ao enviar motoristas para aprovação: ${pendingError.message}`);
        }
        pendingCount = vehiclesToPendingApproval.length;
      }

      return { insertedCount, pendingCount };
    },
    onSuccess: ({ insertedCount, pendingCount }) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehiclesPendingApproval'] });
      
      let description = '';
      if (insertedCount > 0) {
        description += `${insertedCount} veículo(s) cadastrado(s) com sucesso.`;
      }
      if (pendingCount > 0) {
        if (description) description += ' ';
        description += `${pendingCount} veículo(s) enviado(s) para aprovação do administrador.`;
      }
      if (insertedCount === 0 && pendingCount === 0) {
        description = "Nenhum veículo foi processado. Verifique os dados da planilha.";
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
        description: err.message || "Não foi possível cadastrar os veículos.",
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

    await bulkInsertVehiclesMutation.mutateAsync(parsedData);
  };

  const getReasonBadgeVariant = (reason: string) => {
    if (reason.includes('duplicate_plate') || reason.includes('batch_duplicate')) return 'warning';
    return 'secondary';
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
                    {requiredColumns.includes(dbField as keyof ParsedVehicleData) && <span className="text-destructive">*</span>}
                  </Label>
                  <Select
                    value={columnMappings[dbField as keyof ParsedVehicleData] || "unmapped"}
                    onValueChange={(value) => handleColumnMappingChange(dbField as keyof ParsedVehicleData, value)}
                  >
                    <SelectTrigger id={`map-${dbField}`}>
                      <SelectValue placeholder="Selecione a coluna da planilha" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      <SelectItem value="unmapped">Nenhum</SelectItem>
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
          <h3 className="text-lg font-semibold">Pré-visualização dos Dados ({parsedData.length} veículos)</h3>
          <div className="overflow-x-auto custom-scrollbar max-h-60 border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Tecnologias</TableHead>
                  <TableHead>Tem Oficina?</TableHead>
                  {/* REMOVIDO: <TableHead>Prioridade (Convertido)</TableHead> */}
                  <TableHead>Prioridade (Original)</TableHead>
                  {/* REMOVIDO: <TableHead>Bloqueador (Convertido)</TableHead> */}
                  <TableHead>Bloqueador (Original)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedData.slice(0, 5).map((vehicle, index) => ( // Show first 5 rows as preview
                  <TableRow key={index}>
                    <TableCell className="font-medium">{vehicle.plate}</TableCell>
                    <TableCell>{vehicle.model || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(vehicle.technology || []).map(tech => (
                          <Badge key={tech} variant="outline">{tech}</Badge>
                        ))}
                        {(vehicle.technology || []).length === 0 && '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {vehicle.has_workshop === true ? 'Sim' : vehicle.has_workshop === false ? 'Não' : '-'}
                    </TableCell>
                    {/* REMOVIDO: <TableCell>
                      {vehicle.priority !== null ? vehicle.priority : <span className="text-destructive">Inválido</span>}
                    </TableCell> */}
                    <TableCell>
                      {vehicle.raw_priority_text || '-'}
                    </TableCell>
                    {/* REMOVIDO: <TableCell>
                      {vehicle.blocker_installed !== null ? (vehicle.blocker_installed ? 'Sim' : 'Não') : <span className="text-destructive">Inválido</span>}
                    </TableCell> */}
                    <TableCell>
                      {vehicle.raw_blocker_installed_text || '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {parsedData.length > 5 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground"> {/* Ajustado colSpan */}
                      ... e mais {parsedData.length - 5} veículos
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

export default BulkVehicleUpload;