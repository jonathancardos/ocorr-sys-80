import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Eye, Save, FileText } from 'lucide-react';
import { IncidentReportPDFLayout } from './IncidentReportPDFLayout';
import { toast } from 'sonner'; // Importar toast do sonner
import { getCnhStatus } from './NewIncidentForm'; // Import getCnhStatus from NewIncidentForm
import { Input } from '@/components/ui/input'; // Adicionado: Importação do componente Input
import { createRoot } from 'react-dom/client'; // Correct import for createRoot

interface ReportCustomizationTabProps {
  formData: any;
  onGeneratePdf: (config: PdfConfig) => void;
}

export interface PdfConfig {
  sections: {
    [key: string]: {
      isVisible: boolean;
      fields: { [key: string]: boolean };
      customText?: string;
    };
  };
  globalHeader?: string;
  globalFooter?: string;
  templateName?: string;
}

const defaultPdfConfig: PdfConfig = {
  sections: {
    identification: {
      isVisible: true,
      fields: {
        incidentNumber: true, incidentDate: true, incidentTime: true, locationType: true,
        establishmentName: true, establishmentAddress: true, establishmentCircumstances: true,
        hasDock: true, hasParking: true, roadDetailedLocation: true, roadSuspicions: true,
        roadTrafficConditions: true, roadWitnesses: true,
        boNumber: true, boDate: true, sameDay: true, responsible: true,
      },
    },
    vehicle: {
      isVisible: true,
      fields: {
        vehiclePlate: true, vehicleModel: true, vehicleTechnology: true,
        driverName: true, driverCpf: true, driverPhone: true, driverLicense: true, licenseExpiry: true,
      },
    },
    omnilink: {
      isVisible: true,
      fields: { omnilinkStatus: true, omnilinkObservations: true, omnilinkAnalystVerdict: true },
    },
    tracking: {
      isVisible: true,
      fields: {
        signalLoss: true, signalLossTime: true, unauthorizedStop: true, unauthorizedStopLocation: true,
        prolongedStop: true, prolongedStopTime: true, prolongedStopJustification: true,
      },
    },
    evaluation: {
      isVisible: true,
      fields: {
        followedInstructions: true, reportedAnomalies: true, contradictions: true,
        keyToThird: true, doorsOpen: true, leftVehicleTime: true,
        vehicleLocked: true, driverNearVehicle: true, authorizedParking: true,
        vehicleRunning: true, stoppedInSafePlace: true, activatedPanicButton: true,
        driverScore: true, riskLevel: true,
      },
    },
    cargo: {
      isVisible: true,
      fields: { totalCargoValue: true, stolenCargoValue: true, cargoObservations: true },
    },
    risk: {
      isVisible: true,
      fields: { riskObservations: true },
    },
    final: {
      isVisible: true,
      fields: {
        omnilinkSummary: true, driverSummary: true, trackingSummary: true, cargoSummary: true,
        riskSummary: true, finalConclusion: true, recommendations: true, analystName: true,
      },
    },
    attachments: {
      isVisible: true,
      fields: { boFiles: true, sapScreenshots: true, riskReports: true, omnilinkPhoto: true },
      customText: "", // Garantir que esteja vazio por padrão
    },
  },
  globalHeader: "Laudo de Ocorrência - Karne & Keijo",
  globalFooter: "Gerado pelo Sistema de Gestão Karne & Keijo.",
  templateName: "Padrão Detalhado",
};

const minimalPdfConfig: PdfConfig = {
  sections: {
    identification: {
      isVisible: true,
      fields: {
        incidentNumber: true, incidentDate: true, incidentTime: true, locationType: true,
        boNumber: true, responsible: true,
      },
    },
    vehicle: {
      isVisible: true,
      fields: {
        vehiclePlate: true, driverName: true, licenseExpiry: true,
      },
    },
    omnilink: { isVisible: false, fields: {} },
    tracking: { isVisible: false, fields: {} },
    evaluation: {
      isVisible: true,
      fields: { driverScore: true, riskLevel: true },
    },
    cargo: {
      isVisible: true,
      fields: { stolenCargoValue: true },
    },
    risk: { isVisible: false, fields: {} },
    final: {
      isVisible: true,
      fields: { finalConclusion: true, analystName: true },
    },
    attachments: {
      isVisible: false, // Often hidden in minimal summary
      fields: {},
      customText: "", // Garantir que esteja vazio por padrão
    },
  },
  globalHeader: "Resumo de Ocorrência - Karne & Keijo",
  globalFooter: "Gerado pelo Sistema de Gestão Karne & Keijo.",
  templateName: "Resumo Executivo",
};

const templates: { [key: string]: PdfConfig } = {
  "Padrão Detalhado": defaultPdfConfig,
  "Resumo Executivo": minimalPdfConfig,
};

const sectionLabels: { [key: string]: string } = {
  identification: "1. Identificação da Ocorrência",
  vehicle: "2. Dados do Veículo e Motorista",
  omnilink: "3. Laudo Omnilink (Gestor)",
  tracking: "4. Laudo Siga+ (Rastreamento)",
  evaluation: "5. Apuração do Condutor",
  cargo: "6. Apuração da Carga",
  risk: "7. Monitoramento de Risco",
  final: "8. Laudo Final Consolidado",
  attachments: "9. Anexos do Laudo",
};

const fieldLabels: { [key: string]: string } = {
  incidentNumber: "Nº da Ocorrência", incidentDate: "Data da Ocorrência", incidentTime: "Horário da Ocorrência",
  locationType: "Tipo de Local", establishmentName: "Nome do Estabelecimento", establishmentAddress: "Endereço do Estabelecimento",
  establishmentCircumstances: "Circunstâncias no Estabelecimento", hasDock: "Existe doca?", hasParking: "Tem estacionamento?",
  roadDetailedLocation: "Descrição Detalhada do Local", roadSuspicions: "Suspeitas", roadTrafficConditions: "Condições do Trânsito",
  roadWitnesses: "Testemunhas", boNumber: "Número do B.O.", boDate: "Data do B.O.", sameDay: "Registrado no mesmo dia",
  responsible: "Responsável pelo Registro",

  vehiclePlate: "Placa do Veículo", vehicleModel: "Modelo do Veículo", vehicleTechnology: "Tecnologias do Veículo",
  driverName: "Nome do Motorista", driverCpf: "CPF do Motorista", driverPhone: "Telefone do Motorista",
  driverLicense: "CNH do Motorista", licenseExpiry: "Validade da CNH",

  omnilinkStatus: "Motorista Apto", omnilinkObservations: "Observações Omnilink", omnilinkAnalystVerdict: "Veredito do Analista",

  signalLoss: "Perda de sinal", signalLossTime: "Tempo de ausência", unauthorizedStop: "Parada não programada",
  unauthorizedStopLocation: "Local da parada", prolongedStop: "Parada prolongada", prolongedStopTime: "Tempo parado",
  prolongedStopJustification: "Justificativa",

  followedInstructions: "Seguiu instruções?", reportedAnomalies: "Comunicou anormalidades?", contradictions: "Há contradições?",
  keyToThird: "Entregou chave a terceiros?", doorsOpen: "Deixou portas abertas?", leftVehicleTime: "Afastou-se por mais de 5 min?",
  vehicleLocked: "Veículo trancado?", driverNearVehicle: "Motorista próximo?", authorizedParking: "Estacionado em local autorizado?",
  vehicleRunning: "Veículo ligado sem vigilância?", stoppedInSafePlace: "Parou em local seguro?", activatedPanicButton: "Acionou botão de pânico?",
  driverScore: "Pontuação Total", riskLevel: "Nível de Risco",

  totalCargoValue: "Valor Total da Carga", stolenCargoValue: "Valor da Carga Furtada", cargoObservations: "Observações da Carga",

  riskObservations: "Observações de Risco",

  omnilinkSummary: "Resumo Omnilink", driverSummary: "Resumo do Condutor", trackingSummary: "Resumo Rastreamento",
  cargoSummary: "Resumo da Carga", riskSummary: "Resumo Monitoramento de Risco", finalConclusion: "Conclusão Geral",
  recommendations: "Recomendações e Análise Final", analystName: "Nome do Analista Responsável",

  boFiles: "Anexos do B.O.", sapScreenshots: "Prints do Sistema SAP", riskReports: "Relatórios de Risco", omnilinkPhoto: "Foto Omnilink",
};


const ReportCustomizationTab: React.FC<ReportCustomizationTabProps> = ({ formData, onGeneratePdf }) => {
  // Removido: const { toast } = useToast();
  const [pdfConfig, setPdfConfig] = useState<PdfConfig>(defaultPdfConfig);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("Padrão Detalhado");
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewRef = React.useRef<HTMLDivElement>(null);

  const cnhStatus = getCnhStatus(formData.licenseExpiry);

  const handleTemplateChange = (templateName: string) => {
    setSelectedTemplate(templateName);
    setPdfConfig(templates[templateName] || defaultPdfConfig);
    toast.info("Modelo carregado", {
      description: `O modelo '${templateName}' foi aplicado.`,
    });
  };

  const handleSectionVisibilityChange = (sectionId: string, isChecked: boolean) => {
    setPdfConfig(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionId]: {
          ...prev.sections[sectionId],
          isVisible: isChecked,
        },
      },
    }));
  };

  const handleFieldVisibilityChange = (sectionId: string, fieldId: string, isChecked: boolean) => {
    setPdfConfig(prev => {
      const currentSection = prev.sections[sectionId];
      // Ensure currentSection and its fields property exist and are objects
      const updatedFields = { ...(currentSection?.fields || {}), [fieldId]: isChecked };
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionId]: {
            ...currentSection, // Copy existing properties of the section
            fields: updatedFields, // Assign the safely updated fields object
          },
        },
      };
    });
  };

  const handleCustomTextChange = (sectionId: string, text: string) => {
    setPdfConfig(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionId]: {
          ...prev.sections[sectionId],
          customText: text,
        },
      },
    }));
  };

  const handleGlobalTextChange = (type: 'header' | 'footer', text: string) => {
    setPdfConfig(prev => ({
      ...prev,
      [`global${type === 'header' ? 'Header' : 'Footer'}`]: text,
    }));
  };

  const renderFieldCheckbox = (sectionId: string, fieldId: string) => {
    const isVisible = pdfConfig.sections[sectionId]?.fields[fieldId];
    const label = fieldLabels[fieldId] || fieldId;

    // Conditional rendering for location-specific fields
    if (sectionId === 'identification') {
      if (fieldId.startsWith('establishment') && formData.locationType !== 'establishment') return null;
      if (fieldId.startsWith('road') && formData.locationType !== 'public_road') return null;
    }
    if (sectionId === 'tracking') {
      if (fieldId === 'signalLossTime' && formData.signalLoss !== 'yes') return null;
      if (fieldId === 'unauthorizedStopLocation' && formData.unauthorizedStop !== 'yes') return null;
      if ((fieldId === 'prolongedStopTime' || fieldId === 'prolongedStopJustification') && formData.prolongedStop !== 'yes') return null;
    }
    if (sectionId === 'evaluation') {
      if ((fieldId === 'vehicleLocked' || fieldId === 'driverNearVehicle' || fieldId === 'authorizedParking') && formData.locationType !== 'establishment') return null;
      if ((fieldId === 'vehicleRunning' || fieldId === 'stoppedInSafePlace' || fieldId === 'activatedPanicButton') && formData.locationType !== 'public_road') return null;
    }


    return (
      <div key={fieldId} className="flex items-center space-x-2">
        <Checkbox
          id={`${sectionId}-${fieldId}`}
          checked={isVisible}
          onCheckedChange={(checked: boolean) => handleFieldVisibilityChange(sectionId, fieldId, checked)}
        />
        <Label htmlFor={`${sectionId}-${fieldId}`}>{label}</Label>
      </div>
    );
  };

  const renderSectionConfig = (sectionId: string) => {
    const section = pdfConfig.sections[sectionId];
    if (!section || !section.fields) return null; // Added defensive check for section.fields

    return (
      <Card key={sectionId} className="mb-4">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`section-${sectionId}`}
              checked={section.isVisible}
              onCheckedChange={(checked: boolean) => handleSectionVisibilityChange(sectionId, checked)}
            />
            <Label htmlFor={`section-${sectionId}`} className="text-md font-semibold">
              {sectionLabels[sectionId]}
            </Label>
          </div>
        </CardHeader>
        {section.isVisible && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.keys(section.fields).map(fieldId => renderFieldCheckbox(sectionId, fieldId))}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`custom-text-${sectionId}`}>Texto Personalizado (início da seção)</Label>
              <Textarea
                id={`custom-text-${sectionId}`}
                value={section.customText || ''}
                onChange={(e) => handleCustomTextChange(sectionId, e.target.value)}
                placeholder="Adicione um texto introdutório para esta seção no PDF..."
              />
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  const renderPdfPreview = useCallback(() => {
    if (!previewRef.current) return;

    setPreviewLoading(true);
    // Clear previous content
    previewRef.current.innerHTML = '';

    // Render the PDF layout component into a temporary div
    const tempDiv = document.createElement('div');
    tempDiv.style.width = '210mm'; // A4 width
    tempDiv.style.minHeight = '297mm'; // A4 height
    tempDiv.style.boxShadow = '0 0 8px rgba(0,0,0,0.1)';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.margin = 'auto';
    tempDiv.style.overflow = 'hidden'; // Ensure content doesn't overflow
    previewRef.current.appendChild(tempDiv);

    const root = createRoot(tempDiv);
    root.render(
      <IncidentReportPDFLayout
        formData={formData}
        boAttachments={formData.boFiles}
        sapScreenshotAttachments={formData.sapScreenshots}
        riskReportAttachments={formData.riskReports}
        omnilinkPhotoAttachment={formData.omnilinkPhoto ? [formData.omnilinkPhoto] : []}
        pdfConfig={pdfConfig}
        cnhStatus={cnhStatus}
      />
    );

    // A small delay to allow rendering before setting loading to false
    setTimeout(() => {
      setPreviewLoading(false);
    }, 300);

    return () => {
      root.unmount();
    };
  }, [formData, pdfConfig, cnhStatus]);

  useEffect(() => {
    renderPdfPreview();
  }, [renderPdfPreview]);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Coluna de Configuração */}
      <div className="space-y-6">
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Configuração do Relatório PDF
            </CardTitle>
            <CardDescription>
              Selecione os campos e seções que deseja incluir no relatório.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-select">Carregar Modelo</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger id="template-select">
                  <SelectValue placeholder="Selecione um modelo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(templates).map(templateName => (
                    <SelectItem key={templateName} value={templateName}>
                      {templateName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="global-header">Cabeçalho Global</Label>
              <Input
                id="global-header"
                value={pdfConfig.globalHeader || ''}
                onChange={(e) => handleGlobalTextChange('header', e.target.value)}
                placeholder="Texto do cabeçalho do PDF"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="global-footer">Rodapé Global</Label>
              <Input
                id="global-footer"
                value={pdfConfig.globalFooter || ''}
                onChange={(e) => handleGlobalTextChange('footer', e.target.value)}
                placeholder="Texto do rodapé do PDF"
              />
            </div>
          </CardContent>
        </Card>

        <ScrollArea className="h-[calc(100vh-250px)] pr-4"> {/* Adjust height as needed */}
          {Object.keys(pdfConfig.sections).map(sectionId => renderSectionConfig(sectionId))}
        </ScrollArea>
      </div>

      {/* Coluna de Pré-visualização */}
      <div className="space-y-6">
        <Card className="modern-card sticky top-20"> {/* Sticky for better UX */}
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Pré-visualização do PDF
            </CardTitle>
            <CardDescription>
              Veja como o relatório será gerado com as configurações atuais.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative min-h-[400px] flex items-center justify-center">
            {previewLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            <div ref={previewRef} className="w-full h-full overflow-hidden">
              {/* PDF content will be rendered here */}
            </div>
          </CardContent>
        </Card>
        <Button onClick={() => onGeneratePdf(pdfConfig)} className="w-full">
          <Save className="mr-2 h-4 w-4" /> Gerar PDF Final
        </Button>
      </div>
    </div>
  );
};

export default ReportCustomizationTab;