"use client";

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { TablesInsert } from '@/integrations/supabase/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { calculateOmnilinkScoreStatus, calculateOmnilinkScoreExpiry, OmnilinkDetailedStatus, getDetailedOmnilinkStatus, formatDate } from '@/lib/driver-utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import InputMask from 'react-input-mask';

interface NewDriverFormProps {
  onDriverCreated: (driverId: string) => void;
  onClose: () => void;
  initialFormData?: {
    cnh?: string;
    cnh_expiry?: string;
    full_name?: string;
  };
}

const formSchema = z.object({
  full_name: z.string().min(1, { message: "Nome completo é obrigatório." }),
  cpf: z.string().min(14, { message: "CPF é obrigatório e deve ter 14 dígitos (incluindo máscara)." }).max(14, { message: "CPF inválido." }),
  cnh: z.string().nullable().optional(),
  cnh_expiry: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  omnilink_score_registration_date: z.string().nullable().optional(),
  omnilink_score_expiry_date: z.string().nullable().optional(),
  omnilink_score_status: z.string().nullable().optional(),
  status_indicacao: z.enum(['indicado', 'retificado', 'nao_indicado'], { message: "Status de indicação é obrigatório." }),
  reason_nao_indicacao: z.string().nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.status_indicacao === 'nao_indicado' && !data.reason_nao_indicacao) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Motivo de não indicação é obrigatório quando o status é 'Não Indicado'.",
      path: ['reason_nao_indicacao'],
    });
  }
});

type DriverFormValues = z.infer<typeof formSchema>;

const NewDriverForm: React.FC<NewDriverFormProps> = ({ onDriverCreated, onClose, initialFormData }) => {
  const queryClient = useQueryClient();

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: initialFormData?.full_name || '',
      cpf: '',
      cnh: initialFormData?.cnh || null,
      cnh_expiry: initialFormData?.cnh_expiry || null,
      phone: null,
      type: null,
      omnilink_score_registration_date: null,
      omnilink_score_expiry_date: null,
      omnilink_score_status: null,
      status_indicacao: 'nao_indicado',
      reason_nao_indicacao: null,
    },
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = form;

  const omnilinkRegDate = watch('omnilink_score_registration_date');
  const statusIndicacao = watch('status_indicacao');

  const detailedOmnilinkStatus = omnilinkRegDate ? getDetailedOmnilinkStatus(omnilinkRegDate) : null;

  useEffect(() => {
    if (omnilinkRegDate) {
      const expiryDate = calculateOmnilinkScoreExpiry(omnilinkRegDate);
      const statusForDb = calculateOmnilinkScoreStatus(omnilinkRegDate);
      setValue('omnilink_score_expiry_date', expiryDate);
      setValue('omnilink_score_status', statusForDb);
    } else {
      setValue('omnilink_score_expiry_date', null);
      setValue('omnilink_score_status', null);
    }
  }, [omnilinkRegDate, setValue]);

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
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success("Motorista cadastrado!", {
        description: `${form.getValues('full_name')} foi adicionado com sucesso.`,
      });
      if (data) {
        onDriverCreated(data.id);
      }
      onClose();
    },
    onError: (err: any) => {
      console.error('Error creating driver:', err);
      toast.error("Erro ao cadastrar motorista", {
        description: err.message || "Não foi possível cadastrar o motorista.",
      });
    },
  });

  const onSubmit = async (data: DriverFormValues) => {
    await createDriverMutation.mutateAsync(data as TablesInsert<'drivers'>);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl mx-auto p-2">
      <div className="space-y-2">
        <Label htmlFor="full_name">Nome Completo *</Label>
        <Input
          id="full_name"
          {...register('full_name')}
          required
        />
        {errors.full_name && <p className="text-red-500 text-sm">{errors.full_name.message}</p>}
      </div>
      
      {/* <div className="space-y-2">
        <Label htmlFor="cpf">CPF *</Label>
        <InputMask
          mask="999.999.999-99"
          value={watch('cpf')}
          onChange={(e) => setValue('cpf', e.target.value, { shouldValidate: true })}
        >
          {(inputProps: any) => (
            <Input
              id="cpf"
              {...inputProps}
              {...register('cpf')}
              required
            />
          )}
        </InputMask>
        {errors.cpf && <p className="text-red-500 text-sm">{errors.cpf.message}</p>}
      </div> */}

      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <Select
          onValueChange={(value) => setValue('type', value, { shouldValidate: true })}
          value={watch('type') || ''}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="motorista">Motorista</SelectItem>
            <SelectItem value="agregado">Agregado</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && <p className="text-red-500 text-sm">{errors.type.message}</p>}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cnh">CNH</Label>
          <Input
            id="cnh"
            {...register('cnh')}
          />
          {errors.cnh && <p className="text-red-500 text-sm">{errors.cnh.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="cnh_expiry">Validade CNH</Label>
          <Input
            id="cnh_expiry"
            type="date"
            {...register('cnh_expiry')}
          />
          {errors.cnh_expiry && <p className="text-red-500 text-sm">{errors.cnh_expiry.message}</p>}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          {...register('phone')}
        />
        {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="omnilink_score_registration_date">Data de Cadastro Omnilink Score</Label>
        <Input
          id="omnilink_score_registration_date"
          type="date"
          {...register('omnilink_score_registration_date')}
        />
        {errors.omnilink_score_registration_date && <p className="text-red-500 text-sm">{errors.omnilink_score_registration_date.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="omnilink_score_expiry_date">Vencimento Omnilink Score</Label>
          <Input
            id="omnilink_score_expiry_date"
            type="date"
            value={detailedOmnilinkStatus?.expiryDate ? formatDate(detailedOmnilinkStatus.expiryDate) : ''}
            readOnly
            className="bg-muted/50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="omnilink_score_status_display">Status Omnilink Score</Label>
          <Input
            id="omnilink_score_status_display"
            value={detailedOmnilinkStatus?.message || ''}
            readOnly
            className="bg-muted/50"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status_indicacao">Status de Indicação</Label>
        <Select
          onValueChange={(value: 'indicado' | 'retificado' | 'nao_indicado') => setValue('status_indicacao', value, { shouldValidate: true })}
          value={statusIndicacao || ''}
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
        {errors.status_indicacao && <p className="text-red-500 text-sm">{errors.status_indicacao.message}</p>}
      </div>

      {statusIndicacao === 'nao_indicado' && (
        <div className="space-y-2">
          <Label htmlFor="reason_nao_indicacao">Motivo de Não Indicação (Opcional)</Label>
          <Textarea
            id="reason_nao_indicacao"
            {...register('reason_nao_indicacao')}
            placeholder="Descreva o motivo pelo qual o motorista não foi indicado..."
            className="min-h-[80px]"
          />
          {errors.reason_nao_indicacao && <p className="text-red-500 text-sm">{errors.reason_nao_indicacao.message}</p>}
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