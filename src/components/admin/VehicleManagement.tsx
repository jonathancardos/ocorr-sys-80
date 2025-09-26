import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner'; // Importar toast do sonner
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Car, Edit2, Trash2, Loader2, Shield, Plus, PlusCircle, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Vehicle, VehicleInsert, VehicleUpdate } from '@/types/vehicles';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const predefinedTechnologies = [
  "Bloqueador Duplo",
  "Bloqueio",
  "Rastreio",
  "2G",
  "4G",
];

export const VehicleManagement = () => {
  const { profile } = useAuth();
  // Removido: const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTechnologyInput, setNewTechnologyInput] = useState('');

  const [formData, setFormData] = useState<VehicleInsert>({ // Use TablesInsert for initial form state
    plate: '',
    model: '',
    technology: [],
  });

  // Check if current user is admin
  if (profile?.role !== 'admin') {
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

  // Fetch vehicles
  const { data: vehicles, isLoading, error } = useQuery<Vehicle[], Error>({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vehicles').select('*').order('plate', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch all existing technologies from the database to populate the select options
  const { data: existingTechnologies, isLoading: isLoadingExistingTechnologies } = useQuery<string[], Error>({
    queryKey: ['existingTechnologies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('technology')
        .not('technology', 'is', null);

      if (error) throw error;

      const allTechnologies = new Set<string>();
      (data as Tables<'vehicles'>[]).forEach(vehicle => { // Explicitly cast data to Tables<'vehicles'>[]
        if (vehicle.technology) {
          vehicle.technology.forEach(tech => allTechnologies.add(tech));
        }
      });
      return Array.from(allTechnologies).sort();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Add/Update vehicle mutation
  const upsertVehicleMutation = useMutation({
    mutationFn: async (vehicleData: TablesInsert<'vehicles'> | TablesUpdate<'vehicles'>) => { // Allow both insert and update types
      if (editingVehicle) {
        const { data, error } = await supabase
          .from('vehicles')
          .update(vehicleData as TablesUpdate<'vehicles'>) // Cast for update
          .eq('id', editingVehicle.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('vehicles')
          .insert(vehicleData as TablesInsert<'vehicles'>) // Cast for insert
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['existingTechnologies'] });
      toast.success(editingVehicle ? "Veículo atualizado!" : "Veículo adicionado!", {
        description: editingVehicle ? "Os dados do veículo foram atualizados." : "Novo veículo cadastrado com sucesso.",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      console.error('Error upserting vehicle:', err);
      toast.error("Erro ao salvar veículo", {
        description: err.message || "Não foi possível salvar os dados do veículo.",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Delete vehicle mutation
  const deleteVehicleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['existingTechnologies'] });
      toast.success("Veículo excluído!", {
        description: "O veículo foi removido do sistema.",
      });
    },
    onError: (err: any) => {
      console.error('Error deleting vehicle:', err);
      toast.error("Erro ao excluir veículo", {
        description: err.message || "Não foi possível excluir o veículo.",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      plate: '',
      model: '',
      technology: [],
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
    });
    setIsDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
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
    });
  };

  const handleDeleteVehicle = async (id: string) => { // Defined handleDeleteVehicle
    if (window.confirm("Tem certeza que deseja excluir este veículo?")) {
      await deleteVehicleMutation.mutateAsync(id);
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
          <p>Erro ao carregar veículos: {error.message}</p>
        </div>
      </div>
    );
  }

  const allAvailableTechnologies = Array.from(new Set([...predefinedTechnologies, ...(existingTechnologies || [])])).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gerenciamento de Veículos</h2>
          <p className="text-muted-foreground">Cadastre e gerencie os veículos da frota</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Veículo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingVehicle ? 'Editar Veículo' : 'Cadastrar Novo Veículo'}
              </DialogTitle>
              <DialogDescription>
                {editingVehicle 
                  ? 'Atualize as informações do veículo'
                  : 'Preencha os dados para cadastrar um novo veículo'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plate">Placa do Veículo *</Label>
                <Input
                  id="plate"
                  value={formData.plate}
                  onChange={handleInputChange}
                  required
                  disabled={!!editingVehicle} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model">Modelo do Veículo *</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="technology">Tecnologias</Label>
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
                  value="" // Keep value empty to allow re-selection
                  disabled={isLoadingExistingTechnologies}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Adicionar tecnologia existente" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingExistingTechnologies ? (
                      <SelectItem value="loading" disabled>Carregando tecnologias...</SelectItem>
                    ) : (
                      allAvailableTechnologies.map(tech => (
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
                  <Button type="button" onClick={handleAddNewTechnology} disabled={!newTechnologyInput.trim()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
                  </Button>
                </div>
              </div>
              
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

      <Card className="modern-card">
        <CardHeader>
          <CardTitle>Veículos Cadastrados</CardTitle>
          <CardDescription>
            {vehicles?.length || 0} veículo{vehicles?.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Tecnologias</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles?.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">{vehicle.plate}</TableCell>
                    <TableCell>{vehicle.model}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(vehicle.technology || []).map(tech => (
                          <Badge key={tech} variant="outline">{tech}</Badge>
                        ))}
                        {(vehicle.technology || []).length === 0 && '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditVehicle(vehicle)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteVehicle(vehicle.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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