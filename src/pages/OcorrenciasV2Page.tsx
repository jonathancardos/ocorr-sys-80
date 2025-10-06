import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';

const SINISTRO_CONFIG = {
  danos_materiais: {
    nome: "Danos Materiais",
    icone: "🔨",
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
    icone: "🚨",
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
    icone: "🩹",
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
    icone: "🎨",
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
          const fieldId = `${typeKey}-${question.id}`;
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

  const handleSelectionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    setSelectedTypes(prevSelectedTypes => {
      const newSelectedTypes = checked ? [...prevSelectedTypes, value] : prevSelectedTypes.filter(type => type !== value);
      // Initialize or clear form data for the selected/deselected type
      if (checked) {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    const [incidentType, fieldName] = name.split('-');

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
      onChange: handleInputChange,
      required: question.required,
      className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm",
    };

    let inputElement;

    switch (question.type) {
      case "text":
      case "number":
      case "datetime-local":
        inputElement = <input type={question.type} placeholder={question.placeholder} {...commonProps} />;
        break;
      case "textarea":
        inputElement = <textarea rows={3} placeholder={question.placeholder} {...commonProps}></textarea>;
        break;
      case "select":
        inputElement = (
          <select {...commonProps}>
            {question.options.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
        break;
      default:
        inputElement = <input type="text" {...commonProps} />;
    }

    const isVisible = !question.dependeDe || (formData[incidentType]?.[question.dependeDe.id] === question.dependeDe.valor);

    return isVisible ? (
      <div key={fieldId} className={question.colSpan ? "md:col-span-2" : ""}>
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
          {question.label} {question.required && <span className="text-red-500">*</span>}
        </label>
        {inputElement}
      </div>
    ) : null;
  };

  useEffect(() => {
    checkFormValidity();
  }, [selectedTypes, formData]);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">

      {/* Header */}
      <header className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
          Relatório de Ocorrências <span className="text-primary">V4</span>
        </h1>
        <p className="mt-2 text-lg text-gray-500">
          Preencha os dados de registro, envolvidos e selecione o(s) tipo(s) de sinistro.
        </p>
        {message.text && (
          <div className={`mt-4 p-3 rounded-lg ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`} role="alert">
            {message.text}
          </div>
        )}
      </header>

      {/* Container Principal do Formulário */}
      <div className="bg-white shadow-xl rounded-2xl p-6 sm:p-8 lg:p-10">

        {/* Passo 2: Seleção de Sinistros (Filtro) */}
        <section id="selection-section" className="mb-8 p-4 border border-gray-200 rounded-xl bg-secondary">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            1. Tipos de Sinistro Ocorridos
          </h2>
          <div id="incident-selection-container" className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(SINISTRO_CONFIG).map(([key, config]) => (
              <label htmlFor={`sinistro-${key}`} key={key} className="flex items-center p-4 bg-white rounded-xl shadow-md cursor-pointer hover:ring-2 hover:ring-primary transition duration-150">
                <input
                  type="checkbox"
                  id={`sinistro-${key}`}
                  name="sinistro-type"
                  value={key}
                  className="h-5 w-5 text-primary focus:ring-primary rounded-md"
                  onChange={handleSelectionChange}
                  checked={selectedTypes.includes(key)}
                />
                <div className="ml-3">
                  <span className="text-xl mr-2">{config.icone}</span>
                  <span className="text-base font-medium text-gray-900">{config.nome}</span>
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* Passo 1: Formulário Dinâmico de Perguntas */}
        <section id="form-section" className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            2. Detalhamento da Ocorrência
          </h2>
          <form id="dynamic-report-form" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {selectedTypes.map(typeKey => (
              <React.Fragment key={typeKey}>
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{SINISTRO_CONFIG[typeKey as keyof typeof SINISTRO_CONFIG].nome}</h3>
                </div>
                {SINISTRO_CONFIG[typeKey as keyof typeof SINISTRO_CONFIG].perguntas.map((question: any) =>
                  createField(question, typeKey)
                )}
              </React.Fragment>
            ))}
          </form>
        </section>

        {/* Passo 3: Upload de Anexos */}
        <section id="attachments-section" className="mb-10 p-4 border border-gray-200 rounded-xl bg-secondary">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            3. Anexos (Fotos, Documentos)
          </h2>
          <p className="text-sm text-gray-500 mb-3">
            Por favor, inclua fotos da ocorrência, **cópia da CNH do motorista** e o B.O. (se registrado).
          </p>
          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 transition duration-150">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <p className="mt-2 text-sm font-medium text-gray-600">Clique para selecionar os arquivos</p>
            <p className="text-xs text-gray-500">Fotos, CNH, B.O. e outros documentos (Múltiplos arquivos permitidos)</p>
          </label>
          <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileSelect} />
          <div id="file-list" className="mt-4 space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 border border-gray-200 rounded-md bg-white shadow-sm">
                <span className="text-sm text-gray-700">{file.name}</span>
                <button type="button" onClick={() => removeFile(file.name)} className="text-red-500 hover:text-red-700 focus:outline-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Passo 4: Geração do Relatório */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <button onClick={submitToSupabase} id="submit-to-supabase-btn" disabled={!isFormValid} className="px-8 py-3 bg-gray-400 text-white font-bold rounded-xl shadow-lg transition duration-300 ease-in-out hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed">
              Gerar Relatório em PDF
            </button>
          <p className="mt-2 text-sm text-gray-500">Preencha o formulário para habilitar o botão.</p>
        </div>

      </div>
    </div>
  );
};

export default OcorrenciasV2Page;