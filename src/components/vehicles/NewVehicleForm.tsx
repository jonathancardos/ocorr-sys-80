import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner'; // Importar toast do sonner
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Loader2, PlusCircle, X } from 'lucide-react';
import { Vehicle, VehicleInsert } from '@/types/vehicles';
import { Tables, TablesInsert } from '@/integrations/supabase/types'; // Import Tables
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
  // Removido: const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTechnologyInput, setNewTechnologyInput] = useState('');

  const [formData, setFormData] = useState<VehicleInsert>({
    plate: '',
    model: '',
    technology: [],
  });

  // Fetch all existing technologies from the database to populate the select options
  const { data: existingTechnologies, isLoading: isLoadingExistingTechnologies } = useQuery<string[], Error>({
    queryKey: ['existingTechnologies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('technology')
        .not('technology', 'is', null); // Only get rows where technology is not null

      if (error) throw error;

      const allTechnologies = new Set<string>();
      (data as Vehicle[]).forEach(vehicle => { // Explicitly cast data to Vehicle[]
        if (vehicle.technology) {
          vehicle.technology.forEach(tech => allTechnologies.add(tech));
        }
      });
      return Array.from(allTechnologies).sort();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

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

  const createVehicleMutation = useMutation({
    mutationFn: async (vehicleData: VehicleInsert) => {
      const { data, error } = await supabase
        .from('vehicles')
        .insert(vehicleData)
        .select('id')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] }); // Invalidate to refetch vehicles list
      queryClient.invalidateQueries({ queryKey: ['existingTechnologies'] }); // Invalidate to refetch technologies
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
    });
  };

  const allAvailableTechnologies = Array.from(new Set([...predefinedTechnologies, ...(existingTechnologies || [])])).sort();

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