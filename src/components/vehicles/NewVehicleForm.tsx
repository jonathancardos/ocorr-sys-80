import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { errorService } from '@/services/errorService';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Loader2, PlusCircle, X, Info, Truck, Settings, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { Vehicle, VehicleInsert } from '@/types/vehicles';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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

export const NewVehicleForm: React.FC<NewVehicleFormProps> = ({ onVehicleCreated, onClose }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTechnologyInput, setNewTechnologyInput] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

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
      errorService.log('Error creating vehicle:', err);
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
      raw_blocker_installed_text: formData.raw_blocker_installed_text,
      raw_priority_text: formData.raw_priority_text,
    });
  };

  const allAvailableTechnologies = Array.from(new Set([...predefinedTechnologies, ...(existingTechnologies || [])])).sort();

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
      return 'other';
    }
    return 'unmapped';
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
    { number: 1, title: 'Dados Básicos', icon: Truck },
    { number: 2, title: 'Tecnologias', icon: Settings },
    { number: 3, title: 'Configurações', icon: CheckCircle },
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
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-1">
        <div className="space-y-4 pb-4">
          {/* Etapa 1: Dados Básicos */}
          {currentStep === 1 && (
            <Accordion type="single" collapsible defaultValue="dados-basicos" className="space-y-2">
              <AccordionItem value="dados-basicos" className="border rounded-lg px-4">
                <AccordionTrigger className="text-base font-semibold hover:no-underline">
                  Informações do Veículo
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="plate">Placa *</Label>
                      <Input
                        id="plate"
                        value={formData.plate}
                        onChange={handleInputChange}
                        required
                        placeholder="Ex: ABC-1234"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">Modelo *</Label>
                      <Input
                        id="model"
                        value={formData.model}
                        onChange={handleInputChange}
                        required
                        placeholder="Ex: Mercedes Sprinter"
                        className="h-11"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {/* Etapa 2: Tecnologias */}
          {currentStep === 2 && (
            <Accordion type="single" collapsible defaultValue="tecnologias" className="space-y-2">
              <AccordionItem value="tecnologias" className="border rounded-lg px-4">
                <AccordionTrigger className="text-base font-semibold hover:no-underline">
                  Tecnologias Instaladas
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
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
                    disabled={isLoadingExistingTechnologies}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Adicionar tecnologia existente" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingExistingTechnologies ? (
                        <SelectItem value="loading" disabled>Carregando...</SelectItem>
                      ) : (
                        allAvailableTechnologies.map(tech => (
                          <SelectItem key={tech} value={tech} disabled={(formData.technology || []).includes(tech)}>
                            {tech}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="newTechnology"
                      placeholder="Ou digite uma nova tecnologia"
                      value={newTechnologyInput}
                      onChange={(e) => setNewTechnologyInput(e.target.value)}
                      className="h-11 flex-1"
                    />
                    <Button 
                      type="button" 
                      onClick={handleAddNewTechnology} 
                      disabled={!newTechnologyInput.trim()}
                      className="h-11 w-full sm:w-auto"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {/* Etapa 3: Configurações */}
          {currentStep === 3 && (
            <Accordion type="multiple" defaultValue={["config-gerais", "config-bloqueador"]} className="space-y-2">
              <AccordionItem value="config-gerais" className="border rounded-lg px-4">
                <AccordionTrigger className="text-base font-semibold hover:no-underline">
                  Configurações Gerais
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
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
                    <Input
                      id="raw_priority_text"
                      placeholder="Texto original (opcional)"
                      value={formData.raw_priority_text || ''}
                      onChange={handleInputChange}
                      className="h-11 mt-2"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="has_workshop"
                      checked={formData.has_workshop || false}
                      onCheckedChange={(checked) => handleSwitchChange('has_workshop', checked)}
                    />
                    <Label htmlFor="has_workshop" className="flex items-center gap-1">
                      Tem Oficina?
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">Controle interno da Siga+</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="config-bloqueador" className="border rounded-lg px-4">
                <AccordionTrigger className="text-base font-semibold hover:no-underline">
                  Status do Bloqueador
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="blocker_installed_select" className="flex items-center gap-1">
                      Bloqueador Instalado?
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">Indica se o veículo possui bloqueador</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Select
                      value={getBlockerSelectValue()}
                      onValueChange={handleBlockerInstalledSelectChange}
                    >
                      <SelectTrigger id="blocker_installed_select" className="h-11">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unmapped">Não Classificado</SelectItem>
                        <SelectItem value="installed">Instalado</SelectItem>
                        <SelectItem value="not_installed">Não Instalado</SelectItem>
                        <SelectItem value="will_not_install">Não Vai Instalar</SelectItem>
                        <SelectItem value="other">Outra Informação</SelectItem>
                      </SelectContent>
                    </Select>
                    {getBlockerSelectValue() === 'other' && (
                      <Input
                        id="raw_blocker_installed_text"
                        placeholder="Descreva o status"
                        value={formData.raw_blocker_installed_text || ''}
                        onChange={handleInputChange}
                        className="h-11 mt-2"
                      />
                    )}
                  </div>
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
            <Button onClick={handleSubmit} disabled={isSubmitting}>
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

export default NewVehicleForm;