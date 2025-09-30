import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner'; // Importar toast do sonner
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Loader2, PlusCircle, X, Info } from 'lucide-react'; // Adicionado Info icon
import { Vehicle, VehicleInsert } from '@/types/vehicles';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch'; // Import Switch
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'; // Import Tooltip

interface NewVehicleFormProps {
  onVehicleCreated: (vehicleId: string) => void;
  onClose: () => void;
}

const predefinedTechnologies = [
  "Bloqueador Duplo",
  "Bloqueio",
  "Rastreio",
  "2G",
  "4G",
];

const NewVehicleForm: React.FC<NewVehicleFormProps> = ({ onVehicleCreated, onClose }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTechnologyInput, setNewTechnologyInput] = useState('');

  const [formData, setFormData] = useState<VehicleInsert>({
    plate: '',
    model: '',
    technology: [],
    has_workshop: false,
    priority: null, // NEW FIELD
    blocker_installed: null, // Changed default to null
    raw_blocker_installed_text: null, // NEW FIELD
    raw_priority_text: null, // NEW FIELD
  });

  const { data: existingTechnologies, isLoading: isLoadingExistingTechnologies } = useQuery<string[], Error>({
    queryKey: ['existingTechnologies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('technology')
        .not('technology', 'is', null);

      if (error) throw error;

      const allTechnologies = new Set<string>();
      (data as Vehicle[]).forEach(vehicle => {
        if (vehicle.technology) {
          vehicle.technology.forEach(tech => allTechnologies.add(tech));
        }
      });
      return Array.from(allTechnologies).sort();
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof VehicleInsert, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value === '' ? null : parseInt(value, 10) }));
  };

  const handleSwitchChange = (id: keyof VehicleInsert, checked: boolean) => {
    setFormData(prev => ({ ...prev, [id]: checked }));
  };

  // NEW: Handle change for blocker_installed select
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
        blocker_installed = null; // Or keep as false if 'other' implies not installed
        raw_blocker_installed_text = ''; // Clear for custom input
      } else { // 'unmapped' or empty
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

  const handleTechnologyChange = (selectedTech: string) => {
    setFormData(prev => {
      const currentTechnologies = prev.technology || [];
      if (currentTechnologies.includes(selectedTech)) {
        // If already included, remove it (toggle off)
        return { ...prev, technology: currentTechnologies.filter(tech => tech !== selectedTech) };
      } else {
        // If not included, add it
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

  const createVehicleMutation = useMutation({
    mutationFn: async (vehicleData: VehicleInsert) => {
      const { data, error } = await supabase
        .from('vehicles')
        .insert({ ...vehicleData, uploaded_by: user?.id || null })
        .select('id')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] }); // Invalidate to refetch vehicles list
      queryClient.invalidateQueries({ queryKey: ['existingTechnologies'] });
      toast.success("Veículo cadastrado!", {
        description: `${formData.plate} (${formData.model}) foi adicionado com sucesso.`,
      });
      if (data) { // Add null check for data
        onVehicleCreated(data.id); // Pass the new vehicle's ID back
      }
      onClose(); // Close the dialog
    },
    onError: (err: any) => {
      console.error('Error creating vehicle:', err);
      toast.error("Erro ao cadastrar veículo", {
        description: err.message || "Não foi possível cadastrar o veículo.",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await createVehicleMutation.mutateAsync({
      plate: formData.plate,
      model: formData.model,
      technology: formData.technology,
      has_workshop: formData.has_workshop,
      priority: formData.priority,
      blocker_installed: formData.blocker_installed,
      raw_blocker_installed_text: formData.raw_blocker_installed_text, // NEW
      raw_priority_text: formData.raw_priority_text, // NEW
    });
  };

  const allAvailableTechnologies = Array.from(new Set([...predefinedTechnologies, ...(existingTechnologies || [])])).sort();

  // Determine the selected value for the blocker_installed select
  const getBlockerSelectValue = () => {
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
      return 'other'; // Custom text entered
    }
    return 'unmapped'; // Default or not set
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="plate">Placa do Veículo *</Label>
        <Input
          id="plate"
          value={formData.plate}
          onChange={handleInputChange}
          required
          placeholder="Ex: ABC-1234"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="model">Modelo do Veículo *</Label>
        <Input
          id="model"
          value={formData.model}
          onChange={handleInputChange}
          required
          placeholder="Ex: Mercedes Sprinter"
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
          value="" // Reset the select value after selection
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* NEW FIELD: Priority */}
        <div className="space-y-2">
          <Label htmlFor="priority" className="font-semibold">Prioridade</Label>
          <Select
            value={formData.priority?.toString() || ''}
            onValueChange={(value) => handleSelectChange('priority', value)}
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
          {/* NEW: Raw text input for priority */}
          <Input
            id="raw_priority_text"
            placeholder="Texto original da prioridade (opcional)"
            value={formData.raw_priority_text || ''}
            onChange={handleInputChange}
            className="h-11"
          />
        </div>

        {/* UPDATED FIELD: Blocker Installed */}
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
            value={getBlockerSelectValue()}
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
          {/* Conditional raw text input for blocker_installed */}
          {getBlockerSelectValue() === 'other' && (
            <Input
              id="raw_blocker_installed_text"
              placeholder="Descreva o status do bloqueador"
              value={formData.raw_blocker_installed_text || ''}
              onChange={handleInputChange}
              className="h-11"
            />
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-4">
        <Switch
          id="has_workshop"
          checked={formData.has_workshop || false}
          onCheckedChange={(checked) => handleSwitchChange('has_workshop', checked)}
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
      
      <DialogFooter className="pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cadastrando...
            </>
          ) : (
            'Cadastrar'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default NewVehicleForm;