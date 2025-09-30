import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner'; // Importar toast do sonner
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { TablesInsert } from '@/integrations/supabase/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea'; // Import Textarea
import { calculateOmnilinkScoreStatus, calculateOmnilinkScoreExpiry, OmnilinkDetailedStatus, getDetailedOmnilinkStatus } from '@/lib/driver-utils'; // Import from new utility

interface NewDriverFormProps {
  onDriverCreated: (driverId: string) => void;
  onClose: () => void;
}

const predefinedTechnologies = [
  "Bloqueador Duplo",
  "Bloqueio",
  "Rastreio",
  "2G",
  "4G",
];

const NewDriverForm: React.FC<NewDriverFormProps> = ({ onDriverCreated, onClose }) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<TablesInsert<'drivers'>>({
    full_name: '',
    cpf: '',
    cnh: null, // Default to null as per schema
    cnh_expiry: null, // Default to null as per schema
    phone: null, // Default to null as per schema
    type: null, // New field
    omnilink_score_registration_date: null, // New field
    omnilink_score_expiry_date: null, // New field
    omnilink_score_status: null, // New field
    status_indicacao: 'nao_indicado', // NEW FIELD: Default to 'nao_indicado'
    reason_nao_indicacao: null, // NEW FIELD
  });

  const [detailedOmnilinkStatus, setDetailedOmnilinkStatus] = useState<OmnilinkDetailedStatus | null>(null); // NEW STATE

  useEffect(() => {
    if (formData.omnilink_score_registration_date) {
      setDetailedOmnilinkStatus(getDetailedOmnilinkStatus(formData.omnilink_score_registration_date));
    } else {
      setDetailedOmnilinkStatus(null);
    }
  }, [formData.omnilink_score_registration_date]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { // Updated to handle Textarea
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value === '' ? null : value })); // Set to null if empty string
  };

  const handleOmnilinkRegDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const regDate = e.target.value === '' ? null : e.target.value;
    const expiryDate = calculateOmnilinkScoreExpiry(regDate);
    const statusForDb = calculateOmnilinkScoreStatus(regDate); // For DB storage
    const detailedStatus = getDetailedOmnilinkStatus(regDate); // For UI display
    setFormData(prev => ({
      ...prev,
      omnilink_score_registration_date: regDate,
      omnilink_score_expiry_date: expiryDate,
      omnilink_score_status: statusForDb, // Store 'em_dia' or 'inapto' in DB
    }));
    setDetailedOmnilinkStatus(detailedStatus); // Update detailed status for UI
  };

  const handleSelectChange = (id: keyof TablesInsert<'drivers'>, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value === '' ? null : value }));
    // Clear reason_nao_indicacao if status is not 'nao_indicado'
    if (id === 'status_indicacao' && value !== 'nao_indicado') {
      setFormData(prev => ({ ...prev, reason_nao_indicacao: null }));
    }
  };

  const createDriverMutation = useMutation({
    mutationFn: async (driverData: TablesInsert<'drivers'>) => {
      const { data, error } = await supabase
        .from('drivers')
        .insert(driverData)
        .select('id')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] }); // Invalidate to refetch drivers list
      toast.success("Motorista cadastrado!", {
        description: `${formData.full_name} foi adicionado com sucesso.`,
      });
      if (data) { // Add null check for data
        onDriverCreated(data.id); // Pass the new driver's ID back
      }
      onClose(); // Close the dialog
    },
    onError: (err: any) => {
      console.error('Error creating driver:', err);
      toast.error("Erro ao cadastrar motorista", {
        description: err.message || "Não foi possível cadastrar o motorista.",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await createDriverMutation.mutateAsync(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Nome Completo *</Label>
        <Input
          id="full_name"
          value={formData.full_name || ''}
          onChange={handleInputChange}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="cpf">CPF *</Label>
        <Input
          id="cpf"
          value={formData.cpf || ''}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <Select
          value={formData.type || ''}
          onValueChange={(value) => handleSelectChange('type', value)}
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
            onChange={handleInputChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="cnh_expiry">Validade CNH</Label>
          <Input
            id="cnh_expiry"
            type="date"
            value={formData.cnh_expiry || ''}
            onChange={handleInputChange}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          value={formData.phone || ''}
          onChange={handleInputChange}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="omnilink_score_registration_date">Data de Cadastro Omnilink Score</Label>
        <Input
          id="omnilink_score_registration_date"
          type="date"
          value={formData.omnilink_score_registration_date || ''}
          onChange={handleOmnilinkRegDateChange}
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
          <Label htmlFor="omnilink_score_status_display">Status Omnilink Score</Label>
          <Input
            id="omnilink_score_status_display" // Changed ID to avoid conflict with formData.omnilink_score_status
            value={detailedOmnilinkStatus?.message || ''} // Display detailed message
            readOnly
            className="bg-muted/50"
          />
        </div>
      </div>

      {/* NEW FIELD: Status de Indicação */}
      <div className="space-y-2">
        <Label htmlFor="status_indicacao">Status de Indicação</Label>
        <Select
          value={formData.status_indicacao || ''}
          onValueChange={(value: 'indicado' | 'retificado' | 'nao_indicado') => handleSelectChange('status_indicacao', value)}
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

      {/* NEW CONDITIONAL FIELD: Motivo de Não Indicação */}
      {formData.status_indicacao === 'nao_indicado' && (
        <div className="space-y-2">
          <Label htmlFor="reason_nao_indicacao">Motivo de Não Indicação (Opcional)</Label>
          <Textarea
            id="reason_nao_indicacao"
            value={formData.reason_nao_indicacao || ''}
            onChange={handleInputChange}
            placeholder="Descreva o motivo pelo qual o motorista não foi indicado..."
            className="min-h-[80px]"
          />
        </div>
      )}
      
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

export default NewDriverForm;