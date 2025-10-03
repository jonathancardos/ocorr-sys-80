import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { incidentFormSchema } from '@/lib/validations/incident-form-schema';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { DateInput } from '@/components/ui/date-input';

interface IncidentIdentificationSectionProps {
  formData: any;
  onFormDataChange: (data: any) => void;
  isEditing?: boolean;
  isLoadingIncidentNumber?: boolean; // New prop
}

export function IncidentIdentificationSection({
  formData,
  onFormDataChange,
  isEditing = false,
  isLoadingIncidentNumber = false, // Default to false
}: IncidentIdentificationSectionProps) {
  const now = new Date();

  useEffect(() => {
    if (!isEditing && !formData.incidentDate) {
      onFormDataChange({ incidentDate: format(now, 'yyyy-MM-dd') });
    }
    if (!isEditing && !formData.boDate) {
      onFormDataChange({ boDate: '' }); // Initialize BO date as empty
    }
  }, [isEditing, formData.incidentDate, formData.boDate, onFormDataChange, now]);

  const handleDateChange = (field: 'incidentDate' | 'boDate') => (value: string) => {
    onFormDataChange({ [field]: value });
  };

  const handleInputChange = (field: string, value: any) => {
    onFormDataChange({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Identificação da Ocorrência</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="incidentNumber" className="text-sm font-medium">
            Número da Ocorrência
          </Label>
          <Input
            id="incidentNumber"
            value={formData.incidentNumber}
            readOnly
            disabled={isLoadingIncidentNumber} // Disable when loading
            placeholder={isLoadingIncidentNumber ? "Gerando..." : ""} // Placeholder for loading state
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="incidentDate" className="text-sm font-medium">
            Data da Ocorrência
          </Label>
          <DateInput
            id="incidentDate"
            value={formData.incidentDate || ''}
            onChange={handleDateChange('incidentDate')}
            disabled={isEditing}
          />
          {/* No form.formState.errors here, as we are not using useFormContext directly */}
        </div>

        <div>
          <Label htmlFor="incidentTime" className="text-sm font-medium">
            Horário da Ocorrência
          </Label>
          <Input
            id="incidentTime"
            type="time"
            value={formData.incidentTime}
            onChange={(e) => handleInputChange('incidentTime', e.target.value)}
            disabled={isEditing}
          />
        </div>

        <div>
          <Label htmlFor="locationType" className="text-sm font-medium">Tipo de Local</Label>
          <Select onValueChange={(value) => handleInputChange('locationType', value)} value={formData.locationType} disabled={isEditing}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo de local" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="urbana">Urbana</SelectItem>
              <SelectItem value="rural">Rural</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="location" className="text-sm font-medium">Local da Ocorrência</Label>
        <Textarea
          id="location"
          value={formData.location}
          onChange={(e) => handleInputChange('location', e.target.value)}
          rows={3}
          disabled={isEditing}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="boNumber" className="text-sm font-medium">Número do B.O.</Label>
          <Input
            id="boNumber"
            value={formData.boNumber}
            onChange={(e) => handleInputChange('boNumber', e.target.value)}
            disabled={isEditing}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="boDate" className="text-sm font-medium">
            Data do B.O.
          </Label>
          <DateInput
            id="boDate"
            value={formData.boDate || ''}
            onChange={handleDateChange('boDate')}
            disabled={isEditing}
          />
          {/* No form.formState.errors here, as we are not using useFormContext directly */}
        </div>
      </div>

      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label className="text-base">Registrado no mesmo dia?</Label>
        </div>
        <Switch
          checked={formData.sameDay}
          onCheckedChange={(checked) => handleInputChange('sameDay', checked)}
          disabled={isEditing}
          aria-readonly
        />
      </div>

      <div>
        <Label htmlFor="responsible" className="text-sm font-medium">Responsável pelo Registro</Label>
        <Input
          id="responsible"
          value={formData.responsible}
          onChange={(e) => handleInputChange('responsible', e.target.value)}
          disabled={isEditing}
        />
      </div>

      <div>
        <Label htmlFor="roadWitnesses" className="text-sm font-medium">Testemunhas (se houver)</Label>
        <Textarea
          id="roadWitnesses"
          value={formData.roadWitnesses}
          onChange={(e) => handleInputChange('roadWitnesses', e.target.value)}
          rows={2}
          disabled={isEditing}
        />
      </div>
    </div>
  );
}