"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FileText, Edit, Hammer, AlertTriangle, Heart, Palette, Upload, X, Paperclip, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const SINISTRO_CONFIG = {
  danos_materiais: {
    nome: "Danos Materiais",
    // icon: Hammer, // REMOVIDO
    perguntas: [
      { id: "local_danos", label: "Local Exato do Dano", type: "text", required: true, placeholder: "Ex: Corredor B, Sala 101" },
      { id: "descricao_danos", label: "Descrição Detalhada dos Danos", type: "textarea", required: true, placeholder: "Detalhe o que foi danificado, a causa e a extensão.", colSpan: true },
      { id: "depredacao_veiculo", label: "Houve depredação de veículo?", type: "select", options: ["Não", "Sim"], required: true, dynamicParent: true },
      { id: "qual_veiculo_depredado", label: "Se sim, qual veículo? (Marca/Modelo/Placa)", type: "text", required: true, placeholder: "Ex: VW Gol, Placa ABC-1234", dependeDe: { id: "depredacao_veiculo", valor: "Sim" } },
      { id: "perda_carga", label: "Houve perda ou dano à carga/itens?", type: "select", options: ["Não", "Sim"], required: true, dynamicParent: true },
      { id: "quant_itens_furtados", label: "Quantos itens foram furtados/danificados?", type: "number", required: true, placeholder: "0", dependeDe: { id: "perda_carga", valor: "Sim" } },
      { id: "valor_itens_total", label: "Valor Total Estimado dos Itens (R$)", type: "number", required: true, placeholder: "0.00", dependeDe: { id: "perda_carga", valor: "Sim" } },
      { id: "sinistro_total", label: "A ocorrência é considerada Sinistro Total?", type: "select", options: ["Não", "Sim"], required: true },
      { id: "valor_estimado", label: "Valor Estimado do Prejuízo (R$)", type: "number", required: false, placeholder: "0.00" }
    ]
  },
  roubo: {
    nome: "Roubo / Furto",
    // icon: AlertTriangle, // REMOVIDO
    perguntas: [
      { id: "data_hora_roubo", label: "Data e Hora do Sinistro", type: "datetime-local", required: true },
      { id: "itens_roubados", label: "Itens Roubados / Furtados (Breve Descrição)", type: "textarea", required: true, placeholder: "Descreva brevemente os itens e a situação.", colSpan: true },
      { id: "testemunhas_roubo", label: "Havia Testemunhas?", type: "select", options: ["Não", "Sim - Informar Nomes"], required: true },
      { id: "perda_carga", label: "Houve perda ou dano à carga/itens?", type: "select", options: ["Não", "Sim"], required: true, dynamicParent: true },
      { id: "quant_itens_furtados", label: "Quantos itens foram furtados/danificados?", type: "number", required: true, placeholder: "0", dependeDe: { id: "perda_carga", valor: "Sim" } },
      { id: "valor_itens_total", label: "Valor Total Estimado dos Itens (R$)", type: "number", required: true, placeholder: "0.00", dependeDe: { id: "perda_carga", valor: "Sim" } },
      { id: "sinistro_total", label: "A ocorrência é considerada Sinistro Total? (Perda Total)", type: "select", options: ["Não", "Sim"], required: true }
    ]
  },
  acidente_pessoal: {
    nome: "Acidente Pessoal",
    // icon: Heart, // REMOVIDO
    perguntas: [
      { id: "nome_pessoa", label: "Nome Completo da Pessoa Envolvida", type: "text", required: true },
      { id: "natureza_lesao", label: "Natureza e Local da Lesão", type: "text", required: true, placeholder: "Ex: Corte no braço, Entorse no tornozelo" },
      { id: "atendimento_medico", label: "Houve Atendimento Médico?", type: "select", options: ["Não", "Sim - Local/Profissional"], required: true },
      { id: "perda_carga", label: "Houve perda ou dano à carga/itens?", type: "select", options: ["Não", "Sim"], required: true, dynamicParent: true },
      { id: "quant_itens_furtados", label: "Quantos itens foram furtados/danificados?", type: "number", required: true, placeholder: "0", dependeDe: { id: "perda_carga", valor: "Sim" } },
      { id: "valor_itens_total", label: "Valor Total Estimado dos Itens (R$)", type: "number", required: true, placeholder: "0.00", dependeDe: { id: "perda_carga", valor: "Sim" } },
      { id: "sinistro_total", label: "A ocorrência é considerada Sinistro Total?", type: "select", options: ["Não", "Sim"], required: true }
    ]
  },
  vandalismo: {
    nome: "Vandalismo",
    // icon: Palette, // REMOVIDO
    perguntas: [
      { id: "tipo_vandalismo", label: "Tipo de Ação de Vandalismo", type: "text", required: true, placeholder: "Ex: Grafite, Quebra de vidros" },
      { id: "acao_tomada", label: "Ações Tomadas Imediatamente", type: "textarea", required: false, placeholder: "Ex: Acionamento de segurança, limpeza parcial", colSpan: true },
      { id: "perda_carga", label: "Houve perda ou dano à carga/itens?", type: "select", options: ["Não", "Sim"], required: true, dynamicParent: true },
      { id: "quant_itens_furtados", label: "Quantos itens foram furtados/danificados? (Se aplicável)", type: "number", required: true, placeholder: "0", dependeDe: { id: "perda_carga", valor: "Sim" } },
      { id: "valor_itens_total", label: "Valor Total Estimado dos Itens (R$)", type: "number", required: true, placeholder: "0.00", dependeDe: { id: "perda_carga", valor: "Sim" } },
      { id: "sinistro_total", label: "A ocorrência é considerada Sinistro Total?", type: "select", options: ["Não", "Sim"], required: true }
    ]
  }
};

const OcorrenciasV2Page: React.FC = () => {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' | '' }>({ text: '', type: '' });
  const [isFormValid, setIsFormValid] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showMessage = (text: string, type: 'error' | 'success') => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 5000);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      setSelectedFiles(prevFiles => [...prevFiles, ...filesArray]);
    }
  };

  const removeFile = (fileName: string) => {
    setSelectedFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
  };

  const submitToSupabase = async () => {
    setIsSubmitting(true);
    try {
      // 1. Upload files to Supabase Storage
      const filePaths: string[] = [];
      for (const file of selectedFiles) {
        const { data, error } = await supabase.storage
          .from('ocorrencias-anexos') // Replace with your bucket name
          .upload(`${Date.now()}-${file.name}`, file);

        if (error) {
          throw error;
        }
        filePaths.push(data.path);
      }

      // 2. Prepare form data for insertion
      const dataToInsert = {
        selected_types: selectedTypes, // Array of selected incident types
        form_data: formData, // JSON object of dynamic form data
        attached_files: filePaths, // Array of uploaded file paths
        created_at: new Date().toISOString(),
        // Add any other static fields you might have, e.g., user_id
      };

      // 3. Insert data into Supabase table
      const { error: insertError } = await supabase
        .from('ocorrencias') // Replace with your table name
        .insert([dataToInsert]);

      if (insertError) {
        throw insertError;
      }

      showMessage('Relatório enviado com sucesso!', 'success');
      // Optionally, clear form and selected files after successful submission
      setSelectedTypes([]);
      setFormData({});
      setSelectedFiles([]);

    } catch (error: any) {
      console.error('Erro ao enviar relatório:', error.message);
      showMessage(`Erro ao enviar relatório: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkFormValidity = () => {
    let valid = true;
    if (selectedTypes.length === 0) {
      valid = false;
    } else {
      selectedTypes.forEach(typeKey => {
        const config = SINISTRO_CONFIG[typeKey as keyof typeof SINISTRO_CONFIG];
        config.perguntas.forEach((question: any) => {
          const isVisible = !question.dependeDe || (formData[typeKey]?.[question.dependeDe.id] === question.dependeDe.valor);

          if (question.required && isVisible) {
            if (!formData[typeKey] || !formData[typeKey][question.id] || String(formData[typeKey][question.id]).trim() === '') {
              valid = false;
            }
          }
        });
      });
    }
    setIsFormValid(valid);
  };

  const handleSelectionChange = (event: boolean, value: string) => {
    setSelectedTypes(prevSelectedTypes => {
      const newSelectedTypes = event ? [...prevSelectedTypes, value] : prevSelectedTypes.filter(type => type !== value);
      // Initialize or clear form data for the selected/deselected type
      if (event) {
        setFormData(prevData => ({ ...prevData, [value]: {} }));
      } else {
        setFormData(prevData => {
          const newData = { ...prevData };
          delete newData[value];
          return newData;
        });
      }
      return newSelectedTypes;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, incidentType: string, fieldName: string) => {
    const { value, type, checked } = e.target;

    setFormData(prevData => ({
      ...prevData,
      [incidentType]: {
        ...prevData[incidentType],
        [fieldName]: type === 'checkbox' ? checked : value,
      },
    }));
  };

  const createField = (question: any, incidentType: string) => {
    const fieldId = `${incidentType}-${question.id}`;
    const commonProps = {
      id: fieldId,
      name: fieldId,
      value: formData[incidentType]?.[question.id] || '',
      onChange: (e: any) => handleInputChange(e, incidentType, question.id),
      required: question.required,
      className: "h-11",
    };

    let inputElement;

    switch (question.type) {
      case "text":
      case "number":
      case "datetime-local":
        inputElement = <Input type={question.type} placeholder={question.placeholder} {...commonProps} />;
        break;
      case "textarea":
        inputElement = <Textarea rows={3} placeholder={question.placeholder} {...commonProps}></Textarea>;
        break;
      case "select":
        inputElement = (
          <Select onValueChange={(value) => handleInputChange({ target: { value, type: 'select', name: fieldId } } as React.ChangeEvent<HTMLSelectElement>, incidentType, question.id)} value={formData[incidentType]?.[question.id] || ''}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder={question.placeholder || "Selecione uma opção"} />
            </SelectTrigger>
            <SelectContent>
              {question.options.map((option: string) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        break;
      default:
        inputElement = <Input type="text" {...commonProps} />;
    }

    const isVisible = !question.dependeDe || (formData[incidentType]?.[question.dependeDe.id] === question.dependeDe.valor);

    return isVisible ? (
      <div key={fieldId} className={cn("space-y-2", question.colSpan && "md:col-span-2")}>
        <Label htmlFor={fieldId} className="block text-sm font-medium text-foreground">
          {question.label} {question.required && <span className="text-destructive">*</span>}
        </Label>
        {inputElement}
      </div>
    ) : null;
  };

  useEffect(() => {
    checkFormValidity();
  }, [selectedTypes, formData]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">

      {/* Header */}
      <header className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
          Relatório de Ocorrências <span className="text-primary">V4</span>
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Preencha os dados de registro, envolvidos e selecione o(s) tipo(s) de sinistro.
        </p>
        {message.text && (
          <Badge variant={message.type === 'error' ? 'destructive' : 'success'} className="mt-4 p-3 text-base">
            {message.text}
          </Badge>
        )}
      </header>

      {/* Container Principal do Formulário */}
      <div className="modern-card p-6 sm:p-8 lg:p-10">

        {/* Passo 1: Seleção de Sinistros (Filtro) */}
        <Card className="mb-8 modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Edit className="w-5 h-5" />
              1. Tipos de Sinistro Ocorridos
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Selecione um ou mais tipos de sinistro que ocorreram.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div id="incident-selection-container" className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(SINISTRO_CONFIG).map(([key, config]) => {
                // const Icon = config.icon; // REMOVIDO
                const isSelected = selectedTypes.includes(key);
                return (
                  <label htmlFor={`sinistro-${key}`} key={key} className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-xl shadow-md cursor-pointer transition-all duration-200",
                    "bg-card border border-border",
                    isSelected ? "ring-2 ring-primary border-primary" : "hover:ring-1 hover:ring-muted-foreground"
                  )}>
                    <Checkbox
                      id={`sinistro-${key}`}
                      name="sinistro-type"
                      value={key}
                      className="sr-only" // Hide native checkbox
                      onCheckedChange={(checked: boolean) => handleSelectionChange(checked, key)}
                      checked={isSelected}
                    />
                    <div className="flex flex-col items-center text-center">
                      {/* REMOVIDO:
                      <div className={cn(
                        "p-3 rounded-full mb-2 transition-all duration-200",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted/20 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                      )}>
                        <Icon className="w-6 h-6" />
                      </div>
                      */}
                      <span className="text-base font-medium text-foreground">{config.nome}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Passo 2: Formulário Dinâmico de Perguntas */}
        <Card className="mb-8 modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <FileText className="w-5 h-5" />
              2. Detalhamento da Ocorrência
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Preencha os detalhes específicos para cada tipo de sinistro selecionado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form id="dynamic-report-form" className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selectedTypes.length === 0 ? (
                <p className="md:col-span-2 text-center text-muted-foreground py-4">
                  Selecione um tipo de sinistro acima para começar a preencher.
                </p>
              ) : (
                selectedTypes.map(typeKey => (
                  <React.Fragment key={typeKey}>
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">{SINISTRO_CONFIG[typeKey as keyof typeof SINISTRO_CONFIG].nome}</h3>
                    </div>
                    {SINISTRO_CONFIG[typeKey as keyof typeof SINISTRO_CONFIG].perguntas.map((question: any) =>
                      createField(question, typeKey)
                    )}
                  </React.Fragment>
                ))
              )}
            </form>
          </CardContent>
        </Card>

        {/* Passo 3: Upload de Anexos */}
        <Card className="mb-10 modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Paperclip className="w-5 h-5" />
              3. Anexos (Fotos, Documentos)
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Por favor, inclua fotos da ocorrência, **cópia da CNH do motorista** e o B.O. (se registrado).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl hover:bg-muted/20 transition duration-150">
              <Upload className="w-10 h-10 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium text-foreground">Clique para selecionar os arquivos</p>
              <p className="text-xs text-muted-foreground">Fotos, CNH, B.O. e outros documentos (Múltiplos arquivos permitidos)</p>
            </label>
            <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileSelect} />
            <div id="file-list" className="mt-4 space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 border border-border rounded-md bg-muted/50">
                  <span className="text-sm text-foreground">{file.name}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(file.name)} className="text-destructive hover:bg-destructive/10">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Passo 4: Geração do Relatório */}
        <div className="mt-8 pt-6 border-t border-border text-center">
            <Button onClick={submitToSupabase} id="submit-to-supabase-btn" disabled={!isFormValid || isSubmitting} className="px-8 py-3 bg-gradient-corporate text-primary-foreground font-bold rounded-xl shadow-corporate transition duration-300 ease-in-out hover:shadow-elevated disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Gerar Relatório em PDF
                </>
              )}
            </Button>
          <p className="mt-2 text-sm text-muted-foreground">Preencha o formulário para habilitar o botão.</p>
        </div>

      </div>
    </div>
  );
};

export default OcorrenciasV2Page;