import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Save, Download, AlertTriangle, Truck, Shield, MapPin, CheckCircle, Package, AlertCircleIcon, Paperclip } from "lucide-react";
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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

interface NewIncidentFormProps {
  onClose: () => void;
  onSave: (data: any) => void;
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

export interface CnhStatus {
  status: 'valid' | 'expiring_soon' | 'expired' | 'unknown';
  message: string;
  monthsDifference: number;
  daysDifference: number;
}

// Helper function to get CNH status
export const getCnhStatus = (licenseExpiryDateString: string): CnhStatus => {
  if (!licenseExpiryDateString) {
    return { status: 'unknown', message: 'Data de validade da CNH não informada.', monthsDifference: 0, daysDifference: 0 };
  }
  return { status: 'valid', message: 'CNH válida', monthsDifference: 0, daysDifference: 0 };
};

export const NewIncidentForm = ({ onClose, onSave }: NewIncidentFormProps) => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("identification");
  const [isNewDriverDialogOpen, setIsNewDriverDialogOpen] = useState(false);
  const [isNewVehicleDialogOpen, setIsNewVehicleDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    incidentNumber: "",
    incidentDate: "",
    incidentTime: "",
    location: "",
    locationType: "" as "establishment" | "public_road" | "",
    establishmentName: "",
    establishmentAddress: "",
    establishmentCircumstances: "",
    hasDock: "" as "yes" | "no" | "",
    hasParking: "" as "yes" | "no" | "",
    roadDetailedLocation: "",
    roadSuspicions: "",
    roadTrafficConditions: "",
    roadWitnesses: "",
    boNumber: "",
    boDate: "",
    sameDay: "" as "yes" | "no" | "",
    responsible: "",
    
    vehicleId: "" as string | null,
    vehiclePlate: "",
    vehicleModel: "",
    vehicleTechnology: [] as string[],
    driverId: "" as string | null,
    driverName: "",
    driverCpf: "",
    driverPhone: "",
    driverLicense: "",
    licenseExpiry: "",
    
    omnilinkStatus: "" as "yes" | "no" | "",
    omnilinkObservations: "",
    omnilinkAnalystVerdict: "",
    
    signalLoss: "" as "yes" | "no" | "",
    signalLossTime: "",
    unauthorizedStop: "" as "yes" | "no" | "",
    unauthorizedStopLocation: "",
    prolongedStop: "" as "yes" | "no" | "",
    prolongedStopTime: "",
    prolongedStopJustification: "",
    
    vehicleLocked: "" as "yes" | "no" | "",
    driverNearVehicle: "" as "yes" | "no" | "",
    authorizedParking: "" as "yes" | "no" | "",
    leftVehicleTime: "" as "yes" | "no" | "",
    vehicleRunning: "" as "yes" | "no" | "",
    keyToThird: "" as "yes" | "no" | "",
    doorsOpen: "" as "yes" | "no" | "",
    followedInstructions: "" as "yes" | "no" | "",
    reportedAnomalies: "" as "yes" | "no" | "",
    contradictions: "" as "yes" | "no" | "",
    stoppedInSafePlace: "" as "yes" | "no" | "",
    activatedPanicButton: "" as "yes" | "no" | "",
    driverScore: 0,
    riskLevel: "",
    
    totalCargoValue: "",
    stolenCargoValue: "",
    cargoObservations: "",
    
    riskObservations: "",
    
    omnilinkSummary: "",
    driverSummary: "",
    trackingSummary: "",
    cargoSummary: "",
    riskSummary: "",
    finalConclusion: "",
    recommendations: "",
    analystName: "",
    
    boFiles: [] as { name: string, url: string }[],
    sapScreenshots: [] as { name: string, url: string }[],
    riskReports: [] as { name: string, url: string }[],
    omnilinkPhoto: null as { name: string, url: string } | null,
  });

  const [uploadingFiles] = useState<{ [key: string]: boolean }>({
    boFiles: false,
    sapScreenshots: false,
    riskReports: false,
    omnilinkPhoto: false,
  });

  const sectionFields = {
    identification: [
      'incidentNumber', 'incidentDate', 'incidentTime', 'location', 'boNumber', 'boDate', 'sameDay', 'responsible',
      'locationType',
    ],
    vehicle: ['vehicleId', 'vehiclePlate', 'vehicleModel', 'vehicleTechnology', 'driverId', 'driverName', 'driverCpf', 'driverPhone', 'driverLicense', 'licenseExpiry'],
    omnilink: ['omnilinkStatus', 'omnilinkObservations', 'omnilinkAnalystVerdict'],
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

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.incidentNumber || !formData.incidentDate || !formData.locationType) {
      toast.error("Campos obrigatórios", {
        description: "Por favor, preencha todos os campos obrigatórios da seção 'Ocorrência'.",
      });
      return;
    }

    onSave(formData);
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

  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case "identification":
        return (
          <IncidentIdentificationSection
            formData={formData}
            handleInputChange={handleInputChange}
            isIncidentNumberLoading={false}
          />
        );
      case "vehicle":
        return (
          <VehicleDriverSection
            formData={formData}
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
            formData={formData}
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
            formData={formData}
            handleInputChange={(field, value) => handleInputChange(field as any, value)}
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
      <div className="sticky top-0 z-50 bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600/50 backdrop-blur-xl">
        <div className="container flex h-20 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/10 rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Nova Ocorrência</h1>
                <p className="text-slate-300 text-sm">Registrar nova ocorrência no sistema</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={generatePDF} 
              variant="outline" 
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl"
            >
              <Download className="mr-2 h-4 w-4" />
              Gerar PDF
            </Button>
            <Button 
              onClick={handleSave} 
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg"
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-7xl">
          {isMobile ? (
            // Mobile Accordion View
            <div className="space-y-4">
              {sections.map((section) => {
                const completion = calculateSectionCompletion(formData, section.id as keyof typeof sectionFields | 'evaluation');
                const IconComponent = section.icon;
                
                return (
                  <Card key={section.id} className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-500/20">
                            <IconComponent className="h-5 w-5 text-blue-400" />
                          </div>
                          <div>
                            <CardTitle className="text-white text-lg">{section.label}</CardTitle>
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
              <div className="bg-slate-800/30 rounded-2xl p-2 backdrop-blur-xl border border-slate-700/50">
                <div className="flex overflow-x-auto scrollbar-hide gap-2">
                  {sections.map((section) => {
                    const completion = calculateSectionCompletion(formData, section.id as keyof typeof sectionFields | 'evaluation');
                    const isActive = activeTab === section.id;
                    const IconComponent = section.icon;
                    
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveTab(section.id)}
                        className={cn(
                          "flex-shrink-0 flex items-center gap-3 px-6 py-4 rounded-xl text-sm font-medium transition-all duration-300",
                          "hover:bg-slate-700/50",
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
              <Card className="bg-slate-800/40 border-slate-700/50 backdrop-blur-xl rounded-2xl overflow-hidden">
                <CardContent className="p-8">
                  <ScrollArea className="h-[calc(100vh-300px)]">
                    <div className="pr-4">
                      {renderSectionContent(activeTab)}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={isNewDriverDialogOpen} onOpenChange={setIsNewDriverDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Cadastrar Novo Motorista</DialogTitle>
            <DialogDescription className="text-slate-300">
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
        <DialogContent className="sm:max-w-[500px] bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Cadastrar Novo Veículo</DialogTitle>
            <DialogDescription className="text-slate-300">
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