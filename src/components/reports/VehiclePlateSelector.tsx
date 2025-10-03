import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MultiSelect } from '@/components/ui/multi-select'; // Assuming you have a MultiSelect component
import { Label } from '@/components/ui/label';
import { Vehicle } from '@/types/vehicles';

interface VehiclePlateSelectorProps {
  selectedPlates: string[];
  onPlatesChange: (plates: string[]) => void;
}

export const VehiclePlateSelector: React.FC<VehiclePlateSelectorProps> = ({
  selectedPlates,
  onPlatesChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [availablePlates, setAvailablePlates] = useState<{ label: string; value: string }[]>([]);

  const { data: platesData, isLoading, error } = useQuery<{ plate: string }[], Error>({
    queryKey: ['allVehiclePlates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vehicles').select('plate');
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (platesData) {
      const plates = platesData.map(v => ({ label: v.plate, value: v.plate }));
      setAvailablePlates(plates);
    }
  }, [platesData]);

  const filteredPlates = availablePlates.filter(plate =>
    plate.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <Label htmlFor="plate-selector">Selecionar Placas</Label>
      <MultiSelect
        options={filteredPlates}
        selected={selectedPlates}
        onSelectedChange={onPlatesChange}
        placeholder="Buscar e selecionar placas..."
        onSearchChange={setSearchTerm}
        emptyMessage="Nenhuma placa encontrada."
      />
      {error && <p className="text-red-500 text-sm">Erro ao carregar placas: {error.message}</p>}
    </div>
  );
};