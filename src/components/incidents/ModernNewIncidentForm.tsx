// @ts-nocheck
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Save,
  X,
  MoreVertical,
  AlertTriangle,
  Truck,
  Shield,
  MapPin,
  CheckCircle,
  Package,
  AlertCircleIcon,
  Paperclip,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { NewDriverForm } from "@/components/drivers/NewDriverForm";
import { NewVehicleForm } from "@/components/vehicles/NewVehicleForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { z } from "zod";
import { incidentFormSchema } from "@/lib/validations/incidentFormSchema";
import { getCnhStatus as getCnhStatusUtil } from "@/lib/driver-utils";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "./SectionHeader";
import { IncidentIdentificationSection } from "./IncidentIdentificationSection";
import { VehicleDriverSection } from "./VehicleDriverSection";
import { OmnilinkReportSection } from "./OmnilinkReportSection";
import { TrackingReportSection } from "./TrackingReportSection";
import { DriverEvaluationSection } from "./DriverEvaluationSection";
import { CargoEvaluationSection } from "./CargoEvaluationSection";
import { RiskMonitoringSection } from "./RiskMonitoringSection";
import { FinalReportSection } from "./FinalReportSection";
import { IncidentAttachmentsSection } from "./IncidentAttachmentsSection";
import { ReportCustomizationTab } from "./ReportCustomizationTab";
import { cn } from "@/lib/utils";

type IncidentFormData = z.infer<typeof incidentFormSchema> & {
  vehiclePlate: string;
  vehicleModel: string;
  vehicleYear: string;
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
};


interface NewIncidentFormProps {
  onClose: () => void;
  onSave: (data: IncidentFormData, isDraft?: boolean) => void;
  initialData?: any; // Add this line
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  onCancelConfirm: () => void; // Add this line
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

export const NewIncidentForm = ({ onClose, onSave, initialData, setHasUnsavedChanges, onCancelConfirm }: NewIncidentFormProps) => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("identification");
  const [isNewDriverDialogOpen, setIsNewDriverDialogOpen] = useState(false);
  const [isNewVehicleDialogOpen, setIsNewVehicleDialogOpen] = useState(false);
  const [isLoadingIncidentNumber, setIsLoadingIncidentNumber] = useState(true);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  
  // Get the setSaveDraftCallback from the outlet context
  const { setSaveDraftCallback } = useOutletContext() as { 
    setSaveDraftCallback: React.Dispatch<React.SetStateAction<(() => void) | undefined>>;
    handleSaveIncident: (formData: any, isDraft?: boolean) => void;
  };

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
      includeRiskAnalysis: true,
      includeCargoInfo: true,
      includeFinalReport: true,
    },
    driverScore: 0,
    riskLevel: "",
    isDraft: false,
  });

  // Load draft from localStorage if available and no initialData
  useEffect(() => {
    if (!initialData) {
      const storedDraft = localStorage.getItem('incidentFormData');
      if (storedDraft) {
        setFormData(JSON.parse(storedDraft));
      }
    }
  }, [initialData]);

  // Save draft to localStorage on formData change
  useEffect(() => {
    localStorage.setItem('incidentFormData', JSON.stringify(formData));
  }, [formData]);

  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  
  const [hasInitialData] = useState(!!initialData);
  
  // Detectar mudanças não salvas
  useEffect(() => {
    if (setHasUnsavedChanges && !hasInitialData) {
      const hasData = !!(formData.incidentNumber || 
                      formData.vehicleId || 
                      formData.driverId ||
                      formData.incidentDescription ||
                      formData.boFiles.length > 0);
      setHasUnsavedChanges(hasData);
    }
  }, [formData, setHasUnsavedChanges, hasInitialData]);

const sectionFields = {
    identification: [
      'incidentNumber', 'incidentDate', 'incidentTime', 'location', 'boNumber', 'boDate', 'sameDay', 'responsible',
      'locationType', 'establishmentName', 'establishmentAddress', 'establishmentCircumstances', 'hasDock', 'hasParking',
      'roadDetailedLocation', 'roadSuspicions', 'roadTrafficConditions', 'roadWitnesses',
    ],
    omnilink: ['omnilinkStatus', 'omnilinkObservations', 'omnilinkAnalystVerdict', 'omnilinkPhoto'],
    vehicle: ['vehicleId', 'vehiclePlate', 'vehicleModel', 'vehicleTechnology', 'vehiclePriority', 'vehicleBlockerInstalled', 'driverId', 'driverName', 'driverCpf', 'driverPhone', 'driverLicense', 'licenseExpiry', 'omnilinkScoreRegistrationDate', 'omnilinkScoreExpiryDate', 'omnilinkScoreStatus'], // UPDATED
    tracking: ['signalLoss', 'unauthorizedStop', 'prolongedStop', 'trackingAnalysis'],
    cargo: ['totalCargoValue', 'stolenCargoValue', 'cargoObservations'],
    risk: ['riskObservations', 'riskAnalysis'],
    evaluation: ['evaluationConclusion', 'evaluationRecommendations'],
    final: ['omnilinkSummary', 'driverSummary', 'trackingSummary', 'cargoSummary', 'riskSummary', 'finalConclusion', 'recommendations', 'analystName'],
    attachments: ['boFiles', 'sapScreenshots', 'riskReports'],
    pdf: [], // No direct fields, handled by pdfConfig
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (setHasUnsavedChanges) setHasUnsavedChanges(true);
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
      toast.success("Upload concluído", {
        description: `Arquivo(s) para ${field} enviado(s) com sucesso.`,
      });
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro no upload", {
        description: "Não foi possível enviar o(s) arquivo(s).",
      });
    } finally {
      setUploadingFiles(prev => ({ ...prev, [field]: false }));
    }
  }, [formData, setHasUnsavedChanges]);

  const handleRemoveFile = useCallback((field: keyof IncidentAttachmentsFormData, fileName: string) => {
    setFormData(prev => {
      const currentFiles = prev[field] as AttachmentItem[];
      const updatedFiles = currentFiles.filter(file => file.name !== fileName);
      return { ...prev, [field]: updatedFiles };
    });
    if (setHasUnsavedChanges) setHasUnsavedChanges(true);
  }, [setHasUnsavedChanges]);

  const handleSaveAsDraft = useCallback(() => {
    onSave(formData, true);
  }, [formData, onSave]);

  // Register the save draft callback in the context
  useEffect(() => {
    if (setSaveDraftCallback) {
      setSaveDraftCallback(() => handleSaveAsDraft);
    }
    return () => {
      if (setSaveDraftCallback) {
        setSaveDraftCallback(undefined);
      }
    };
  }, [setSaveDraftCallback, handleSaveAsDraft]);

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
        return <IncidentIdentificationSection formData={formData} onFormDataChange={handleIdentificationSectionChange} />;
      case "vehicle":
        return <VehicleDriverSection formData={formData} onInputChange={handleInputChange} cnhStatus={cnhStatus} />;
      case "omnilink":
        return <OmnilinkReportSection formData={formData} onInputChange={handleInputChange} handleFileUpload={handleFileUpload} uploadingFiles={uploadingFiles} handleRemoveFile={handleRemoveFile} />;
      case "tracking":
        return <TrackingReportSection formData={formData} onInputChange={handleInputChange} />;
      case "evaluation":
        return <DriverEvaluationSection formData={formData} onInputChange={handleInputChange} />;      case "cargo":
        return <CargoEvaluationSection formData={formData} onInputChange={handleInputChange} />;      case "risk":
        return <RiskMonitoringSection formData={formData} onInputChange={handleInputChange} />;      case "final":
        return <FinalReportSection formData={formData} onInputChange={handleInputChange} />;
      case "attachments":
        return <IncidentAttachmentsSection formData={formData} handleFileUpload={handleFileUpload} uploadingFiles={uploadingFiles} handleRemoveFile={handleRemoveFile} />;      case "pdf-customization":
        return <ReportCustomizationTab formData={formData} onInputChange={handleInputChange} generatePDF={generatePDF} />;      default:
        return null;
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
            {/* Botão Cancelar Ocorrência */}
            <Button 
              onClick={() => setIsCancelConfirmOpen(true)} // Open confirmation modal
              size="sm" 
              variant="ghost" 
              className="hidden sm:flex text-white hover:bg-white/10"
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar Ocorrência
            </Button>

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
                  <DropdownMenuItem onClick={() => setIsCancelConfirmOpen(true)}>
                    <X className="mr-2 h-4 w-4" />
                    Cancelar Ocorrência
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSaveAsDraft}>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar como Rascunho
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

      {/* Main Content */}
      <div className="container py-8 px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar for Navigation */}
          <Card className="lg:col-span-1 modern-card h-fit">
            <CardContent className="p-0">
              <nav className="grid gap-2 p-4">
                {sections.map((section) => (
                  <Button
                    key={section.id}
                    variant={activeTab === section.id ? "secondary" : "ghost"}
                    className="justify-start text-left px-3 py-2 rounded-lg text-white hover:bg-white/10"
                    onClick={() => setActiveTab(section.id)}
                  >
                    <section.icon className="mr-3 h-5 w-5" />
                    {section.label}
                  </Button>
                ))}
              </nav>
            </CardContent>
          </Card>

          {/* Main Form Area */}
          {/* Main Form Area */}
          <div className="lg:col-span-3">
            <Card className="bg-card/20 border-border/50 backdrop-blur-xl rounded-2xl overflow-hidden">
              <CardContent className="py-8 px-6">
                <div className="pr-4">
                  {renderSectionContent(activeTab)}
                </div>
              </CardContent>
            </Card>
          </div>
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

      {/* Cancel Confirmation Modal */}
      <AlertDialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
        <AlertDialogContent className="bg-card text-card-foreground p-6 rounded-lg shadow-xl max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-white">Deseja cancelar a ocorrência atual?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 mt-2">
              Você está prestes a sair da página de criação de ocorrência. Escolha uma opção abaixo:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row-reverse gap-3 mt-6">
            <Button
              variant="destructive"
              onClick={() => {
                onCancelConfirm();
                setIsCancelConfirmOpen(false);
              }}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Sim, cancelar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                handleSaveAsDraft();
                setIsCancelConfirmOpen(false);
              }}
              className="w-full sm:w-auto border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Salvar rascunho
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsCancelConfirmOpen(false)}
              className="w-full sm:w-auto text-gray-300 hover:bg-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Não, continuar editando
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};