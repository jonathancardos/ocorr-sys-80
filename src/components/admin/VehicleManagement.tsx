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
import { Car, Edit2, Trash2, Loader2, Shield, Plus, PlusCircle, X, Upload, CheckCircle, RefreshCw, ArrowUp, ArrowDown, FilterX, ListFilter, Search, MoreVertical, Info, Wrench, XCircle as NoWrenchIcon, Lock, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Vehicle, VehicleInsert, VehicleUpdate } from '@/types/vehicles';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import BulkVehicleUpload from '@/components/vehicles/BulkVehicleUpload';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { VehicleStatsCard } from '@/components/vehicles/VehicleStatsCard';
import { VehicleReportGenerator } from '@/components/reports/VehicleReportGenerator';
import { VehicleFleetReportPreviewDialog } from '@/components/vehicles/VehicleFleetReportPreviewDialog';
import { VehicleBlockerAndPriorityStatsCard } from '../vehicles/VehicleBlockerAndPriorityStatsCard';
import { EditableBadge } from '@/components/EditableBadge'; // NEW: Import EditableBadge

const predefinedTechnologies = [
  "Bloqueador Duplo",
  "Bloqueio",
  "Rastreio",
  "2G",
  "4G",
];

type VehiclePendingApproval = Tables<'vehicles_pending_approval'>;

type VehiclePendingApprovalWithInfo = VehiclePendingApproval & {
  duplicateVehicleInfo?: Pick<Vehicle, 'id' | 'plate' | 'model' | 'technology' | 'has_workshop' | 'priority' | 'blocker_installed' | 'raw_blocker_installed_text' | 'raw_priority_text'> | null;
};

type CombinedVehicleItem =
  | ({ _itemType: 'registered' } & Vehicle)
  | ({ _itemType: 'pending_duplicate' | 'pending_new' } & VehiclePendingApprovalWithInfo);

type FilterCriteria = {
  type: 'original_vehicle_id' | 'reason';
  value: string;
} | null;

type SortColumn = keyof Vehicle | 'status' | null;
type SortDirection = 'asc' | 'desc';

export const VehicleManagement = () => {
  const { profile, user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);
  const [isReportGeneratorDialogOpen, setIsReportGeneratorDialogOpen] = useState(false);
  const [isFleetReportPreviewDialogOpen, setIsFleetReportPreviewDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTechnologyInput, setNewTechnologyInput] = useState('');
  const [selectedRegisteredVehicleIds, setSelectedRegisteredVehicleIds] = useState<string[]>([]);
  const [selectedPendingVehicleIds, setSelectedPendingVehicleIds] = useState<string[]>([]);
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'registered' | 'pending' | 'duplicates'>('all');
  const [sortColumn, setSortColumn] = useState<SortColumn>('plate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [formData, setFormData] = useState<VehicleInsert>({
    plate: '',
    model: '',
    technology: [],
    has_workshop: false,
    priority: null,
    blocker_installed: null,
    raw_blocker_installed_text: null,
    raw_priority_text: null,
  });

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

  const { data: vehicles, isLoading: isLoadingRegisteredVehicles, error: registeredVehiclesError } = useQuery<Vehicle[], Error>({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vehicles').select('*').order('plate', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: pendingVehicles, isLoading: isLoadingPendingVehicles, error: pendingVehiclesError } = useQuery<VehiclePendingApproval[], Error>({
    queryKey: ['vehiclesPendingApproval'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles_pending_approval')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: profile.role === 'admin',
  });

  const originalVehicleIds = useMemo(() => {
    if (!pendingVehicles) return [];
    const ids = new Set<string>();
    pendingVehicles.forEach(v => {
      if (v.original_vehicle_id) ids.add(v.original_vehicle_id);
    });
    return Array.from(ids);
  }, [pendingVehicles]);

  const { data: originalVehiclesDetails, isLoading: isLoadingOriginalVehiclesDetails } = useQuery<
    Pick<Vehicle, 'id' | 'plate' | 'model' | 'technology' | 'priority' | 'blocker_installed'>[],
    Error
  >({
    queryKey: ['originalVehiclesDetails', originalVehicleIds],
    queryFn: async () => {
      if (originalVehicleIds.length === 0) return [];
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, plate, model, technology, priority, blocker_installed')
        .in('id', originalVehicleIds);
      if (error) throw error;
      return data as Pick<Vehicle, 'id' | 'plate' | 'model' | 'technology' | 'priority' | 'blocker_installed'>[];
    },
    enabled: originalVehicleIds.length > 0,
  });

  const pendingVehiclesWithDuplicateInfo = useMemo(() => {
    if (!pendingVehicles) return [];
    const safeOriginalVehiclesDetails = originalVehiclesDetails || [];
    const originalVehiclesMap = new Map(safeOriginalVehiclesDetails.map(v => [v.id, v]) || []);

    return pendingVehicles.map(pending => {
      const duplicateVehicle = pending.original_vehicle_id
        ? originalVehiclesMap.get(pending.original_vehicle_id)
        : null;
      
      return {
        ...pending,
        duplicateVehicleInfo: duplicateVehicle,
      };
    });
  }, [pendingVehicles, originalVehiclesDetails]);

  const combinedDisplayList = useMemo(() => {
    const list: CombinedVehicleItem[] = [];
    const pendingByOriginalId = new Map<string, CombinedVehicleItem[]>();
    const standalonePending: CombinedVehicleItem[] = [];

    pendingVehiclesWithDuplicateInfo.forEach(pending => {
      if (pending.original_vehicle_id) {
        if (!pendingByOriginalId.has(pending.original_vehicle_id)) {
          pendingByOriginalId.set(pending.original_vehicle_id, []);
        }
        pendingByOriginalId.get(pending.original_vehicle_id)?.push({ ...pending, _itemType: 'pending_duplicate' } as CombinedVehicleItem);
      } else {
        standalonePending.push({ ...pending, _itemType: 'pending_new' } as CombinedVehicleItem);
      }
    });

    const sortedRegisteredVehicles = [...(vehicles || [])].sort((a, b) =>
      a.plate.localeCompare(b.plate)
    );

    sortedRegisteredVehicles.forEach(regVehicle => {
      list.push({ ...regVehicle, _itemType: 'registered' } as CombinedVehicleItem);
      const duplicates = pendingByOriginalId.get(regVehicle.id);
      if (duplicates) {
        duplicates.sort((a, b) => a.plate.localeCompare(b.plate));
        list.push(...duplicates);
      }
    });

    standalonePending.sort((a, b) => a.plate.localeCompare(b.plate));
    list.push(...standalonePending);

    return list;
  }, [vehicles, pendingVehiclesWithDuplicateInfo]);

  const filteredAndSortedList = useMemo(() => {
    let currentList = [...combinedDisplayList];

    if (searchTerm) {
      currentList = currentList.filter(item =>
        item.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.technology && item.technology.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }

    if (filterType !== 'all') {
      if (filterType === 'registered') {
        currentList = currentList.filter(item => item._itemType === 'registered');
      } else if (filterType === 'pending') {
        currentList = currentList.filter(item => item._itemType === 'pending_new' || item._itemType === 'pending_duplicate');
      } else if (filterType === 'duplicates') {
        const duplicateItemIds = new Set<string>();

        pendingVehiclesWithDuplicateInfo.forEach(p => {
          if (p.original_vehicle_id) {
            duplicateItemIds.add(p.id);
            duplicateItemIds.add(p.original_vehicle_id);
          } else if (p.reason && p.reason.includes('batch_duplicate')) {
            duplicateItemIds.add(p.id);
          }
        });
        currentList = currentList.filter(item => duplicateItemIds.has(item.id));
      }
    }

    if (filterCriteria) {
      currentList = currentList.filter(item => {
        if (filterCriteria.type === 'original_vehicle_id' && item._itemType !== 'registered' && 'original_vehicle_id' in item && item.original_vehicle_id) {
          return item.original_vehicle_id === filterCriteria.value;
        }
        if (filterCriteria.type === 'reason' && item._itemType !== 'registered' && 'reason' in item && item.reason) {
          return item.reason.includes(filterCriteria.value);
        }
        if (filterCriteria.type === 'original_vehicle_id' && item._itemType === 'registered' && item.id === filterCriteria.value) {
          return true;
        }
        return false;
      });
    }

    if (sortColumn) {
      const currentSortColumn = sortColumn;
      currentList.sort((a, b) => {
        let valA: any;
        let valB: any;

        if (currentSortColumn === 'status') {
          valA = a._itemType === 'registered' ? 'ativo' : 'pendente';
          valB = b._itemType === 'registered' ? 'ativo' : 'pendente';
        } else if (currentSortColumn === 'has_workshop') {
          valA = (a as Vehicle).has_workshop === true ? 1 : (a as Vehicle).has_workshop === false ? 0 : -1;
          valB = (b as Vehicle).has_workshop === true ? 1 : (b as Vehicle).has_workshop === false ? 0 : -1;
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        } else if (currentSortColumn === 'priority') {
          valA = (a as Vehicle).priority || -1;
          valB = (b as Vehicle).priority || -1;
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        } else if (currentSortColumn === 'blocker_installed') {
          valA = (a as Vehicle).blocker_installed === true ? 1 : (a as Vehicle).blocker_installed === false ? 0 : -1;
          valB = (b as Vehicle).blocker_installed === true ? 1 : (b as Vehicle).blocker_installed === false ? 0 : -1;
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        else {
          valA = (a as any)[currentSortColumn] || '';
          valB = (b as any)[currentSortColumn] || '';
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
  }, [combinedDisplayList, searchTerm, filterType, sortColumn, sortDirection, filterCriteria, pendingVehiclesWithDuplicateInfo]);

  const upsertVehicleMutation = useMutation({
    mutationFn: async (vehicleData: VehicleInsert | VehicleUpdate) => {
      console.log('upsertVehicleMutation: Data being sent to Supabase:', vehicleData);
      if (editingVehicle) {
        const { data, error } = await supabase
          .from('vehicles')
          .update(vehicleData as VehicleUpdate)
          .eq('id', editingVehicle.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('vehicles')
          .insert({ ...(vehicleData as VehicleInsert), uploaded_by: user?.id || null })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      console.log('upsertVehicleMutation: Success response:', data);
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['existingTechnologies'] });
      toast.success(editingVehicle ? "Veículo atualizado!" : "Veículo adicionado!", {
        description: editingVehicle ? "Os dados do veículo foram atualizados." : "Novo veículo cadastrado com sucesso.",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      console.error('upsertVehicleMutation: Error response:', err);
      toast.error("Erro ao salvar veículo", {
        description: err.message || "Não foi possível salvar os dados do veículo.",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // NEW: Mutation for quick update of has_workshop
  const updateHasWorkshopMutation = useMutation({
    mutationFn: async ({ id, has_workshop }: { id: string; has_workshop: boolean }) => {
      const { data, error } = await supabase
        .from('vehicles')
        .update({ has_workshop } as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success("Status de oficina atualizado!", { description: "O status de oficina do veículo foi alterado." });
    },
    onError: (err: any) => {
      toast.error("Erro ao atualizar status de oficina", { description: err.message || "Não foi possível atualizar o status." });
    },
  });

  // NEW: Mutation for quick update of priority
  const updatePriorityMutation = useMutation({
    mutationFn: async ({ id, priority, raw_priority_text }: { id: string; priority: number | null; raw_priority_text: string | null }) => {
      const { data, error } = await supabase
        .from('vehicles')
        .update({ priority, raw_priority_text })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success("Prioridade atualizada!", { description: "A prioridade do veículo foi alterada." });
    },
    onError: (err: any) => {
      toast.error("Erro ao atualizar prioridade", { description: err.message || "Não foi possível atualizar a prioridade." });
    },
  });

  // NEW: Mutation for quick update of blocker_installed
  const updateBlockerStatusMutation = useMutation({
    mutationFn: async ({ id, blocker_installed, raw_blocker_installed_text }: { id: string; blocker_installed: boolean | null; raw_blocker_installed_text: string | null }) => {
      const { data, error } = await supabase
        .from('vehicles')
        .update({ blocker_installed, raw_blocker_installed_text })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success("Status do bloqueador atualizado!", { description: "O status do bloqueador do veículo foi alterado." });
    },
    onError: (err: any) => {
      toast.error("Erro ao atualizar status do bloqueador", { description: err.message || "Não foi possível atualizar o status." });
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (data, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success("Veículo excluído!", {
        description: "O veículo foi removido do sistema.",
      });
      setSelectedRegisteredVehicleIds(prev => prev.filter(vehicleId => vehicleId !== deletedId));
    },
    onError: (err: any) => {
      console.error('Error deleting vehicle:', err);
      toast.error("Erro ao excluir veículo", {
        description: err.message || "Não foi possível excluir o veículo.",
      });
    },
  });

  const bulkDeleteRegisteredVehiclesMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('vehicles').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: (data, ids) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success("Veículos excluídos!", {
        description: `${ids.length} veículo(s) foram removido(s) do sistema.`,
      });
      setSelectedRegisteredVehicleIds([]);
    },
    onError: (err: any) => {
      console.error('Error bulk deleting vehicles:', err);
      toast.error("Erro ao excluir veículos", {
        description: err.message || "Não foi possível excluir os veículos selecionados.",
      });
    },
  });

  const approvePendingVehicleMutation = useMutation({
    mutationFn: async (vehicleToApprove: VehiclePendingApprovalWithInfo) => {
      if (!vehicleToApprove.original_vehicle_id) {
        const vehicleData: any = {
          plate: vehicleToApprove.plate,
          model: vehicleToApprove.model,
          technology: vehicleToApprove.technology,
          has_workshop: (vehicleToApprove as any).has_workshop,
          priority: vehicleToApprove.priority,
          blocker_installed: vehicleToApprove.blocker_installed,
          raw_blocker_installed_text: (vehicleToApprove as any).raw_blocker_installed_text,
          raw_priority_text: (vehicleToApprove as any).raw_priority_text,
        };
        const { error: insertError } = await supabase
          .from('vehicles')
          .insert(vehicleData);
        if (insertError) throw new Error(`Falha ao inserir novo veículo: ${insertError.message}`);
      } else {
        const vehicleData: any = {
          plate: vehicleToApprove.plate,
          model: vehicleToApprove.model,
          technology: vehicleToApprove.technology,
          has_workshop: (vehicleToApprove as any).has_workshop,
          priority: vehicleToApprove.priority,
          blocker_installed: vehicleToApprove.blocker_installed,
          raw_blocker_installed_text: (vehicleToApprove as any).raw_blocker_installed_text,
          raw_priority_text: (vehicleToApprove as any).raw_priority_text,
        };
        const { error: updateError } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', vehicleToApprove.original_vehicle_id);
        if (updateError) throw new Error(`Falha ao atualizar veículo existente: ${updateError.message}`);
      }

      const { error: deletePendingError } = await supabase
        .from('vehicles_pending_approval')
        .delete()
        .eq('id', vehicleToApprove.id);
      if (deletePendingError) throw new Error(`Falha ao remover entrada pendente: ${deletePendingError.message}`);

      return { message: 'Veículo aprovado e adicionado/atualizado no sistema.' };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vehiclesPendingApproval'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['originalVehiclesDetails'] });
      toast.success("Veículo aprovado!", {
        description: data.message,
      });
    },
    onError: (err: any) => {
      console.error('Erro ao aprovar veículo:', err);
      toast.error("Erro ao aprovar veículo", {
        description: err.message || "Não foi possível aprovar o veículo.",
      });
    },
  });

  const bulkApprovePendingVehiclesMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const pendingVehiclesToApprove = pendingVehiclesWithDuplicateInfo.filter(v => ids.includes(v.id));
      let approvedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      for (const vehicle of pendingVehiclesToApprove) {
        try {
          if (vehicle.original_vehicle_id) {
            const vehicleData: any = {
              plate: vehicle.plate,
              model: vehicle.model,
              technology: vehicle.technology,
              has_workshop: (vehicle as any).has_workshop,
              priority: vehicle.priority,
              blocker_installed: vehicle.blocker_installed,
              raw_blocker_installed_text: (vehicle as any).raw_blocker_installed_text,
              raw_priority_text: (vehicle as any).raw_priority_text,
            };
            const { error: updateError } = await supabase
              .from('vehicles')
              .update(vehicleData)
              .eq('id', vehicle.original_vehicle_id);
            if (updateError) throw updateError;
          } else {
            const vehicleData: any = {
              plate: vehicle.plate,
              model: vehicle.model,
              technology: vehicle.technology,
              has_workshop: (vehicle as any).has_workshop,
              priority: vehicle.priority,
              blocker_installed: vehicle.blocker_installed,
              raw_blocker_installed_text: (vehicle as any).raw_blocker_installed_text,
              raw_priority_text: (vehicle as any).raw_priority_text,
            };
            const { error: insertError } = await supabase.from('vehicles').insert(vehicleData);
            if (insertError) throw insertError;
          }

          const { error: deletePendingError } = await supabase.from('vehicles_pending_approval').delete().eq('id', vehicle.id);
          if (deletePendingError) throw deletePendingError;
          approvedCount++;
        } catch (error: any) {
          errors.push(`Falha ao aprovar ${vehicle.plate}: ${error.message}`);
        }
      }
      return { approvedCount, skippedCount, errors };
    },
    onSuccess: ({ approvedCount, skippedCount, errors }) => {
      queryClient.invalidateQueries({ queryKey: ['vehiclesPendingApproval'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['originalVehiclesDetails'] });
      setSelectedPendingVehicleIds([]);

      let description = '';
      if (approvedCount > 0) {
        description += `${approvedCount} veículo(s) aprovado(s). `;
      }
      if (skippedCount > 0) {
        description += `${skippedCount} veículo(s) ignorado(s) (duplicação). `;
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
        description: err.message || "Não foi possível aprovar os veículos selecionados.",
      });
    },
  });

  const rejectPendingVehicleMutation = useMutation({
    mutationFn: async (vehicleId: string) => {
      const { error } = await supabase
        .from('vehicles_pending_approval')
        .delete()
        .eq('id', vehicleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehiclesPendingApproval'] });
      queryClient.invalidateQueries({ queryKey: ['originalVehiclesDetails'] });
      toast.success("Veículo rejeitado!", {
        description: "O veículo pendente foi removido.",
      });
    },
    onError: (err: any) => {
      console.error('Erro ao rejeitar veículo:', err);
      toast.error("Erro ao rejeitar veículo", {
        description: err.message || "Não foi possível rejeitar o veículo.",
      });
    },
  });

  const bulkRejectPendingVehiclesMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('vehicles_pending_approval').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: (data, ids) => {
      queryClient.invalidateQueries({ queryKey: ['vehiclesPendingApproval'] });
      queryClient.invalidateQueries({ queryKey: ['originalVehiclesDetails'] });
      toast.success("Rejeição em massa concluída!", {
        description: `${ids.length} veículo(s) pendente(s) foram removido(s).`,
      });
      setSelectedPendingVehicleIds([]);
    },
    onError: (err: any) => {
      console.error('Erro na rejeição em massa:', err);
      toast.error("Erro na rejeição em massa", {
        description: err.message || "Não foi possível rejeitar os veículos selecionados.",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      plate: '',
      model: '',
      technology: [],
      has_workshop: false,
      priority: null,
      blocker_installed: null,
      raw_blocker_installed_text: null,
      raw_priority_text: null,
    });
    setEditingVehicle(null);
    setNewTechnologyInput('');
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      plate: vehicle.plate,
      model: vehicle.model,
      technology: vehicle.technology || [],
      has_workshop: vehicle.has_workshop || false,
      priority: vehicle.priority || null,
      blocker_installed: vehicle.blocker_installed || null,
      raw_blocker_installed_text: vehicle.raw_blocker_installed_text || null,
      raw_priority_text: vehicle.raw_priority_text || null,
    });
    setIsDialogOpen(true);
  };

  const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleFormSelectChange = (id: keyof VehicleInsert, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value === '' ? null : parseInt(value, 10) }));
  };

  const handleBlockerInstalledSelectChange = (value: string) => {
    setFormData(prev => {
      let blocker_installed: boolean | null = null;
      let raw_blocker_installed_text: string | null = null;

      if (value === 'installed') {
        blocker_installed = true;
        raw_blocker_installed_text = 'Instalado';
      } else if (value === 'not_installed') {
        blocker_installed = false;
        raw_blocker_installed_text = 'Não Instalado';
      } else if (value === 'will_not_install') {
        blocker_installed = false;
        raw_blocker_installed_text = 'Não Vai Instalar';
      } else if (value === 'other') {
        blocker_installed = null;
        raw_blocker_installed_text = '';
      } else {
        blocker_installed = null;
        raw_blocker_installed_text = null;
      }

      return {
        ...prev,
        blocker_installed,
        raw_blocker_installed_text,
      };
    });
  };

  const handleFormSwitchChange = (id: keyof VehicleInsert, checked: boolean) => {
    console.log(`handleFormSwitchChange: Updating field '${id}' to: ${checked}`);
    setFormData(prev => ({ ...prev, [id]: checked }));
  };

  const handleTechnologyChange = (selectedTech: string) => {
    setFormData(prev => {
      const currentTechnologies = prev.technology || [];
      if (currentTechnologies.includes(selectedTech)) {
        return { ...prev, technology: currentTechnologies.filter(tech => tech !== selectedTech) };
      } else {
        return { ...prev, technology: [...currentTechnologies, selectedTech] };
      }
    });
  };

  const handleAddNewTechnology = () => {
    const trimmedTech = newTechnologyInput.trim();
    if (trimmedTech && !(formData.technology || []).includes(trimmedTech)) {
      setFormData(prev => ({
        ...prev,
        technology: [...(prev.technology || []), trimmedTech],
      }));
      setNewTechnologyInput('');
    }
  };

  const removeTechnology = (techToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      technology: (prev.technology || []).filter(tech => tech !== techToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await upsertVehicleMutation.mutateAsync({
      plate: formData.plate,
      model: formData.model,
      technology: formData.technology,
      has_workshop: formData.has_workshop,
      priority: formData.priority,
      blocker_installed: formData.blocker_installed,
      raw_blocker_installed_text: formData.raw_blocker_installed_text,
      raw_priority_text: formData.raw_priority_text,
    });
  };

  const handleDeleteVehicle = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este veículo?")) {
      await deleteVehicleMutation.mutateAsync(id);
    }
  };

  const handleSelectRegisteredVehicle = (vehicleId: string, isChecked: boolean) => {
    setSelectedRegisteredVehicleIds(prev =>
      isChecked ? [...prev, vehicleId] : prev.filter(id => id !== vehicleId)
    );
  };

  const handleSelectAllRegisteredVehicles = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedRegisteredVehicleIds(vehicles?.map(vehicle => vehicle.id) || []);
    } else {
      setSelectedRegisteredVehicleIds([]);
    }
  };

  const handleDeleteSelectedRegisteredVehicles = async () => {
    if (selectedRegisteredVehicleIds.length === 0) {
      toast.info("Nenhum veículo registrado selecionado", {
        description: "Por favor, selecione os veículos que deseja excluir.",
      });
      return;
    }
    if (window.confirm(`Tem certeza que deseja excluir ${selectedRegisteredVehicleIds.length} veículo(s) registrado(s) selecionado(s)?`)) {
      await bulkDeleteRegisteredVehiclesMutation.mutateAsync(selectedRegisteredVehicleIds);
    }
  };

  const handleSelectPendingVehicle = (vehicleId: string, isChecked: boolean) => {
    setSelectedPendingVehicleIds(prev =>
      isChecked ? [...prev, vehicleId] : prev.filter(id => id !== vehicleId)
    );
  };

  const handleSelectAllPendingVehicles = (isChecked: boolean) => {
    const allPendingIds = filteredAndSortedList
      .filter(item => item._itemType === 'pending_duplicate' || item._itemType === 'pending_new')
      .map(item => item.id);
    if (isChecked) {
      setSelectedPendingVehicleIds(allPendingIds);
    } else {
      setSelectedPendingVehicleIds([]);
    }
  };

  const handleBulkApprovePendingVehicles = async () => {
    if (selectedPendingVehicleIds.length === 0) {
      toast.info("Nenhum veículo pendente selecionado", {
        description: "Por favor, selecione os veículos que deseja aprovar.",
      });
      return;
    }
    if (window.confirm(`Tem certeza que deseja aprovar ${selectedPendingVehicleIds.length} veículo(s) pendente(s) selecionado(s)?`)) {
      await bulkApprovePendingVehiclesMutation.mutateAsync(selectedPendingVehicleIds);
    }
  };

  const handleBulkRejectPendingVehicles = async () => {
    if (selectedPendingVehicleIds.length === 0) {
      toast.info("Nenhum veículo pendente selecionado", {
        description: "Por favor, selecione os veículos que deseja rejeitar.",
      });
      return;
    }
    if (window.confirm(`Tem certeza que deseja rejeitar ${selectedPendingVehicleIds.length} veículo(s) pendente(s) selecionado(s)?`)) {
      await bulkRejectPendingVehiclesMutation.mutateAsync(selectedPendingVehicleIds);
    }
  };

  const handleRefreshLists = () => {
    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    queryClient.invalidateQueries({ queryKey: ['vehiclesPendingApproval'] });
    queryClient.invalidateQueries({ queryKey: ['originalVehiclesDetails'] });
    toast.info("Listas atualizadas", {
      description: "Buscando as últimas informações de veículos.",
    });
  };

  const handleFilterByDuplication = (item: CombinedVehicleItem) => {
    if (item._itemType === 'registered') {
      setFilterCriteria({ type: 'original_vehicle_id', value: item.id });
      setFilterType('duplicates');
      toast.info("Filtro aplicado", {
        description: `Mostrando duplicações para o veículo original: ${item.plate} (${item.model}).`,
      });
    } else if (item._itemType === 'pending_duplicate' || item._itemType === 'pending_new') {
      if (item.original_vehicle_id) {
        setFilterCriteria({ type: 'original_vehicle_id', value: item.original_vehicle_id });
        setFilterType('duplicates');
        toast.info("Filtro aplicado", {
          description: `Mostrando duplicações para o veículo original: ${item.duplicateVehicleInfo?.plate || item.original_vehicle_id}.`,
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
    setSortColumn('plate');
    setSortDirection('asc');
    toast.info("Filtro removido", {
      description: "Mostrando todos os veículos.",
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

  const getReasonBadgeVariant = (reason: string) => {
    if (reason.includes('duplicate_plate') || reason.includes('batch_duplicate')) return 'warning';
    return 'secondary';
  };

  const getPriorityBadgeVariant = (priority: number | null) => {
    switch (priority) {
      case 1: return 'destructive'; // 1 = Alta
      case 2: return 'warning';     // 2 = Média
      case 3: return 'default';     // 3 = Baixa
      default: return 'secondary';
    }
  };

  const getBlockerStatusLabel = (blockerInstalled: boolean | null, rawText: string | null) => {
    if (blockerInstalled === true) return 'Instalado';
    if (blockerInstalled === false) {
      return 'Não Instalado';
    }
    return rawText || 'Não Classificado';
  };

  const getBlockerBadgeVariant = (blockerInstalled: boolean | null, rawText: string | null) => {
    if (blockerInstalled === true) return 'success';
    if (blockerInstalled === false) {
      return 'destructive';
    }
    return 'secondary';
  };

  const isLoadingAny = isLoadingRegisteredVehicles || isLoadingPendingVehicles || isLoadingOriginalVehiclesDetails;

  const allPendingVehiclesInFilteredList = filteredAndSortedList.filter(item => item._itemType === 'pending_duplicate' || item._itemType === 'pending_new');
  const allPendingVehiclesSelected = allPendingVehiclesInFilteredList.length > 0 && selectedPendingVehicleIds.length === allPendingVehiclesInFilteredList.length;
  const somePendingVehiclesSelected = selectedPendingVehicleIds.length > 0 && selectedPendingVehicleIds.length < allPendingVehiclesInFilteredList.length;

  const allRegisteredVehiclesInFilteredList = filteredAndSortedList.filter(item => item._itemType === 'registered');
  const allRegisteredVehiclesSelected = allRegisteredVehiclesInFilteredList.length > 0 && selectedRegisteredVehicleIds.length === allRegisteredVehiclesInFilteredList.length;
  const someRegisteredVehiclesSelected = selectedRegisteredVehicleIds.length > 0 && selectedRegisteredVehicleIds.length < allRegisteredVehiclesInFilteredList.length;

  const totalVehicles = vehicles?.length || 0;
  const vehiclesWithWorkshop = vehicles?.filter(v => v.has_workshop === true).length || 0;
  const vehiclesWithoutWorkshop = vehicles?.filter(v => v.has_workshop === false).length || 0;
  const vehiclesWithDoubleBlocker = vehicles?.filter(v => v.technology?.includes('Bloqueador Duplo')).length || 0;
  const vehiclesWithBlockerInstalled = vehicles?.filter(v => v.blocker_installed === true).length || 0;
  const vehiclesPriority1 = vehicles?.filter(v => v.priority === 1).length || 0;
  const vehiclesPriority2 = vehicles?.filter(v => v.priority === 2).length || 0;
  const vehiclesPriority3 = vehicles?.filter(v => v.priority === 3).length || 0;

  const vehiclesBlockerNotInstalledExplicitly = vehicles?.filter(v => 
    v.blocker_installed === false
  ).length || 0;

  const vehiclesBlockerStatusUnknown = vehicles?.filter(v => v.blocker_installed === null).length || 0;

  const getFormBlockerSelectValue = () => {
    if (formData.blocker_installed === true && formData.raw_blocker_installed_text === 'Instalado') {
      return 'installed';
    }
    if (formData.blocker_installed === false && formData.raw_blocker_installed_text === 'Não Instalado') {
      return 'not_installed';
    }
    if (formData.blocker_installed === false && formData.raw_blocker_installed_text === 'Não Vai Instalar') {
      return 'will_not_install';
    }
    if (formData.blocker_installed === null && formData.raw_blocker_installed_text !== null) {
      return 'other';
    }
    return 'unmapped';
  };


  if (isLoadingAny) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (registeredVehiclesError || pendingVehiclesError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-destructive">
          <p>Erro ao carregar dados: {registeredVehiclesError?.message || pendingVehiclesError?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Gerenciamento de Veículos</h2>
          <p className="text-muted-foreground">Cadastre, gerencie e aprove veículos da frota</p>
        </div>
        
        <div className="flex gap-2 flex-wrap justify-end">
          {selectedPendingVehicleIds.length > 0 && (
            <>
              <Button
                variant="outline"
                onClick={handleBulkApprovePendingVehicles}
                disabled={bulkApprovePendingVehiclesMutation.isPending}
                className="bg-success/10 text-success hover:bg-success/20"
              >
                {bulkApprovePendingVehiclesMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Aprovar Selecionados ({selectedPendingVehicleIds.length})
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkRejectPendingVehicles}
                disabled={bulkRejectPendingVehiclesMutation.isPending}
              >
                {bulkRejectPendingVehiclesMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <X className="mr-2 h-4 w-4" />
                )}
                Rejeitar Selecionados ({selectedPendingVehicleIds.length})
              </Button>
            </>
          )}

          {selectedRegisteredVehicleIds.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleDeleteSelectedRegisteredVehicles}
              disabled={bulkDeleteRegisteredVehiclesMutation.isPending}
            >
              {bulkDeleteRegisteredVehiclesMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Excluir Registrados ({selectedRegisteredVehicleIds.length})
            </Button>
          )}

          <Dialog open={isBulkUploadDialogOpen} onOpenChange={setIsBulkUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="hover:bg-primary/10 hover:text-primary">
                <Upload className="mr-2 h-4 w-4" />
                Upload em Massa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] modern-card">
              <DialogHeader>
                <DialogTitle>Upload em Massa de Veículos</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Carregue uma planilha (.xlsx, .csv) para cadastrar múltiplos veículos.
                </DialogDescription>
              </DialogHeader>
              <BulkVehicleUpload
                onUploadComplete={() => {
                  setIsBulkUploadDialogOpen(false);
                  queryClient.invalidateQueries({ queryKey: ['vehicles'] });
                }}
                onClose={() => setIsBulkUploadDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-corporate shadow-corporate hover:shadow-elevated">
                <Plus className="mr-2 h-4 w-4" />
                Novo Veículo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] modern-card">
              <DialogHeader>
                <DialogTitle>
                  {editingVehicle ? 'Editar Veículo' : 'Cadastrar Novo Veículo'}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {editingVehicle 
                    ? 'Atualize as informações do veículo'
                    : 'Preencha os dados para cadastrar um novo veículo'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="plate" className="font-semibold">Placa do Veículo *</Label>
                  <Input
                    id="plate"
                    value={formData.plate}
                    onChange={handleFormInputChange}
                    required
                    disabled={!!editingVehicle} 
                    className="h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="model" className="font-semibold">Modelo do Veículo *</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={handleFormInputChange}
                    required
                    className="h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="technology" className="font-semibold">Tecnologias</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(formData.technology || []).map(tech => (
                      <Badge key={tech} variant="secondary" className="pr-1">
                        {tech}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0.5 ml-1"
                          onClick={() => removeTechnology(tech)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <Select
                    onValueChange={handleTechnologyChange}
                    value=""
                    disabled={isLoadingAny}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Adicionar tecnologia existente" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {isLoadingAny ? (
                        <SelectItem value="loading" disabled>Carregando tecnologias...</SelectItem>
                      ) : (
                        [...predefinedTechnologies, ...((queryClient.getQueryData(['existingTechnologies']) as string[]) || [])]
                          .filter((tech, i, arr) => arr.indexOf(tech) === i)
                          .sort()
                          .map(tech => (
                            <SelectItem key={tech} value={tech} disabled={(formData.technology || []).includes(tech)}>
                              {tech}
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center space-x-2 mt-2">
                    <Input
                      id="newTechnology"
                      placeholder="Ou digite uma nova tecnologia"
                      value={newTechnologyInput}
                      onChange={(e) => setNewTechnologyInput(e.target.value)}
                      className="h-11 flex-1"
                    />
                    <Button type="button" onClick={handleAddNewTechnology} disabled={!newTechnologyInput.trim()} className="hover:bg-primary/10 hover:text-primary">
                      <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority" className="font-semibold">Prioridade</Label>
                    <Select
                      value={formData.priority?.toString() || ''}
                      onValueChange={(value) => handleFormSelectChange('priority', value)}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecione a prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 (Alta)</SelectItem>
                        <SelectItem value="2">2 (Média)</SelectItem>
                        <SelectItem value="3">3 (Baixa)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="blocker_installed_select" className="flex items-center gap-1 font-semibold">
                      Bloqueador Instalado?
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">Indica se o veículo possui um bloqueador instalado.</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Select
                      value={getFormBlockerSelectValue()}
                      onValueChange={handleBlockerInstalledSelectChange}
                    >
                      <SelectTrigger id="blocker_installed_select" className="h-11">
                        <SelectValue placeholder="Selecione o status do bloqueador" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unmapped">Não Classificado</SelectItem>
                        <SelectItem value="installed">Instalado</SelectItem>
                        <SelectItem value="not_installed">Não Instalado</SelectItem>
                        <SelectItem value="will_not_install">Não Vai Instalar</SelectItem>
                        <SelectItem value="other">Outra Informação</SelectItem>
                      </SelectContent>
                    </Select>
                    {getFormBlockerSelectValue() === 'other' && (
                      <Input
                        id="raw_blocker_installed_text"
                        placeholder="Descreva o status do bloqueador"
                        value={formData.raw_blocker_installed_text || ''}
                        onChange={handleFormInputChange}
                        className="h-11"
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-4">
                  <Switch
                    id="has_workshop"
                    checked={formData.has_workshop || false}
                    onCheckedChange={(checked) => handleFormSwitchChange('has_workshop', checked)}
                  />
                  <Label htmlFor="has_workshop" className="flex items-center gap-1 font-semibold">
                    Tem Oficina?
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">Esta informação é um controle interno da Siga+.</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary-dark">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingVehicle ? 'Atualizando...' : 'Cadastrando...'}
                      </>
                    ) : (
                      editingVehicle ? 'Atualizar' : 'Cadastrar'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="col-span-full sm:col-span-2 lg:col-span-2 flex flex-col gap-4">
        <VehicleBlockerAndPriorityStatsCard
          totalVehicles={totalVehicles}
          vehiclesWithBlockerInstalled={vehiclesWithBlockerInstalled}
          vehiclesBlockerNotInstalledExplicitly={vehiclesBlockerNotInstalledExplicitly}
          vehiclesBlockerStatusUnknown={vehiclesBlockerStatusUnknown}
          vehiclesPriority1={vehiclesPriority1}
          vehiclesPriority2={vehiclesPriority2}
          vehiclesPriority3={vehiclesPriority3}
          allVehicles={vehicles || []}
        />
        <Button
          onClick={() => setIsFleetReportPreviewDialogOpen(true)}
          className="w-full bg-gradient-corporate shadow-corporate hover:shadow-elevated"
        >
          <Download className="mr-2 h-4 w-4" />
          Gerar Relatório da Frota
        </Button>
      </div>

      <Card className="modern-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            Gerenciamento de Veículos
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
              className="hover:bg-primary/10 hover:text-primary"
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
            Lista completa de veículos, incluindo os pendentes para aprovação.
          </CardDescription>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por placa, modelo ou tecnologia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Select value={filterType} onValueChange={(value: 'all' | 'registered' | 'pending' | 'duplicates') => setFilterType(value)}>
              <SelectTrigger className="w-full sm:w-[180px] h-11">
                <ListFilter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar por Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="registered">Registrados</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="duplicates">Duplicados</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={allPendingVehiclesSelected && allRegisteredVehiclesSelected}
                      indeterminate={(somePendingVehiclesSelected || someRegisteredVehiclesSelected) ? true : undefined}
                      onCheckedChange={(checked: boolean) => {
                        handleSelectAllRegisteredVehicles(checked);
                        handleSelectAllPendingVehicles(checked);
                      }}
                      aria-label="Selecionar todos os veículos"
                    />
                  </TableHead>
                  <TableHead onClick={() => handleSort('plate')} className="cursor-pointer hover:text-primary whitespace-nowrap font-semibold">
                    <div className="flex items-center">
                      Placa {renderSortIcon('plate')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('model')} className="cursor-pointer hover:text-primary whitespace-nowrap font-semibold">
                    <div className="flex items-center">
                      Modelo {renderSortIcon('model')}
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold">Tecnologias</TableHead>
                  <TableHead onClick={() => handleSort('has_workshop')} className="cursor-pointer hover:text-primary whitespace-nowrap font-semibold">
                    <div className="flex items-center">
                      Oficina {renderSortIcon('has_workshop')}
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold">Prioridade</TableHead> {/* Simplified label */}
                  <TableHead className="font-semibold">Bloqueador</TableHead> {/* Simplified label */}
                  <TableHead onClick={() => handleSort('status')} className="cursor-pointer hover:text-primary whitespace-nowrap font-semibold">
                    <div className="flex items-center">
                      Status {renderSortIcon('status')}
                    </div>
                  </TableHead>
                  <TableHead className="text-right whitespace-nowrap font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedList && filteredAndSortedList.length > 0 ? (
                  filteredAndSortedList.map((item) => (
                    <TableRow
                      key={item.id}
                      className={cn(
                        'hover:bg-muted/50',
                        ((item._itemType === 'registered' && pendingVehiclesWithDuplicateInfo.some(p => p.original_vehicle_id === item.id)) ||
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
                            checked={selectedRegisteredVehicleIds.includes(item.id)}
                            onCheckedChange={(checked: boolean) => handleSelectRegisteredVehicle(item.id, checked)}
                            aria-label={`Selecionar veículo ${item.plate}`}
                          />
                        ) : (
                          <Checkbox
                            checked={selectedPendingVehicleIds.includes(item.id)}
                            onCheckedChange={(checked: boolean) => handleSelectPendingVehicle(item.id, checked)}
                            aria-label={`Selecionar veículo pendente ${item.plate}`}
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-medium max-w-[150px] truncate">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              {item._itemType === 'pending_duplicate' && <span className="ml-4">↳ </span>}
                              {item.plate}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {item.plate}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{item.model || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(item.technology || []).map(tech => (
                            <Badge key={tech} variant="outline">{tech}</Badge>
                          ))}
                          {(item.technology || []).length === 0 && '-'}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {item._itemType === 'registered' ? (
                          <EditableBadge
                            currentValue={item.has_workshop}
                            displayValue={item.has_workshop === true ? 'Sim' : item.has_workshop === false ? 'Não' : 'N/A'}
                            options={[
                              { label: 'Sim', value: true, variant: 'success' },
                              { label: 'Não', value: false, variant: 'destructive' },
                            ]}
                            onSave={(newValue) => updateHasWorkshopMutation.mutate({ id: item.id, has_workshop: newValue as boolean })}
                            isLoading={updateHasWorkshopMutation.isPending}
                          badgeVariant={(item as any).has_workshop === true ? 'success' : (item as any).has_workshop === false ? 'destructive' : 'secondary'}
                            icon={(item as any).has_workshop === true ? Wrench : (item as any).has_workshop === false ? NoWrenchIcon : undefined}
                          />
                        ) : (
                          (item as any).has_workshop === true ? (
                            <Badge variant="success">Sim</Badge>
                          ) : (item as any).has_workshop === false ? (
                            <Badge variant="destructive">Não</Badge>
                          ) : (
                            <Badge variant="secondary">N/A</Badge>
                          )
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {item._itemType === 'registered' ? (
                          <EditableBadge
                            currentValue={item.priority}
                            displayValue={(item as any).raw_priority_text || `Prioridade ${item.priority || 'N/A'}`}
                            options={[
                              { label: 'Prioridade 1 (Alta)', value: 1, variant: 'destructive' },
                              { label: 'Prioridade 2 (Média)', value: 2, variant: 'warning' },
                              { label: 'Prioridade 3 (Baixa)', value: 3, variant: 'default' },
                              { label: 'N/A', value: null, variant: 'secondary' },
                            ]}
                            onSave={(newValue) => updatePriorityMutation.mutate({ id: item.id, priority: newValue as number | null, raw_priority_text: newValue !== null ? `Prioridade ${newValue}` : null })}
                            isLoading={updatePriorityMutation.isPending}
                            badgeVariant={getPriorityBadgeVariant(item.priority)}
                          />
                        ) : (
                          <Badge variant={getPriorityBadgeVariant(item.priority)}>
                            {(item as any).raw_priority_text || `Prioridade ${item.priority || 'N/A'}`}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {item._itemType === 'registered' ? (
                          <EditableBadge
                            currentValue={item.blocker_installed}
                            displayValue={getBlockerStatusLabel(item.blocker_installed, (item as any).raw_blocker_installed_text)}
                            options={[
                              { label: 'Instalado', value: true, variant: 'success', icon: Lock },
                              { label: 'Não Instalado', value: false, variant: 'destructive', icon: X },
                              { label: 'Não Classificado', value: null, variant: 'secondary', icon: Info },
                            ]}
                            onSave={(newValue) => {
                              let rawText: string | null = null;
                              if (newValue === true) rawText = 'Instalado';
                              else if (newValue === false) rawText = 'Não Instalado';
                              updateBlockerStatusMutation.mutate({ id: item.id, blocker_installed: newValue as boolean | null, raw_blocker_installed_text: rawText });
                            }}
                            isLoading={updateBlockerStatusMutation.isPending}
                            badgeVariant={getBlockerBadgeVariant(item.blocker_installed, (item as any).raw_blocker_installed_text)}
                            icon={item.blocker_installed === true ? Lock : item.blocker_installed === false ? X : Info}
                          />
                        ) : (
                          <Badge variant={getBlockerBadgeVariant(item.blocker_installed, (item as any).raw_blocker_installed_text)}>
                            {getBlockerStatusLabel(item.blocker_installed, (item as any).raw_blocker_installed_text)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {item._itemType === 'registered' ? (
                          <Badge variant="success">Ativo</Badge>
                        ) : (
                          item.duplicateVehicleInfo || item.reason ? (
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
                                {item.duplicateVehicleInfo && (
                                  <p className="text-xs text-muted-foreground">
                                    <span className="font-semibold">Existente:</span> {item.duplicateVehicleInfo.plate} ({item.duplicateVehicleInfo.model})
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  <span className="font-semibold">Pendente:</span> {item.plate} ({item.model})
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
                          <DropdownMenuContent align="end" className="bg-card border-border">
                            {item._itemType === 'registered' ? (
                              <>
                                <DropdownMenuItem onClick={() => handleEditVehicle(item)}>
                                  <Edit2 className="mr-2 h-4 w-4" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteVehicle(item.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <>
                                <DropdownMenuItem
                                  onClick={() => approvePendingVehicleMutation.mutate(item)}
                                  disabled={approvePendingVehicleMutation.isPending}
                                >
                                  {approvePendingVehicleMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                  )}
                                  Aprovar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => rejectPendingVehicleMutation.mutate(item.id)}
                                  className="text-destructive"
                                  disabled={rejectPendingVehicleMutation.isPending}
                                >
                                  {rejectPendingVehicleMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <X className="mr-2 h-4 w-4" />
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
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      <Car className="h-10 w-10 mx-auto mb-3 text-success" />
                      <p>Nenhum veículo encontrado.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isReportGeneratorDialogOpen} onOpenChange={setIsReportGeneratorDialogOpen}>
        <DialogContent className="sm:max-w-[700px] bg-card/20 backdrop-blur-md border border-border/50">
          <DialogHeader>
            <DialogTitle>Gerar Relatório de Veículos</DialogTitle>
            <DialogDescription>
              Selecione o filtro para gerar o relatório de veículos.
            </DialogDescription>
          </DialogHeader>
          <VehicleReportGenerator
            onClose={() => setIsReportGeneratorDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <VehicleFleetReportPreviewDialog
        isOpen={isFleetReportPreviewDialogOpen}
        onClose={() => setIsFleetReportPreviewDialogOpen(false)}
        vehicles={vehicles || []}
      />
    </div>
  );
};