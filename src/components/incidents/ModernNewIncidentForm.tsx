import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'sonner';
import { IncidentAttachmentsFormData, AttachmentItem } from './IncidentAttachmentsSection';
import { ArrowLeft, FileText, Save, Download, AlertTriangle, Truck, Shield, MapPin, CheckCircle, Package, AlertCircleIcon, Paperclip, MoreVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { z } from "zod";
import { incidentFormSchema } from "@/lib/validations/incident-form-schema";

interface PdfConfig {
  includeCoverPage: boolean;
  includeTableOfContents: boolean;
  includeAttachments: boolean;
  includeDriverInfo: boolean;
  includeVehicleInfo: boolean;
  includeOmnilinkReport: boolean;
  includeTrackingReport: boolean;
  includeDriverEvaluation: boolean;
  includeCargoEvaluation: boolean;
  includeRiskMonitoring: boolean;
  includeFinalReport: boolean;
}


// Import modular sections
import { IncidentIdentificationSection } from './IncidentIdentificationSection';
import { VehicleDriverSection } from './VehicleDriverSection';
import { OmnilinkReportSection } from './OmnilinkReportSection';
import { TrackingReportSection } from './TrackingReportSection';
import { DriverEvaluationSection } from './DriverEvaluationSection';
import { CargoEvaluationSection } from './CargoEvaluationSection';
import { RiskMonitoringSection } from './RiskMonitoringSection';
import { FinalReportSection } from './FinalReportSection';
import { IncidentAttachmentsSection } from './IncidentAttachmentsSection';
import ReportCustomizationTab from './ReportCustomizationTab';

// Import forms
import NewDriverForm from '@/components/drivers/NewDriverForm';
import NewVehicleForm from '@/components/vehicles/NewVehicleForm';

// Import from new driver-utils
import { getCnhStatus as getCnhStatusUtil, CnhStatus, calculateOmnilinkScoreExpiry, calculateOmnilinkScoreStatus } from '@/lib/driver-utils';

interface IncidentFormData {
  id?: string;
  incidentNumber: string;
  incidentDate: string;
  incidentTime: string;
  locationType: string;
  locationDetails: string;
  incidentType: string;
  incidentDescription: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleYear: string;
  driverId: string;
  driverName: string;
  driverDocument: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string;
  finalConclusion: string;
  recommendations: string;
  analystName: string;
  boFiles: AttachmentItem[];
  sapScreenshots: AttachmentItem[];
  riskReports: AttachmentItem[];
  omnilinkPhoto: AttachmentItem | null;
  pdfConfig: PdfConfig;
  driverScore: number;
  riskLevel: string;
  isDraft: boolean;
}


interface NewIncidentFormProps {
  onClose: () => void;
  onSave: (data: IncidentFormData, isDraft?: boolean) => void;
  initialData?: any; // Add this line
}

const sections = [
  { id: "identification", label: "Ocorrência", icon: AlertTriangle },
  { id: "vehicle", label: "Veículo/Condutor", icon: Truck },
  { id: "omnilink", label: "Omnilink", icon: Shield },
  { id: "tracking", label: "Rastreamento", icon: MapPin },
  { id: "evaluation", label: "Apuração", icon: CheckCircle },
  { id: "cargo", label: "Carga", icon: Package },
  { id: "risk", label: "Risco", icon: AlertCircleIcon },
  { id: "final", label: "Laudo Final", icon: FileText },
  { id: "attachments", label: "Anexos", icon: Paperclip },
  { id: "pdf-customization", label: "Visualizar PDF", icon: Download },
];

// Helper function to get CNH status
export const getCnhStatus = getCnhStatusUtil;

export const NewIncidentForm = ({ onClose, onSave, initialData }: NewIncidentFormProps) => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("identification");
  const [isNewDriverDialogOpen, setIsNewDriverDialogOpen] = useState(false);
  const [isNewVehicleDialogOpen, setIsNewVehicleDialogOpen] = useState(false);

  // Usando a interface IncidentFormData já definida
  const [formData, setFormData] = useState<IncidentFormData>(initialData || {
    incidentNumber: "",
    incidentDate: "",
    incidentTime: "",
    locationType: "",
    locationDetails: "",
    incidentType: "",
    incidentDescription: "",
    vehicleId: "",
    vehiclePlate: "",
    vehicleModel: "",
    vehicleYear: "",
    driverId: "",
    driverName: "",
    driverDocument: "",
    licenseNumber: "",
    licenseCategory: "",
    licenseExpiry: "",
    finalConclusion: "",
    recommendations: "",
    analystName: "",
    boFiles: [],
    sapScreenshots: [],
    riskReports: [],
    omnilinkPhoto: null,
    pdfConfig: {
      includeCoverPage: true,
      includeTableOfContents: true,
      includeAttachments: true,
      includeDriverInfo: true,
      includeVehicleInfo: true,
      includeOmnilinkReport: true,
      includeTrackingReport: true,
      includeDriverEvaluation: true,
      includeCargoEvaluation: true,
      includeRiskMonitoring: true,
      includeFinalReport: true
    },
    driverScore: 0,
    riskLevel: "Baixo",
    isDraft: false
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      
      // Recalcular pontuação do motorista e nível de risco quando certos campos mudam
      if (field === 'driverScore') {
        const score = value;
        let riskLevel = 'Baixo';
        
        if (score < 60) {
          riskLevel = 'Alto';
        } else if (score < 80) {
          riskLevel = 'Médio';
        }
        
        return { ...newData, riskLevel };
      }
      
      return newData;
    });
  };
  

  // Load form data from localStorage on initial render
  useEffect(() => {
    const savedFormData = localStorage.getItem('incidentFormData');
    if (savedFormData) {
      setFormData(JSON.parse(savedFormData));
    }
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('incidentFormData', JSON.stringify(formData));
  }, [formData]);

  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});

const sectionFields = {
    identification: [
      'incidentNumber', 'incidentDate', 'incidentTime', 'location', 'boNumber', 'boDate', 'sameDay', 'responsible',
      'locationType',
    ],
    omnilink: ['omnilinkStatus', 'omnilinkObservations', 'omnilinkAnalystVerdict'],
    vehicle: ['vehicleId', 'vehiclePlate', 'vehicleModel', 'vehicleTechnology', 'driverId', 'driverName', 'driverCpf', 'driverPhone', 'driverLicense', 'licenseExpiry', 'omnilinkScoreRegistrationDate', 'omnilinkScoreExpiryDate', 'omnilinkScoreStatus'], // UPDATED
    tracking: ['signalLoss', 'unauthorizedStop', 'prolongedStop'],
    cargo: ['totalCargoValue', 'stolenCargoValue', 'cargoObservations'],
    risk: ['riskObservations'],
    final: ['omnilinkSummary', 'driverSummary', 'trackingSummary', 'cargoSummary', 'riskSummary', 'finalConclusion', 'recommendations', 'analystName'],
    attachments: ['boFiles', 'sapScreenshots', 'riskReports', 'omnilinkPhoto'],
    "pdf-customization": [],
  };

  const calculateSectionCompletion = (currentFormData: typeof formData, sectionId: keyof typeof sectionFields | 'evaluation'): number => {
    if (sectionId === 'evaluation') {
      // Simplified calculation for evaluation
      return 50; // Return a default percentage
    }

    const fields = sectionFields[sectionId as keyof typeof sectionFields];
    if (!fields) return 0;

    let filledCount = 0;
    let totalCount = fields.length;

    fields.forEach(field => {
      const value = currentFormData[field as keyof typeof currentFormData];
      if (typeof value === 'string' && value.trim() !== '') {
        filledCount++;
      } else if (Array.isArray(value) && value.length > 0) {
        filledCount++;
      } else if (value !== null && value !== undefined && value !== '') {
        filledCount++;
      }
    });

    return totalCount === 0 ? 100 : Math.round((filledCount / totalCount) * 100);
  };

    // Função de upload de arquivos
  const handleFileUpload = useCallback(async (field: keyof IncidentAttachmentsFormData, files: FileList | File | null) => {
    if (!files) return;

    setUploadingFiles(prev => ({ ...prev, [field]: true }));

    try {
      const incidentNum = formData.incidentNumber || 'temp'; // Use incidentNumber for path
      const path = `incidents/${incidentNum}/${field}`;

      if (field === 'omnilinkPhoto' && files instanceof File) {
        // Implementação inline para evitar problemas com Hooks
        let url = '';
        if (files.type.startsWith('image/')) {
          url = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(files);
          });
        } else {
          url = `/uploads/${path}/${files.name}`;
        }
        
        setFormData(prev => ({ ...prev, [field]: { name: files.name, url } }));
      } else if (files instanceof FileList) {
        // Implementação inline para evitar problemas com Hooks
        const uploaded: AttachmentItem[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          // Simulate upload delay
          await new Promise(resolve => setTimeout(resolve, 500));

          if (file.type.startsWith('image/')) {
            const dataUrl: string = await new Promise(resolve => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            });
            uploaded.push({ name: file.name, url: dataUrl });
          } else {
            uploaded.push({ name: file.name, url: `/uploads/${path}/${file.name}` });
          }
        }
        
        setFormData(prev => ({ ...prev, [field]: [...(prev[field] as AttachmentItem[]), ...uploaded] }));
      }
      toast.success("Arquivo(s) enviado(s) com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar arquivo(s):", error);
      toast.error("Erro ao enviar arquivo(s)", { description: "Por favor, tente novamente." });
    } finally {
      setUploadingFiles(prev => ({ ...prev, [field]: false }));
    }
  }, [formData.incidentNumber]);

  const handleSaveAsDraft = () => {
    onSave(formData, true);
    toast.success("Rascunho salvo!", {
      description: "A ocorrência foi salva como rascunho e pode ser editada mais tarde.",
    });
  };

  const handleSave = () => {
    if (!formData.incidentNumber || !formData.incidentDate || !formData.locationType) {
      toast.error("Campos obrigatórios", {
        description: "Por favor, preencha todos os campos obrigatórios da seção 'Ocorrência'.",
      });
      return;
    }
    onSave(formData, false);
    toast.success("Ocorrência salva!", {
      description: "A ocorrência foi registrada com sucesso.",
    });
  };

  const generatePDF = () => {
    toast.info("PDF", {
      description: "Funcionalidade de PDF em desenvolvimento.",
    });
  };

  const cnhStatus = getCnhStatus(formData.licenseExpiry);

  const handleIdentificationSectionChange = (data: Partial<z.infer<typeof incidentFormSchema>>) => {
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        handleInputChange(key as string, data[key as keyof typeof data]);
      }
    }
  };

  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case "identification":
        return (
          <IncidentIdentificationSection
            formData={formData}
            onFormDataChange={handleIdentificationSectionChange}
          />
        );
      case "vehicle":
        return (
          <VehicleDriverSection
            formData={{
              boFiles: formData.boFiles,
              sapScreenshots: formData.sapScreenshots,
              riskReports: formData.riskReports,
              omnilinkPhoto: formData.omnilinkPhoto,
            }}
            handleInputChange={handleInputChange}
            isLoadingDrivers={false}
            drivers={[]}
            handleDriverSelect={(driverId: string) => {
              handleInputChange('driverId', driverId);
            }}
            setIsNewDriverDialogOpen={setIsNewDriverDialogOpen}
            isLoadingVehicles={false}
            vehicles={[]}
            handleVehicleSelect={(vehicleId: string) => {
              handleInputChange('vehicleId', vehicleId);
            }}
            setIsNewVehicleDialogOpen={setIsNewVehicleDialogOpen}
            cnhStatus={cnhStatus}
          />
        );
      case "omnilink":
        return (
          <OmnilinkReportSection
            formData={{
              boFiles: formData.boFiles,
              sapScreenshots: formData.sapScreenshots,
              riskReports: formData.riskReports,
              omnilinkPhoto: formData.omnilinkPhoto,
            }}
            handleInputChange={handleInputChange}
          />
        );
      case "tracking":
        return (
          <TrackingReportSection
            formData={formData}
            handleInputChange={handleInputChange}
          />
        );
      case "evaluation":
        return (
          <DriverEvaluationSection
            formData={formData}
            handleInputChange={handleInputChange}
          />
        );
      case "cargo":
        return (
          <CargoEvaluationSection
            formData={formData}
            handleInputChange={handleInputChange}
          />
        );
      case "risk":
        return (
          <RiskMonitoringSection
            formData={formData}
            handleInputChange={handleInputChange}
          />
        );
      case "final":
        return (
          <FinalReportSection
            formData={formData}
            handleInputChange={handleInputChange}
          />
        );
      case "attachments":
        return (
          <IncidentAttachmentsSection
            handleFileUpload={handleFileUpload}

            formData={{
              boFiles: formData.boFiles,
              sapScreenshots: formData.sapScreenshots,
              riskReports: formData.riskReports,
              omnilinkPhoto: formData.omnilinkPhoto,
            }}
            // onFormDataChange={(updatedAttachments: Partial<typeof formData>) => {
            //   return setFormData(prev => ({ ...prev, ...updatedAttachments }));
            // }}
            uploadingFiles={uploadingFiles}
            handleRemoveAttachment={() => {}}
          />
        );
      case "pdf-customization":
        return (
          <ReportCustomizationTab
            formData={formData}
            onGeneratePdf={generatePDF}
          />
        );
      default:
        return (
          <div className="text-center py-12">
            <p className="text-slate-400">Seção em desenvolvimento...</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Modern Header with Gradient */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600/50 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6"> {/* Ajustado para h-16 e px-4 */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/10 rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg"> {/* Ajustado para h-10 w-10 */}
                <FileText className="h-5 w-5 text-white" /> {/* Ajustado para h-5 w-5 */}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white sm:text-2xl">Nova Ocorrência</h1> {/* Ajustado para text-xl sm:text-2xl */}
                <p className="text-slate-300 text-xs sm:text-sm hidden sm:block">Registrar nova ocorrência no sistema</p> {/* Escondido em mobile */}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Desktop Buttons */}

            <Button onClick={handleSaveAsDraft} size="sm" variant="outline" className="hidden sm:flex">
              <Save className="mr-2 h-4 w-4" />
              Salvar como Rascunho
            </Button>
            <Button
              onClick={handleSave}
              className="hidden sm:flex bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg"
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>

            {/* Mobile Dropdown Menu for Actions */}
            {isMobile && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[180px] bg-card/20 backdrop-blur-md border border-border/50">
                  <DropdownMenuItem onClick={onClose}>
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => generatePDF()}>
                    <Download className="mr-2 h-4 w-4" />
                    Gerar PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6"> {/* Ajustado padding */}
        <div className="mx-auto max-w-7xl">
          {isMobile ? (
            // Mobile Accordion View
            <div className="space-y-4">
              {sections.map((section) => {
                const completion = calculateSectionCompletion(formData, section.id as keyof typeof sectionFields | 'evaluation');
                const IconComponent = section.icon;
                
                return (
                  <Card key={section.id} className="bg-card/20 border-border/50 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-500/20">
                            <IconComponent className="h-5 w-5 text-blue-400" />
                          </div>
                          <div>
                            <CardTitle className="text-white text-base">{section.label}</CardTitle> {/* Ajustado para text-base */}
                            <div className="flex items-center gap-2 mt-1">
                              <Progress value={completion} className="w-20 h-2" />
                              <span className="text-xs text-slate-400">{completion}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {renderSectionContent(section.id)}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            // Desktop Modern Tabs View
            <div className="space-y-6">
              {/* Enhanced Tab Navigation */}
              <div className="bg-card/20 rounded-2xl p-2 backdrop-blur-xl border border-border/50">
                <div className="flex flex-wrap scrollbar-hide gap-2">
                  {sections.map((section) => {
                    const completion = calculateSectionCompletion(formData, section.id as keyof typeof sectionFields | 'evaluation');
                    const IconComponent = section.icon;
                    const isActive = activeTab === section.id;
                    
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveTab(section.id)}
                        className={cn(
                          "flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300", // Ajustado padding e font-size
                          "hover:bg-card/30",
                          isActive
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105"
                            : "text-slate-300 hover:text-white"
                        )}
                      >
                        <IconComponent className="h-4 w-4" />
                        <div className="text-left">
                          <div className="font-medium">{section.label}</div>
                          <div className="text-xs opacity-75">{completion}%</div>
                        </div>
                        {isActive && (
                          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content Area */}
              <Card className="bg-card/20 border-border/50 backdrop-blur-xl rounded-2xl overflow-hidden">
                <CardContent className="py-8 px-6">
                  <div className="pr-4">
                    {renderSectionContent(activeTab)}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={isNewDriverDialogOpen} onOpenChange={setIsNewDriverDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card/20 border-border/50">
          <DialogHeader>
            <DialogTitle className="text-white">Cadastrar Novo Motorista</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Preencha os dados para adicionar um novo motorista ao sistema.
            </DialogDescription>
          </DialogHeader>
          <NewDriverForm 
            onDriverCreated={() => {
              setIsNewDriverDialogOpen(false);
            }} 
            onClose={() => setIsNewDriverDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isNewVehicleDialogOpen} onOpenChange={setIsNewVehicleDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card/20 border-border/50">
          <DialogHeader>
            <DialogTitle className="text-white">Cadastrar Novo Veículo</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Preencha os dados para adicionar um novo veículo ao sistema.
            </DialogDescription>
          </DialogHeader>
          <NewVehicleForm 
            onVehicleCreated={() => {
              setIsNewVehicleDialogOpen(false);
            }} 
            onClose={() => setIsNewVehicleDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};