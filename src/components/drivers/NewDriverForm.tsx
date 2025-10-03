"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, User, FileText, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { TablesInsert } from '@/integrations/supabase/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { calculateOmnilinkScoreStatus, calculateOmnilinkScoreExpiry, OmnilinkDetailedStatus, getDetailedOmnilinkStatus, formatDate } from '@/lib/driver-utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import InputMask from 'react-input-mask';
import { format, parseISO, isValid } from 'date-fns'; // Importar format, parse e isValid aqui
import { ptBR } from 'date-fns/locale'; // Importar ptBR aqui
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { DateInput } from '@/components/ui/date-input';

interface NewDriverFormProps {
  onDriverCreated: (driverId: string) => void;
  onClose: () => void;
  initialFormData?: {
    id?: string;
    full_name?: string;
    cpf?: string;
    cnh?: string;
    cnh_expiry?: string;
    phone?: string;
    type?: string;
    omnilink_score_registration_date?: string;
    omnilink_score_expiry_date?: string;
    omnilink_score_status?: string;
    status_indicacao?: string;
    reason_nao_indicacao?: string;
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
  status_indicacao: z.string().nullable().optional(),
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

export const NewDriverForm: React.FC<NewDriverFormProps> = ({ onDriverCreated, onClose, initialFormData }) => {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: initialFormData?.full_name || '',
      cpf: initialFormData?.cpf || '',
      cnh: initialFormData?.cnh || null,
      cnh_expiry: initialFormData?.cnh_expiry || null,
      phone: initialFormData?.phone || null,
      type: initialFormData?.type || null,
      omnilink_score_registration_date: initialFormData?.omnilink_score_registration_date || null,
      omnilink_score_expiry_date: initialFormData?.omnilink_score_expiry_date || null,
      omnilink_score_status: initialFormData?.omnilink_score_status || null,
      status_indicacao: initialFormData?.status_indicacao || 'nao_indicado',
      reason_nao_indicacao: initialFormData?.reason_nao_indicacao || null,
    },
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = form;

  const omnilinkRegDate = watch('omnilink_score_registration_date');
  const cnhExpiryDate = watch('cnh_expiry');
  const statusIndicacao = watch('status_indicacao');

  const [displayCnhExpiry, setDisplayCnhExpiry] = useState('');
  const [displayOmnilinkRegDate, setDisplayOmnilinkRegDate] = useState('');

  useEffect(() => {
    if (cnhExpiryDate && isValid(parseISO(cnhExpiryDate))) {
      setDisplayCnhExpiry(format(parseISO(cnhExpiryDate), 'dd/MM/yyyy'));
    } else {
      setDisplayCnhExpiry('');
    }
  }, [cnhExpiryDate]);

  useEffect(() => {
    if (omnilinkRegDate && isValid(parseISO(omnilinkRegDate))) {
      setDisplayOmnilinkRegDate(format(parseISO(omnilinkRegDate), 'dd/MM/yyyy'));
    } else {
      setDisplayOmnilinkRegDate('');
    }
  }, [omnilinkRegDate]);

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
      // Se temos um ID, é uma edição
      if (initialFormData?.id) {
        const { data, error } = await supabase
          .from('drivers')
          .update(driverData)
          .eq('id', initialFormData.id)
          .select('id')
          .single();
        if (error) throw error;
        return data;
      } else {
        // Caso contrário, é uma inserção
        const { data, error } = await supabase
          .from('drivers')
          .insert(driverData)
          .select('id')
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      const isEditing = !!initialFormData?.id;
      toast.success(isEditing ? "Motorista atualizado!" : "Motorista cadastrado!", {
        description: isEditing 
          ? `${form.getValues('full_name')} foi atualizado com sucesso.`
          : `${form.getValues('full_name')} foi adicionado com sucesso.`,
      });
      if (data) {
        onDriverCreated(data.id);
      }
      onClose();
    },
    onError: (err: any) => {
      console.error('Error creating/updating driver:', err);
      toast.error("Erro ao salvar motorista", {
        description: err.message || "Não foi possível salvar os dados do motorista.",
      });
    },
  });

  const onSubmit = async (data: DriverFormValues) => {
    if (Object.keys(form.formState.errors).length > 0) {
      const missingFields = Object.keys(form.formState.errors)
        .map(field => {
          const fieldName = field.replace(/_/g, ' '); // Replace underscores with spaces for better readability
          return `Falta preenchimento da coluna: ${fieldName}`;
        })
        .join('\n');
      toast.error("Campos obrigatórios não preenchidos", {
        description: missingFields,
      });
      return;
    }
    await createDriverMutation.mutateAsync(data as TablesInsert<'drivers'>);
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const steps = [
    { number: 1, title: 'Dados Pessoais', icon: User },
    { number: 2, title: 'Documentação', icon: FileText },
    { number: 3, title: 'Indicação', icon: CheckCircle },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[600px]">
      {/* Stepper Horizontal */}
      <div className="flex items-center justify-between mb-6 px-4 py-3 bg-muted/30 rounded-lg">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="flex items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                  currentStep >= step.number
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-background border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {currentStep > step.number ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              <div className="ml-3 hidden sm:block">
                <p className={cn(
                  "text-sm font-medium",
                  currentStep >= step.number ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.title}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2 sm:mx-4 transition-all",
                  currentStep > step.number ? "bg-primary" : "bg-muted-foreground/30"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Form Content com Scroll */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-1">
        <div className="space-y-4 pb-4">
          {/* Etapa 1: Dados Pessoais */}
          {currentStep === 1 && (
            <Accordion type="single" collapsible defaultValue="info-basica" className="space-y-2">
              <AccordionItem value="info-basica" className="border rounded-lg px-4">
                <AccordionTrigger className="text-base font-semibold hover:no-underline">
                  Informações Básicas
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome Completo *</Label>
                    <Input id="full_name" {...register('full_name')} required className="h-11" />
                    {errors.full_name && <p className="text-destructive text-sm">{errors.full_name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      value={watch('cpf')}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                        let formattedValue = '';
                        if (value.length > 0) {
                          formattedValue = value.substring(0, 3);
                          if (value.length > 3) {
                            formattedValue += '.' + value.substring(3, 6);
                          }
                          if (value.length > 6) {
                            formattedValue += '.' + value.substring(6, 9);
                          }
                          if (value.length > 9) {
                            formattedValue += '-' + value.substring(9, 11);
                          }
                        }
                        setValue('cpf', formattedValue, { shouldValidate: true });
                      }}
                      placeholder="000.000.000-00"
                      className="h-11"
                      required
                      maxLength={14} // Max length for CPF with mask
                    />
                    {errors.cpf && <p className="text-destructive text-sm">{errors.cpf.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select
                      onValueChange={(value) => setValue('type', value, { shouldValidate: true })}
                      value={watch('type') || ''}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="motorista">Motorista</SelectItem>
                        <SelectItem value="agregado">Agregado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" {...register('phone')} className="h-11" />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {/* Etapa 2: Documentação */}
          {currentStep === 2 && (
            <Accordion type="single" collapsible defaultValue="cnh-info" className="space-y-2">
              <AccordionItem value="cnh-info" className="border rounded-lg px-4">
                <AccordionTrigger className="text-base font-semibold hover:no-underline">
                  Informações da CNH
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cnh">CNH</Label>
                      <Input id="cnh" {...register('cnh')} className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnh_expiry">Validade CNH</Label>
                      <DateInput
                        id="cnh_expiry"
                        value={cnhExpiryDate || ''}
                        onChange={(value) => setValue('cnh_expiry', value)}
                        className="h-11"
                      />
                      {form.formState.errors.cnh_expiry && <p className="text-destructive text-sm">{form.formState.errors.cnh_expiry.message}</p>}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="omnilink-info" className="border rounded-lg px-4">
                <AccordionTrigger className="text-base font-semibold hover:no-underline">
                  Omnilink Score
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="omnilink_score_registration_date">Data de Cadastro</Label>
                    <DateInput
                      id="omnilink_score_registration_date"
                      value={omnilinkRegDate || ''}
                      onChange={(value) => setValue('omnilink_score_registration_date', value)}
                      className="h-11"
                    />
                    {form.formState.errors.omnilink_score_registration_date && <p className="text-destructive text-sm">{form.formState.errors.omnilink_score_registration_date.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="omnilink_score_expiry_date">Vencimento</Label>
                      <Input
                        id="omnilink_score_expiry_date"
                        type="text"
                        value={detailedOmnilinkStatus?.expiryDate ? formatDate(detailedOmnilinkStatus.expiryDate) : ''}
                        readOnly
                        className="bg-muted/50 h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="omnilink_score_status_display">Status</Label>
                      <Input
                        id="omnilink_score_status_display"
                        value={detailedOmnilinkStatus?.message || ''}
                        readOnly
                        className="bg-muted/50 h-11"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {/* Etapa 3: Indicação */}
          {currentStep === 3 && (
            <Accordion type="single" collapsible defaultValue="indicacao-info" className="space-y-2">
              <AccordionItem value="indicacao-info" className="border rounded-lg px-4">
                <AccordionTrigger className="text-base font-semibold hover:no-underline">
                  Status de Indicação
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="status_indicacao">Status *</Label>
                    <Select
                      onValueChange={(value: 'indicado' | 'retificado' | 'nao_indicado') => setValue('status_indicacao', value, { shouldValidate: true })}
                      value={statusIndicacao || ''}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="indicado">Indicado</SelectItem>
                        <SelectItem value="retificado">Retificado</SelectItem>
                        <SelectItem value="nao_indicado">Não Indicado</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.status_indicacao && <p className="text-destructive text-sm">{errors.status_indicacao.message}</p>}
                  </div>

                  {statusIndicacao === 'nao_indicado' && (
                    <div className="space-y-2">
                      <Label htmlFor="reason_nao_indicacao">Motivo (Opcional)</Label>
                      <Textarea
                        id="reason_nao_indicacao"
                        {...register('reason_nao_indicacao')}
                        placeholder="Descreva o motivo..."
                        className="min-h-[100px]"
                      />
                      {errors.reason_nao_indicacao && <p className="text-destructive text-sm">{errors.reason_nao_indicacao.message}</p>}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      </form>

      {/* Navigation Footer Fixo */}
      <DialogFooter className="flex-row justify-between items-center pt-4 border-t mt-4 px-1">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          
          {currentStep < totalSteps ? (
            <Button type="button" onClick={nextStep} className="gap-2">
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                'Cadastrar'
              )}
            </Button>
          )}
        </div>
      </DialogFooter>
    </div>
  );
};

export default NewDriverForm;