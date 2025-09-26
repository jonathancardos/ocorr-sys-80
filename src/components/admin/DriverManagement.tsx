import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserPlus, Edit2, Trash2, Loader2, Shield, Upload, CheckCircle, UserCheck, UserX,
  RefreshCw, FilterX, Info, Search, ArrowUp, ArrowDown, Filter, ListFilter, MoreVertical
} from 'lucide-react';
import { format, parseISO, isAfter, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import BulkDriverUpload from '@/components/drivers/BulkDriverUpload';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DuplicateDriverDialog } from '@/components/drivers/DuplicateDriverDialog';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';


type Driver = Tables<'drivers'>;
type DriverPendingApproval = Tables<'drivers_pending_approval'>;

// Extend DriverPendingApproval to include duplicate driver info
type DriverPendingApprovalWithInfo = DriverPendingApproval & {
  duplicateDriverInfo?: Pick<Driver, 'id' | 'full_name' | 'cpf' | 'cnh' | 'cnh_expiry' | 'phone' | 'type' | 'omnilink_score_registration_date' | 'omnilink_score_expiry_date' | 'omnilink_score_status' | 'status_indicacao' | 'reason_nao_indicacao'> | null;
};

// Define a union type for items in the combined list
type CombinedDriverItem =
  | ({ _itemType: 'registered' } & Driver)
  | ({ _itemType: 'pending_duplicate' | 'pending_new' } & DriverPendingApprovalWithInfo);

type FilterCriteria = {
  type: 'original_driver_id' | 'reason';
  value: string;
} | null;

type SortColumn = keyof Driver | 'status' | 'omnilink_score_status' | 'status_indicacao' | null;
type SortDirection = 'asc' | 'desc';

const DriverManagement = () => {
  const { profile, user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRegisteredDriverIds, setSelectedRegisteredDriverIds] = useState<string[]>([]);
  const [selectedPendingDriverIds, setSelectedPendingDriverIds] = useState<string[]>([]);
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>(null);

  // New state for filters and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'registered' | 'pending' | 'duplicates'>('all');
  const [filterOmnilinkStatus, setFilterOmnilinkStatus] = useState<'all' | 'em_dia' | 'inapto'>('all');
  const [filterIndicacaoStatus, setFilterIndicacaoStatus] = useState<'all' | 'indicado' | 'retificado' | 'nao_indicado'>('all');

  const [sortColumn, setSortColumn] = useState<SortColumn>('full_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [formData, setFormData] = useState<TablesInsert<'drivers'>>({
    full_name: '',
    cpf: '',
    cnh: null,
    cnh_expiry: null,
    phone: null,
    type: null,
    omnilink_score_registration_date: null,
    omnilink_score_expiry_date: null,
    omnilink_score_status: null,
    status_indicacao: 'nao_indicado',
    reason_nao_indicacao: null,
  });

  // State for the DuplicateDriverDialog
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [currentDuplicateData, setCurrentDuplicateData] = useState<{
    pendingDriver: DriverPendingApprovalWithInfo;
    duplicateDriverInfo: Pick<Driver, 'id' | 'full_name' | 'cpf' | 'cnh' | 'cnh_expiry' | 'phone' | 'type' | 'omnilink_score_registration_date' | 'omnilink_score_expiry_date' | 'omnilink_score_status' | 'status_indicacao' | 'reason_nao_indicacao'>;
  } | null>(null);

  if (authLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (profile.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Acesso Negado</h3>
          <p className="text-muted-foreground">Apenas administradores podem acessar esta área.</p>
        </div>
      </div>
    );
  }

  // Fetch registered drivers
  const { data: drivers, isLoading: isLoadingRegisteredDrivers, error: registeredDriversError } = useQuery<Driver[], Error>({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('drivers').select('*').order('full_name', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch drivers pending approval
  const { data: pendingDrivers, isLoading: isLoadingPendingDrivers, error: pendingDriversError } = useQuery<DriverPendingApproval[], Error>({
    queryKey: ['driversPendingApproval'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers_pending_approval')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: profile.role === 'admin',
  });

  // Extract unique original_driver_ids from pendingDrivers
  const originalDriverIds = useMemo(() => {
    if (!pendingDrivers) return [];
    const ids = new Set<string>();
    pendingDrivers.forEach(d => {
      if (d.original_driver_id) ids.add(d.original_driver_id);
    });
    return Array.from(ids);
  }, [pendingDrivers]);

  // Fetch details of original drivers for duplication info
  const { data: originalDriversDetails, isLoading: isLoadingOriginalDriversDetails } = useQuery<
    Pick<Driver, 'id' | 'full_name' | 'cpf' | 'cnh' | 'cnh_expiry' | 'phone' | 'type' | 'omnilink_score_registration_date' | 'omnilink_score_expiry_date' | 'omnilink_score_status' | 'status_indicacao' | 'reason_nao_indicacao'>[],
    Error
  >({
    queryKey: ['originalDriversDetails', originalDriverIds],
    queryFn: async () => {
      if (originalDriverIds.length === 0) return [];
      const { data, error } = await supabase
        .from('drivers')
        .select('id, full_name, cpf, cnh, cnh_expiry, phone, type, omnilink_score_registration_date, omnilink_score_expiry_date, omnilink_score_status, status_indicacao, reason_nao_indicacao')
        .in('id', originalDriverIds);
      if (error) throw error;
      return data;
    },
    enabled: originalDriverIds.length > 0,
  });

  // Combine pendingDrivers with originalDriversDetails
  const pendingDriversWithDuplicateInfo = useMemo(() => {
    if (!pendingDrivers) return [];
    // Ensure originalDriversDetails is an array before creating the map
    const safeOriginalDriversDetails = originalDriversDetails || [];
    const originalDriversMap = new Map(safeOriginalDriversDetails.map(d => [d.id, d]) || []);

    return pendingDrivers.map(pending => {
      const duplicateDriver = pending.original_driver_id
        ? originalDriversMap.get(pending.original_driver_id)
        : null;
      
      // --- NEW LOGS ---
      if (pending.original_driver_id && !duplicateDriver) {
        console.warn(`DriverManagement: Original driver ID ${pending.original_driver_id} not found in originalDriversDetails for pending driver ${pending.id}. This might indicate a data inconsistency.`);
      }
      if (duplicateDriver && !duplicateDriver.id) {
        console.error(`DriverManagement: Found duplicate driver but its ID is missing!`, duplicateDriver);
      }
      // --- END NEW LOGS ---

      return {
        ...pending,
        duplicateDriverInfo: duplicateDriver,
      };
    });
  }, [pendingDrivers, originalDriversDetails]);

  // Combined and structured list for display, with grouping and initial sorting
  const combinedDisplayList = useMemo(() => {
    const list: CombinedDriverItem[] = [];
    const pendingByOriginalId = new Map<string, CombinedDriverItem[]>();
    const standalonePending: CombinedDriverItem[] = [];

    pendingDriversWithDuplicateInfo.forEach(pending => {
      if (pending.original_driver_id) {
        if (!pendingByOriginalId.has(pending.original_driver_id)) {
          pendingByOriginalId.set(pending.original_driver_id, []);
        }
        pendingByOriginalId.get(pending.original_driver_id)?.push({ ...pending, _itemType: 'pending_duplicate' } as CombinedDriverItem);
      } else {
        standalonePending.push({ ...pending, _itemType: 'pending_new' } as CombinedDriverItem);
      }
    });

    // Sort registered drivers alphabetically
    const sortedRegisteredDrivers = [...(drivers || [])].sort((a, b) =>
      a.full_name.localeCompare(b.full_name)
    );

    // Build the combined list, interleaving duplicates
    sortedRegisteredDrivers.forEach(regDriver => {
      list.push({ ...regDriver, _itemType: 'registered' } as CombinedDriverItem);
      const duplicates = pendingByOriginalId.get(regDriver.id);
      if (duplicates) {
        // Sort duplicates by full_name for consistent display
        duplicates.sort((a, b) => a.full_name.localeCompare(b.full_name));
        list.push(...duplicates);
      }
    });

    // Add any remaining standalone pending drivers, sorted alphabetically
    standalonePending.sort((a, b) => a.full_name.localeCompare(b.full_name));
    list.push(...standalonePending);

    return list;
  }, [drivers, pendingDriversWithDuplicateInfo]);

  // Filtered and sorted list based on all criteria
  const filteredAndSortedList = useMemo(() => {
    let currentList = [...combinedDisplayList];

    // Apply search term
    if (searchTerm) {
      currentList = currentList.filter(item =>
        item.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.cpf?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.cnh?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filter type
    if (filterType !== 'all') {
      if (filterType === 'registered') {
        currentList = currentList.filter(item => item._itemType === 'registered');
      } else if (filterType === 'pending') {
        currentList = currentList.filter(item => item._itemType === 'pending_new' || item._itemType === 'pending_duplicate');
      } else if (filterType === 'duplicates') {
        const duplicateItemIds = new Set<string>();

        pendingDriversWithDuplicateInfo.forEach(p => {
          // If a pending driver is a duplicate of an existing registered driver
          if (p.original_driver_id) {
            duplicateItemIds.add(p.id); // Add the pending driver's ID
            duplicateItemIds.add(p.original_driver_id); // Add the original registered driver's ID
          }
          // If a pending driver is a batch duplicate (e.g., multiple entries in the same upload)
          else if (p.reason && (p.reason.includes('batch_duplicate_cpf') || p.reason.includes('batch_duplicate_cnh'))) {
            duplicateItemIds.add(p.id); // Add the pending driver's ID
          }
        });

        currentList = currentList.filter(item => duplicateItemIds.has(item.id));
      }
    }

    // Apply Omnilink status filter
    if (filterOmnilinkStatus !== 'all') {
      currentList = currentList.filter(item => {
        if (item._itemType === 'registered' || item._itemType === 'pending_new' || item._itemType === 'pending_duplicate') {
          return item.omnilink_score_status === filterOmnilinkStatus;
        }
        return false;
      });
    }

    // Apply Indicacao status filter
    if (filterIndicacaoStatus !== 'all') {
      currentList = currentList.filter(item => {
        // Both registered and pending drivers can have status_indicacao
        return item.status_indicacao === filterIndicacaoStatus;
      });
    }

    // Apply specific filter criteria (e.g., from clicking a duplicate badge)
    if (filterCriteria) {
      currentList = currentList.filter(item => {
        if (filterCriteria.type === 'original_driver_id' && item._itemType !== 'registered' && 'original_driver_id' in item && item.original_driver_id) {
          return item.original_driver_id === filterCriteria.value;
        }
        if (filterCriteria.type === 'reason' && item._itemType !== 'registered' && 'reason' in item && item.reason) {
          return item.reason.includes(filterCriteria.value);
        }
        // Also show the original registered driver if filtering by its ID
        if (filterCriteria.type === 'original_driver_id' && item._itemType === 'registered' && item.id === filterCriteria.value) {
          return true;
        }
        return false;
      });
    }

    // Apply sorting
    if (sortColumn) {
      currentList.sort((a, b) => {
        let valA: any;
        let valB: any;

        if (sortColumn === 'status') {
          valA = a._itemType === 'registered' ? 'ativo' : 'pendente';
          valB = b._itemType === 'registered' ? 'ativo' : 'pendente';
        } else if (sortColumn === 'omnilink_score_status') {
          valA = a.omnilink_score_status || '';
          valB = b.omnilink_score_status || '';
        } else if (sortColumn === 'status_indicacao') {
          valA = a.status_indicacao || '';
          valB = b.status_indicacao || '';
        }
        else {
          valA = a[sortColumn as keyof (Driver | DriverPendingApproval)] || '';
          valB = b[sortColumn as keyof (Driver | DriverPendingApproval)] || '';
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        return 0;
      });
    }

    return currentList;
  }, [combinedDisplayList, searchTerm, filterType, filterOmnilinkStatus, filterIndicacaoStatus, sortColumn, sortDirection, filterCriteria, pendingDriversWithDuplicateInfo]);


  // Add/Update registered driver mutation
  const upsertDriverMutation = useMutation({
    mutationFn: async (driverData: TablesInsert<'drivers'> | TablesUpdate<'drivers'>) => {
      if (editingDriver) {
        const { data, error } = await supabase
          .from('drivers')
          .update(driverData as TablesUpdate<'drivers'>)
          .eq('id', editingDriver.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('drivers')
          .insert(driverData as TablesInsert<'drivers'>)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success(editingDriver ? "Motorista atualizado!" : "Motorista adicionado!", {
        description: editingDriver ? "Os dados do motorista foram atualizados." : "Novo motorista cadastrado com sucesso.",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      console.error('Error upserting driver:', err);
      toast.error("Erro ao salvar motorista", {
        description: err.message || "Não foi possível salvar os dados do motorista.",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Delete single registered driver mutation
  const deleteDriverMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('drivers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (data, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success("Motorista excluído!", {
        description: "O motorista foi removido do sistema.",
      });
      setSelectedRegisteredDriverIds(prev => prev.filter(driverId => driverId !== deletedId));
    },
    onError: (err: any) => {
      console.error('Error deleting driver:', err);
      toast.error("Erro ao excluir motorista", {
        description: err.message || "Não foi possível excluir o motorista.",
      });
    },
  });

  // Bulk delete registered drivers mutation
  const bulkDeleteRegisteredDriversMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('drivers').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: (data, ids) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success("Motoristas excluídos!", {
        description: `${ids.length} motorista(s) foram removido(s) do sistema.`,
      });
      setSelectedRegisteredDriverIds([]);
    },
    onError: (err: any) => {
      console.error('Error bulk deleting drivers:', err);
      toast.error("Erro ao excluir motoristas", {
        description: err.message || "Não foi possível excluir os motoristas selecionados.",
      });
    },
  });

  // New mutation for resolving duplication (called by the custom toast)
  const resolveDuplicationMutation = useMutation({
    mutationFn: async ({ choice, pendingDriverId, existingDriverId, pendingDriverData }: {
      choice: 'keepExisting' | 'keepNew';
      pendingDriverId: string;
      existingDriverId: string;
      pendingDriverData: DriverPendingApproval;
    }) => {
      if (choice === 'keepExisting') {
        console.log('resolveDuplicationMutation: Escolha "Manter Existente". Excluindo entrada pendente:', pendingDriverId);
        const { error: deletePendingError } = await supabase
          .from('drivers_pending_approval')
          .delete()
          .eq('id', pendingDriverId);
        if (deletePendingError) {
          console.error('resolveDuplicationMutation: Erro ao excluir entrada pendente (Manter Existente):', deletePendingError);
          throw new Error(`Falha ao remover entrada pendente: ${deletePendingError.message}`);
        }
        console.log('resolveDuplicationMutation: Entrada pendente excluída com sucesso:', pendingDriverId);
        return { message: 'Motorista existente mantido. Entrada pendente removida.' };
      } else { // choice === 'keepNew'
        console.log('resolveDuplicationMutation: Escolha "Manter Novo".');
        console.log('resolveDuplicationMutation: existingDriverId para atualização:', existingDriverId);

        if (!existingDriverId || typeof existingDriverId !== 'string' || existingDriverId.length !== 36) {
          const errorMessage = `ID do motorista existente inválido para atualização: "${existingDriverId}". Esperado um UUID válido.`;
          console.error('resolveDuplicationMutation:', errorMessage);
          throw new Error(errorMessage);
        }

        // 1. Atualizar o motorista existente na tabela 'drivers' com os dados do motorista pendente
        const driverToUpdate: TablesUpdate<'drivers'> = {
          full_name: pendingDriverData.full_name,
          cpf: pendingDriverData.cpf,
          cnh: pendingDriverData.cnh,
          cnh_expiry: pendingDriverData.cnh_expiry,
          phone: pendingDriverData.phone,
          type: pendingDriverData.type,
          omnilink_score_registration_date: pendingDriverData.omnilink_score_registration_date,
          omnilink_score_expiry_date: pendingDriverData.omnilink_score_expiry_date,
          omnilink_score_status: pendingDriverData.omnilink_score_status,
          cnh_pdf_url: pendingDriverData.cnh_pdf_url,
          status_indicacao: pendingDriverData.status_indicacao as 'indicado' | 'retificado' | 'nao_indicado' | null,
          reason_nao_indicacao: pendingDriverData.reason_nao_indicacao,
        };
        console.log('resolveDuplicationMutation: Atualizando motorista existente na tabela drivers com dados:', driverToUpdate);
        const { error: updateExistingError } = await supabase
          .from('drivers')
          .update(driverToUpdate)
          .eq('id', existingDriverId);
        if (updateExistingError) {
          console.error('resolveDuplicationMutation: Erro ao atualizar motorista existente:', updateExistingError);
          throw new Error(`Falha ao atualizar motorista existente: ${updateExistingError.message}`);
        }
        console.log('resolveDuplicationMutation: Motorista existente atualizado com sucesso:', existingDriverId);

        // 2. Excluir a entrada pendente da tabela 'drivers_pending_approval'
        console.log('resolveDuplicationMutation: Excluindo entrada pendente da tabela drivers_pending_approval:', pendingDriverId);
        const { error: deletePendingError } = await supabase
          .from('drivers_pending_approval')
          .delete()
          .eq('id', pendingDriverId);
        if (deletePendingError) {
          console.error('resolveDuplicationMutation: Erro ao excluir entrada pendente (Manter Novo):', deletePendingError);
          throw new Error(`Falha ao remover entrada pendente: ${deletePendingError.message}`);
        }
        console.log('resolveDuplicationMutation: Entrada pendente excluída com sucesso:', pendingDriverId);

        return { message: 'Motorista existente atualizado com os novos dados. Entrada pendente removida.' };
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['driversPendingApproval'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['originalDriversDetails'] });
      toast.success("Duplicação resolvida!", {
        description: data.message,
      });
    },
    onError: (err: any) => {
      console.error('Erro ao resolver duplicação:', err);
      toast.error("Erro ao resolver duplicação", {
        description: err.message || "Não foi possível resolver a duplicação.",
      });
    },
  });

  // Mutation to approve a pending driver (now handles duplication check)
  const approvePendingDriverMutation = useMutation({
    mutationFn: async (driverToApprove: DriverPendingApprovalWithInfo) => {
      // Case 1: No original_driver_id, so it's a truly new pending driver.
      if (!driverToApprove.original_driver_id) {
        console.log('DriverManagement: Aprovação de novo motorista sem duplicação detectada.');
        const driverData: TablesInsert<'drivers'> = {
          full_name: driverToApprove.full_name,
          cpf: driverToApprove.cpf,
          cnh: driverToApprove.cnh,
          cnh_expiry: driverToApprove.cnh_expiry,
          phone: driverToApprove.phone,
          type: driverToApprove.type,
          omnilink_score_registration_date: driverToApprove.omnilink_score_registration_date,
          omnilink_score_expiry_date: driverToApprove.omnilink_score_expiry_date,
          omnilink_score_status: driverToApprove.omnilink_score_status,
          cnh_pdf_url: driverToApprove.cnh_pdf_url,
          status_indicacao: driverToApprove.status_indicacao as 'indicado' | 'retificado' | 'nao_indicado' | null,
          reason_nao_indicacao: driverToApprove.reason_nao_indicacao,
        };
        const { error: insertError } = await supabase
          .from('drivers')
          .insert(driverData);
        if (insertError) {
          console.error('DriverManagement: Erro ao inserir novo motorista:', insertError);
          throw new Error(`Falha ao inserir novo motorista: ${insertError.message}`);
        }

        const { error: deletePendingError } = await supabase
          .from('drivers_pending_approval')
          .delete()
          .eq('id', driverToApprove.id);
        if (deletePendingError) {
          console.error('DriverManagement: Erro ao excluir entrada pendente após inserção:', deletePendingError);
          throw new Error(`Falha ao remover entrada pendente: ${deletePendingError.message}`);
        }
        return { message: 'Motorista aprovado e adicionado ao sistema.' };
      }
      // Case 2: original_driver_id exists, and we found its details (actual duplication)
      else if (driverToApprove.original_driver_id && driverToApprove.duplicateDriverInfo && driverToApprove.duplicateDriverInfo.id) {
        console.log('DriverManagement: Duplicação detectada. Abrindo diálogo de resolução.');
        // --- NEW LOG ---
        console.log('DriverManagement: duplicateDriverInfo.id antes de setCurrentDuplicateData:', driverToApprove.duplicateDriverInfo.id);
        // --- END NEW LOG ---
        setCurrentDuplicateData({
          pendingDriver: driverToApprove,
          duplicateDriverInfo: driverToApprove.duplicateDriverInfo,
        });
        setIsDuplicateDialogOpen(true);
        return Promise.reject(new Error("Duplicação detectada. Ação requerida no diálogo."));
      }
      // Case 3: original_driver_id exists, but duplicateDriverInfo is null or missing ID (original driver not found or invalid)
      else {
        console.error('DriverManagement: Inconsistência de dados: original_driver_id existe, mas o motorista original não foi encontrado ou está inválido na tabela drivers.', driverToApprove);
        throw new Error("Inconsistência de dados: O motorista original referenciado não foi encontrado ou está inválido. Por favor, rejeite esta entrada pendente ou verifique a integridade dos dados.");
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['driversPendingApproval'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['originalDriversDetails'] });
      toast.success("Motorista aprovado!", {
        description: data.message,
      });
    },
    onError: (err: any) => {
      if (err.message !== "Duplicação detectada. Ação requerida no diálogo.") {
        console.error('Erro ao aprovar motorista:', err);
        toast.error("Erro ao aprovar motorista", {
          description: err.message || "Não foi possível aprovar o motorista.",
        });
      }
    },
  });

  // Bulk approve pending drivers mutation
  const bulkApprovePendingDriversMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const pendingDriversToApprove = pendingDriversWithDuplicateInfo.filter(d => ids.includes(d.id));
      let approvedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      for (const driver of pendingDriversToApprove) {
        if (driver.original_driver_id && driver.duplicateDriverInfo) {
          skippedCount++;
          errors.push(`Motorista ${driver.full_name} (${driver.cpf}) é uma duplicação e requer revisão individual.`);
        } else {
          try {
            const driverData: TablesInsert<'drivers'> = {
              full_name: driver.full_name,
              cpf: driver.cpf,
              cnh: driver.cnh,
              cnh_expiry: driver.cnh_expiry,
              phone: driver.phone,
              type: driver.type,
              omnilink_score_registration_date: driver.omnilink_score_registration_date,
              omnilink_score_expiry_date: driver.omnilink_score_expiry_date,
              omnilink_score_status: driver.omnilink_score_status,
              cnh_pdf_url: driver.cnh_pdf_url,
              status_indicacao: driver.status_indicacao as 'indicado' | 'retificado' | 'nao_indicado' | null,
              reason_nao_indicacao: driver.reason_nao_indicacao,
            };
            const { error: insertError } = await supabase.from('drivers').insert(driverData);
            if (insertError) throw insertError;

            const { error: deletePendingError } = await supabase.from('drivers_pending_approval').delete().eq('id', driver.id);
            if (deletePendingError) throw deletePendingError;
            approvedCount++;
          } catch (error: any) {
            errors.push(`Falha ao aprovar ${driver.full_name}: ${error.message}`);
          }
        }
      }
      return { approvedCount, skippedCount, errors };
    },
    onSuccess: ({ approvedCount, skippedCount, errors }) => {
      queryClient.invalidateQueries({ queryKey: ['driversPendingApproval'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['originalDriversDetails'] });
      setSelectedPendingDriverIds([]);

      let description = '';
      if (approvedCount > 0) {
        description += `${approvedCount} motorista(s) aprovado(s). `;
      }
      if (skippedCount > 0) {
        description += `${skippedCount} motorista(s) ignorado(s) (duplicação). `;
      }
      if (errors.length > 0) {
        description += `Erros: ${errors.join('; ')}`;
        toast.error("Aprovação em massa com problemas", { description });
      } else {
        toast.success("Aprovação em massa concluída!", { description });
      }
    },
    onError: (err: any) => {
      console.error('Erro na aprovação em massa:', err);
      toast.error("Erro na aprovação em massa", {
        description: err.message || "Não foi possível aprovar os motoristas selecionados.",
      });
    },
  });

  // Mutation to reject a pending driver
  const rejectPendingDriverMutation = useMutation({
    mutationFn: async (driverId: string) => {
      const { error } = await supabase
        .from('drivers_pending_approval')
        .delete()
        .eq('id', driverId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driversPendingApproval'] });
      queryClient.invalidateQueries({ queryKey: ['originalDriversDetails'] });
      toast.success("Motorista rejeitado!", {
        description: "O motorista pendente foi removido.",
      });
    },
    onError: (err: any) => {
      console.error('Erro ao rejeitar motorista:', err);
      toast.error("Erro ao rejeitar motorista", {
        description: err.message || "Não foi possível rejeitar o motorista.",
      });
    },
  });

  // Bulk reject pending drivers mutation
  const bulkRejectPendingDriversMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('drivers_pending_approval').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: (data, ids) => {
      queryClient.invalidateQueries({ queryKey: ['driversPendingApproval'] });
      queryClient.invalidateQueries({ queryKey: ['originalDriversDetails'] });
      toast.success("Rejeição em massa concluída!", {
        description: `${ids.length} motorista(s) pendente(s) foram removido(s).`,
      });
      setSelectedPendingDriverIds([]);
    },
    onError: (err: any) => {
      console.error('Erro na rejeição em massa:', err);
      toast.error("Erro na rejeição em massa", {
        description: err.message || "Não foi possível rejeitar os motoristas selecionados.",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      full_name: '',
      cpf: '',
      cnh: null,
      cnh_expiry: null,
      phone: null,
      type: null,
      omnilink_score_registration_date: null,
      omnilink_score_expiry_date: null,
      omnilink_score_status: null,
      status_indicacao: 'nao_indicado',
      reason_nao_indicacao: null,
    });
    setEditingDriver(null);
  };

  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      full_name: driver.full_name,
      cpf: driver.cpf,
      cnh: driver.cnh,
      cnh_expiry: driver.cnh_expiry,
      phone: driver.phone,
      type: driver.type,
      omnilink_score_registration_date: driver.omnilink_score_registration_date,
      omnilink_score_expiry_date: driver.omnilink_score_expiry_date,
      omnilink_score_status: driver.omnilink_score_status,
      status_indicacao: driver.status_indicacao,
      reason_nao_indicacao: driver.reason_nao_indicacao,
    });
    setIsDialogOpen(true);
  };

  const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value === '' ? null : value }));
  };

  const handleFormSelectChange = (id: keyof TablesInsert<'drivers'>, value: string) => {
    setFormData(prev => {
      const newState = { ...prev, [id]: value === '' ? null : value };
      // Clear reason_nao_indicacao if status is not 'nao_indicado'
      if (id === 'status_indicacao' && value !== 'nao_indicado') {
        newState.reason_nao_indicacao = null;
      }
      return newState;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await upsertDriverMutation.mutateAsync(formData);
  };

  const handleDeleteDriver = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este motorista?")) {
      await deleteDriverMutation.mutateAsync(id);
    }
  };

  const handleSelectRegisteredDriver = (driverId: string, isChecked: boolean) => {
    setSelectedRegisteredDriverIds(prev =>
      isChecked ? [...prev, driverId] : prev.filter(id => id !== driverId)
    );
  };

  const handleSelectAllRegisteredDrivers = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedRegisteredDriverIds(drivers?.map(driver => driver.id) || []);
    } else {
      setSelectedRegisteredDriverIds([]);
    }
  };

  const handleDeleteSelectedRegisteredDrivers = async () => {
    if (selectedRegisteredDriverIds.length === 0) {
      toast.info("Nenhum motorista registrado selecionado", {
        description: "Por favor, selecione os motoristas que deseja excluir.",
      });
      return;
    }
    if (window.confirm(`Tem certeza que deseja excluir ${selectedRegisteredDriverIds.length} motorista(s) registrado(s) selecionado(s)?`)) {
      await bulkDeleteRegisteredDriversMutation.mutateAsync(selectedRegisteredDriverIds);
    }
  };

  const handleSelectPendingDriver = (driverId: string, isChecked: boolean) => {
    setSelectedPendingDriverIds(prev =>
      isChecked ? [...prev, driverId] : prev.filter(id => id !== driverId)
    );
  };

  const handleSelectAllPendingDrivers = (isChecked: boolean) => {
    const allPendingIds = filteredAndSortedList
      .filter(item => item._itemType === 'pending_duplicate' || item._itemType === 'pending_new')
      .map(item => item.id);
    if (isChecked) {
      setSelectedPendingDriverIds(allPendingIds);
    } else {
      setSelectedPendingDriverIds([]);
    }
  };

  const handleBulkApprovePendingDrivers = async () => {
    if (selectedPendingDriverIds.length === 0) {
      toast.info("Nenhum motorista pendente selecionado", {
        description: "Por favor, selecione os motoristas que deseja aprovar.",
      });
      return;
    }
    if (window.confirm(`Tem certeza que deseja aprovar ${selectedPendingDriverIds.length} motorista(s) pendente(s) selecionado(s)? Duplicatas serão ignoradas e precisarão de revisão individual.`)) {
      await bulkApprovePendingDriversMutation.mutateAsync(selectedPendingDriverIds);
    }
  };

  const handleBulkRejectPendingDrivers = async () => {
    if (selectedPendingDriverIds.length === 0) {
      toast.info("Nenhum motorista pendente selecionado", {
        description: "Por favor, selecione os motoristas que deseja rejeitar.",
      });
      return;
    }
    if (window.confirm(`Tem certeza que deseja rejeitar ${selectedPendingDriverIds.length} motorista(s) pendente(s) selecionado(s)?`)) {
      await bulkRejectPendingDriversMutation.mutateAsync(selectedPendingDriverIds);
    }
  };

  const handleRefreshLists = () => {
    queryClient.invalidateQueries({ queryKey: ['drivers'] });
    queryClient.invalidateQueries({ queryKey: ['driversPendingApproval'] });
    queryClient.invalidateQueries({ queryKey: ['originalDriversDetails'] });
    toast.info("Listas atualizadas", {
      description: "Buscando as últimas informações de motoristas.",
    });
  };

  const handleFilterByDuplication = (item: CombinedDriverItem) => {
    if (item._itemType === 'registered') {
      setFilterCriteria({ type: 'original_driver_id', value: item.id });
      setFilterType('duplicates');
      toast.info("Filtro aplicado", {
        description: `Mostrando duplicações para o motorista original: ${item.full_name} (${item.cpf}).`,
      });
    } else if (item._itemType === 'pending_duplicate' || item._itemType === 'pending_new') {
      if (item.original_driver_id) {
        setFilterCriteria({ type: 'original_driver_id', value: item.original_driver_id });
        setFilterType('duplicates');
        toast.info("Filtro aplicado", {
          description: `Mostrando duplicações para o motorista original: ${item.duplicateDriverInfo?.full_name || item.original_driver_id}.`,
        });
      } else if (item.reason) {
        setFilterCriteria({ type: 'reason', value: item.reason });
        setFilterType('pending');
        toast.info("Filtro aplicado", {
          description: `Mostrando duplicações do tipo: ${item.reason.replace(/_/g, ' ').replace('duplicate', 'duplicado')}.`,
        });
      }
    }
  };

  const handleClearFilter = () => {
    setFilterCriteria(null);
    setSearchTerm('');
    setFilterType('all');
    setFilterOmnilinkStatus('all');
    setFilterIndicacaoStatus('all');
    toast.info("Filtro removido", {
      description: "Mostrando todos os motoristas.",
    });
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const calculateOmnilinkScoreStatus = (registrationDate: string | null) => {
    if (!registrationDate) return null;
    try {
      const parsedRegDate = parseISO(registrationDate);
      if (isNaN(parsedRegDate.getTime())) return null;
      const expiryDate = addMonths(parsedRegDate, 6);
      return isAfter(expiryDate, new Date()) ? 'em_dia' : 'inapto';
    } catch {
      return null;
    }
  };

  const calculateOmnilinkScoreExpiry = (registrationDate: string | null) => {
    if (!registrationDate) return null;
    try {
      const parsedRegDate = parseISO(registrationDate);
      if (isNaN(parsedRegDate.getTime())) return null;
      const expiryDate = addMonths(parsedRegDate, 6);
      return format(expiryDate, 'yyyy-MM-dd');
    } catch {
      return null;
    }
  };

  const getOmnilinkStatusBadgeVariant = (status: string | null) => {
    if (status === 'em_dia') return 'success';
    if (status === 'inapto') return 'destructive';
    return 'secondary';
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

  const getReasonBadgeVariant = (reason: string) => {
    if (reason.includes('duplicate_cpf') || reason.includes('duplicate_cnh') || reason.includes('batch_duplicate')) return 'warning';
    return 'secondary';
  };

  const isLoadingAny = isLoadingRegisteredDrivers || isLoadingPendingDrivers || isLoadingOriginalDriversDetails;

  const allPendingDriversInFilteredList = filteredAndSortedList.filter(item => item._itemType === 'pending_duplicate' || item._itemType === 'pending_new');
  const allPendingDriversSelected = allPendingDriversInFilteredList.length > 0 && selectedPendingDriverIds.length === allPendingDriversInFilteredList.length;
  const somePendingDriversSelected = selectedPendingDriverIds.length > 0 && selectedPendingDriverIds.length < allPendingDriversInFilteredList.length;

  const allRegisteredDriversInFilteredList = filteredAndSortedList.filter(item => item._itemType === 'registered');
  const allRegisteredDriversSelected = allRegisteredDriversInFilteredList.length > 0 && selectedRegisteredDriverIds.length === allRegisteredDriversInFilteredList.length;
  const someRegisteredDriversSelected = selectedRegisteredDriverIds.length > 0 && selectedRegisteredDriverIds.length < allRegisteredDriversInFilteredList.length;


  if (isLoadingAny) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (registeredDriversError || pendingDriversError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-destructive">
          <p>Erro ao carregar dados: {registeredDriversError?.message || pendingDriversError?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Gerenciamento de Motoristas</h2>
          <p className="text-muted-foreground">Cadastre, gerencie e aprove motoristas da frota</p>
        </div>
        
        <div className="flex gap-2 flex-wrap justify-end">
          {selectedPendingDriverIds.length > 0 && (
            <>
              <Button
                variant="outline"
                onClick={handleBulkApprovePendingDrivers}
                disabled={bulkApprovePendingDriversMutation.isPending || resolveDuplicationMutation.isPending}
              >
                {bulkApprovePendingDriversMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="mr-2 h-4 w-4" />
                )}
                Aprovar Selecionados ({selectedPendingDriverIds.length})
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkRejectPendingDrivers}
                disabled={bulkRejectPendingDriversMutation.isPending || resolveDuplicationMutation.isPending}
              >
                {bulkRejectPendingDriversMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserX className="mr-2 h-4 w-4" />
                )}
                Rejeitar Selecionados ({selectedPendingDriverIds.length})
              </Button>
            </>
          )}

          {selectedRegisteredDriverIds.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleDeleteSelectedRegisteredDrivers}
              disabled={bulkDeleteRegisteredDriversMutation.isPending}
            >
              {bulkDeleteRegisteredDriversMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Excluir Registrados ({selectedRegisteredDriverIds.length})
            </Button>
          )}

          <Dialog open={isBulkUploadDialogOpen} onOpenChange={setIsBulkUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Upload em Massa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Upload em Massa de Motoristas</DialogTitle>
                <DialogDescription>
                  Carregue uma planilha (.xlsx, .csv) para cadastrar múltiplos motoristas.
                </DialogDescription>
              </DialogHeader>
              <BulkDriverUpload
                onUploadComplete={() => {
                  setIsBulkUploadDialogOpen(false);
                  queryClient.invalidateQueries({ queryKey: ['drivers'] });
                }}
                onClose={() => setIsBulkUploadDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <UserPlus className="mr-2 h-4 w-4" />
                Novo Motorista
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingDriver ? 'Editar Motorista' : 'Cadastrar Novo Motorista'}
                </DialogTitle>
                <DialogDescription>
                  {editingDriver 
                    ? 'Atualize as informações do motorista'
                    : 'Preencha os dados para cadastrar um novo motorista'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name || ''}
                    onChange={handleFormInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf || ''}
                    onChange={handleFormInputChange}
                    required
                    disabled={!!editingDriver} 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={formData.type || ''}
                    onValueChange={(value) => handleFormSelectChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="motorista">Motorista</SelectItem>
                      <SelectItem value="agregado">Agregado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cnh">CNH</Label>
                    <Input
                      id="cnh"
                      value={formData.cnh || ''}
                      onChange={(e) => handleFormInputChange(e)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cnh_expiry">Validade CNH</Label>
                    <Input
                      id="cnh_expiry"
                      type="date"
                      value={formData.cnh_expiry || ''}
                      onChange={(e) => handleFormInputChange(e)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => handleFormInputChange(e)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="omnilink_score_registration_date">Data de Cadastro Omnilink Score</Label>
                  <Input
                    id="omnilink_score_registration_date"
                    type="date"
                    value={formData.omnilink_score_registration_date || ''}
                    onChange={(e) => {
                      const regDate = e.target.value === '' ? null : e.target.value;
                      const expiryDate = calculateOmnilinkScoreExpiry(regDate);
                      const status = calculateOmnilinkScoreStatus(regDate);
                      setFormData(prev => ({
                        ...prev,
                        omnilink_score_registration_date: regDate,
                        omnilink_score_expiry_date: expiryDate,
                        omnilink_score_status: status,
                      }));
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="omnilink_score_expiry_date">Vencimento Omnilink Score</Label>
                    <Input
                      id="omnilink_score_expiry_date"
                      type="date"
                      value={formData.omnilink_score_expiry_date || ''}
                      readOnly
                      className="bg-muted/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="omnilink_score_status">Status Omnilink Score</Label>
                    <Input
                      id="omnilink_score_status"
                      value={formData.omnilink_score_status === 'em_dia' ? 'Em Dia' : formData.omnilink_score_status === 'inapto' ? 'Inapto' : ''}
                      readOnly
                      className="bg-muted/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status_indicacao">Status de Indicação</Label>
                  <Select
                    value={formData.status_indicacao || ''}
                    onValueChange={(value: 'indicado' | 'retificado' | 'nao_indicado') => handleFormSelectChange('status_indicacao', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status de indicação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="indicado">Indicado</SelectItem>
                      <SelectItem value="retificado">Retificado</SelectItem>
                      <SelectItem value="nao_indicado">Não Indicado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.status_indicacao === 'nao_indicado' && (
                  <div className="space-y-2">
                    <Label htmlFor="reason_nao_indicacao">Motivo de Não Indicação (Opcional)</Label>
                    <Textarea
                      id="reason_nao_indicacao"
                      value={formData.reason_nao_indicacao || ''}
                      onChange={handleFormInputChange}
                      placeholder="Descreva o motivo pelo qual o motorista não foi indicado..."
                      className="min-h-[80px]"
                    />
                  </div>
                )}
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingDriver ? 'Atualizando...' : 'Cadastrando...'}
                      </>
                    ) : (
                      editingDriver ? 'Atualizar' : 'Cadastrar'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="modern-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Gerenciamento de Motoristas
          </CardTitle>
          <div className="flex items-center gap-2">
            {filterCriteria && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilter}
                className="text-muted-foreground hover:text-foreground"
              >
                <FilterX className="mr-2 h-4 w-4" />
                Limpar Filtro
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshLists}
              disabled={isLoadingAny}
            >
              {isLoadingAny ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Atualizar Listas
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="mb-4">
            Lista completa de motoristas, incluindo os pendentes para aprovação.
          </CardDescription>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF, CNH ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={(value: 'all' | 'registered' | 'pending' | 'duplicates') => setFilterType(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <ListFilter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar por Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="registered">Registrados</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="duplicates">Duplicados</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterOmnilinkStatus} onValueChange={(value: 'all' | 'em_dia' | 'inapto') => setFilterOmnilinkStatus(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status Omnilink" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status Omnilink</SelectItem>
                <SelectItem value="em_dia">Em Dia</SelectItem>
                <SelectItem value="inapto">Inapto</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterIndicacaoStatus} onValueChange={(value: 'all' | 'indicado' | 'retificado' | 'nao_indicado') => setFilterIndicacaoStatus(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status Indicação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status Indicação</SelectItem>
                <SelectItem value="indicado">Indicado</SelectItem>
                <SelectItem value="retificado">Retificado</SelectItem>
                <SelectItem value="nao_indicado">Não Indicado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={allPendingDriversSelected && allRegisteredDriversSelected}
                      onCheckedChange={(checked: boolean) => {
                        handleSelectAllRegisteredDrivers(checked);
                        handleSelectAllPendingDrivers(checked);
                      }}
                      aria-label="Selecionar todos os motoristas"
                    />
                  </TableHead>
                  <TableHead onClick={() => handleSort('full_name')} className="cursor-pointer hover:text-primary whitespace-nowrap">
                    <div className="flex items-center">
                      Nome Completo {renderSortIcon('full_name')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('cpf')} className="cursor-pointer hover:text-primary whitespace-nowrap">
                    <div className="flex items-center">
                      CPF {renderSortIcon('cpf')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('type')} className="cursor-pointer hover:text-primary whitespace-nowrap">
                    <div className="flex items-center">
                      Tipo {renderSortIcon('type')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('cnh')} className="cursor-pointer hover:text-primary whitespace-nowrap">
                    <div className="flex items-center">
                      CNH {renderSortIcon('cnh')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('cnh_expiry')} className="cursor-pointer hover:text-primary whitespace-nowrap">
                    <div className="flex items-center">
                      Validade CNH {renderSortIcon('cnh_expiry')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('phone')} className="cursor-pointer hover:text-primary whitespace-nowrap">
                    <div className="flex items-center">
                      Telefone {renderSortIcon('phone')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('omnilink_score_registration_date')} className="cursor-pointer hover:text-primary whitespace-nowrap">
                    <div className="flex items-center">
                      Reg. Omnilink {renderSortIcon('omnilink_score_registration_date')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('omnilink_score_expiry_date')} className="cursor-pointer hover:text-primary whitespace-nowrap">
                    <div className="flex items-center">
                      Venc. Omnilink {renderSortIcon('omnilink_score_expiry_date')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('omnilink_score_status')} className="cursor-pointer hover:text-primary whitespace-nowrap">
                    <div className="flex items-center">
                      Status Omnilink {renderSortIcon('omnilink_score_status')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('status_indicacao')} className="cursor-pointer hover:text-primary whitespace-nowrap">
                    <div className="flex items-center">
                      Status Indicação {renderSortIcon('status_indicacao')}
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
                {filteredAndSortedList && filteredAndSortedList.length > 0 ? (
                  filteredAndSortedList.map((item) => (
                    <TableRow
                      key={item.id}
                      className={cn(
                        'hover:bg-muted/50',

                        ((item._itemType === 'registered' && pendingDriversWithDuplicateInfo.some(p => p.original_driver_id === item.id)) ||
                        item._itemType.startsWith('pending'))
                          ? 'border-l-4 border-primary/50'
                          : '',

                        item._itemType === 'pending_duplicate' &&
                          'bg-blue-100/50 dark:bg-blue-900/30',

                        item._itemType === 'pending_new' &&
                          item.reason && item.reason.includes('batch_duplicate') &&
                          'bg-yellow-50/50 dark:bg-yellow-950/30'
                      )}
                    >
                      <TableCell>
                        {item._itemType === 'registered' ? (
                          <Checkbox
                            checked={selectedRegisteredDriverIds.includes(item.id)}
                            onCheckedChange={(checked: boolean) => handleSelectRegisteredDriver(item.id, checked)}
                            aria-label={`Selecionar motorista ${item.full_name}`}
                          />
                        ) : (
                          <Checkbox
                            checked={selectedPendingDriverIds.includes(item.id)}
                            onCheckedChange={(checked: boolean) => handleSelectPendingDriver(item.id, checked)}
                            aria-label={`Selecionar motorista pendente ${item.full_name}`}
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-medium max-w-[150px] truncate">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              {item._itemType === 'pending_duplicate' && <span className="ml-4">↳ </span>}
                              {item.full_name}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {item.full_name}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{item.cpf || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.type || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.cnh || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(item.cnh_expiry)}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.phone || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(item.omnilink_score_registration_date)}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(item.omnilink_score_expiry_date)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {item.omnilink_score_status ? (
                          <Badge variant={getOmnilinkStatusBadgeVariant(item.omnilink_score_status)}>
                            {item.omnilink_score_status === 'em_dia' ? 'Em Dia' : 'Inapto'}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {item.status_indicacao ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge 
                                variant={getIndicacaoStatusBadgeVariant(item.status_indicacao as 'indicado' | 'retificado' | 'nao_indicado')} 
                                className="cursor-pointer"
                              >
                                {item.status_indicacao === 'indicado' ? 'Indicado' : item.status_indicacao === 'retificado' ? 'Retificado' : 'Não Indicado'}
                              </Badge>
                            </TooltipTrigger>
                            {item.status_indicacao === 'nao_indicado' && item.reason_nao_indicacao && (
                              <TooltipContent className="max-w-xs p-2">
                                <p className="text-sm font-medium mb-1">Motivo de Não Indicação:</p>
                                <p className="text-xs text-muted-foreground">{item.reason_nao_indicacao}</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        ) : (
                          <Badge variant="secondary">N/A</Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {item._itemType === 'registered' ? (
                          <Badge variant="success">Ativo</Badge>
                        ) : (
                          item.duplicateDriverInfo || item.reason ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant={getReasonBadgeVariant(item.reason || '')}
                                  className="cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => handleFilterByDuplication(item)}
                                >
                                  {item.reason?.replace(/_/g, ' ').replace('duplicate', 'duplicado') || 'Revisão Admin'}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs p-2">
                                <p className="text-sm font-medium mb-1">Duplicação Detectada:</p>
                                {item.duplicateDriverInfo && (
                                  <p className="text-xs text-muted-foreground">
                                    <span className="font-semibold">Existente:</span> {item.duplicateDriverInfo.full_name} ({item.duplicateDriverInfo.cpf})
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  <span className="font-semibold">Pendente:</span> {item.full_name} ({item.cpf})
                                </p>
                                {item.reason && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    <span className="font-semibold">Motivo:</span> {item.reason.replace(/_/g, ' ').replace('duplicate', 'duplicado')}
                                  </p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Badge variant="secondary">Pendente</Badge>
                          )
                        )}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {item._itemType === 'registered' ? (
                              <>
                                <DropdownMenuItem onClick={() => handleEditDriver(item)}>
                                  <Edit2 className="mr-2 h-4 w-4" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteDriver(item.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <>
                                <DropdownMenuItem
                                  onClick={() => approvePendingDriverMutation.mutate(item)}
                                  disabled={approvePendingDriverMutation.isPending || resolveDuplicationMutation.isPending}
                                >
                                  {approvePendingDriverMutation.isPending || resolveDuplicationMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <UserCheck className="mr-2 h-4 w-4" />
                                  )}
                                  Aprovar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => rejectPendingDriverMutation.mutate(item.id)}
                                  className="text-destructive"
                                  disabled={rejectPendingDriverMutation.isPending || resolveDuplicationMutation.isPending}
                                >
                                  {rejectPendingDriverMutation.isPending || resolveDuplicationMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <UserX className="mr-2 h-4 w-4" />
                                  )}
                                  Rejeitar
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center text-muted-foreground py-8">
                      <CheckCircle className="h-10 w-10 mx-auto mb-3 text-success" />
                      <p>Nenhum motorista encontrado.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {currentDuplicateData && (
        <DuplicateDriverDialog
          isOpen={isDuplicateDialogOpen}
          onClose={() => setIsDuplicateDialogOpen(false)}
          pendingDriver={currentDuplicateData.pendingDriver}
          duplicateDriverInfo={currentDuplicateData.duplicateDriverInfo}
          onResolve={(choice, pendingDriverId, existingDriverId) => {
            resolveDuplicationMutation.mutate({
              choice,
              pendingDriverId,
              existingDriverId,
              pendingDriverData: currentDuplicateData.pendingDriver,
            });
          }}
        />
      )}
    </div>
  );
};

export default DriverManagement;