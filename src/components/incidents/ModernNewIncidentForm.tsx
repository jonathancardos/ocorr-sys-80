import { useState, useEffect, useRef, useCallback } from "react"; // Added useCallback
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, FileText, Save, X, Upload, Download, CheckCircle, XCircle, AlertTriangle, Truck, User, Shield, MapPin, Package, AlertCircleIcon, Paperclip, Menu, MoreVertical, UserPlus, Plus, Car, Loader2 } from "lucide-react";
import { toast } from 'sonner'; // Importar toast do sonner
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas'; // Corrected import
import { cn } from "@/lib/utils";
import { format, isPast, differenceInMonths, differenceInDays, startOfDay, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import React from "react";
import { createRoot } from 'react-dom/client';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tables } from "@/integrations/supabase/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// Import modular sections
import { IncidentIdentificationSection } from './IncidentIdentificationSection';
import { VehicleDriverSection } from './VehicleDriverSection';
import { OmnilinkReportSection } from './OmnilinkReportSection';
import { TrackingReportSection } from './TrackingReportSection';
import { DriverEvaluationSection } from './DriverEvaluationSection';
import { CargoEvaluationSection } from './CargoEvaluationSection';
import { RiskMonitoringSection } from './RiskMonitoringSection';
import { FinalReportSection } from './FinalReportSection';
import { IncidentAttachmentsSection, IncidentAttachmentsFormData, AttachmentItem } from './IncidentAttachmentsSection'; // Import the new interface and AttachmentItem

// Import the new PDF layout component
import { IncidentReportPDFLayout } from './IncidentReportPDFLayout';
// Import the new driver form component
import NewDriverForm from '@/components/drivers/NewDriverForm';
// Import the new vehicle form component
import NewVehicleForm from '@/components/vehicles/NewVehicleForm';
// Import the new ReportCustomizationTab component
import ReportCustomizationTab, { PdfConfig } from './ReportCustomizationTab';

// Import Supabase Storage utilities
import { uploadFile, uploadFiles, deleteFile } from '@/integrations/supabase/storage';

// Import from new driver-utils
import { getCnhStatus as getCnhStatusUtil, CnhStatus, calculateOmnilinkScoreExpiry, calculateOmnilinkScoreStatus, getDetailedOmnilinkStatus } from '@/lib/driver-utils';


interface NewIncidentFormProps {
  onClose: () => void;
  onSave: (data: any) => void;
}

const sections = [
  { id: "identification", label: "Ocorrência" },
  { id: "vehicle", label: "Veículo/Condutor" },
  { id: "omnilink", label: "Omnilink" },
  { id: "tracking", label: "Rastreamento" },
  { id: "evaluation", label: "Apuração" },
  { id: "cargo", label: "Carga" },
  { id: "risk", label: "Risco" },
  { id: "final", label: "Laudo Final" },
  { id: "attachments", label: "Anexos" },
  { id: "pdf-customization", label: "Visualizar PDF" }, // New section for PDF customization
];

// Helper function to get CNH status - NOW IMPORTED FROM UTILS
export const getCnhStatus = getCnhStatusUtil;

import { Vehicle } from '@/types/vehicles';

type Driver = Tables<'drivers'>;
type Incident = Tables<'incidents'>; // Define type for incident

export const NewIncidentForm = ({ onClose, onSave }: NewIncidentFormProps) => {
  // Removido: const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isNewDriverDialogOpen, setIsNewDriverDialogOpen] = useState(false); // State for new driver dialog
  const [isNewVehicleDialogOpen, setIsNewVehicleDialogOpen] = useState(false); // State for new vehicle dialog
  const [pdfConfig, setPdfConfig] = useState<PdfConfig | null>(null); // State to hold PDF configuration

  const [formData, setFormData] = useState({
    // Identificação da Ocorrência
    incidentNumber: "",
    incidentDate: "",
    incidentTime: "",
    location: "", // General location field, might be used for both types
    locationType: "" as "establishment" | "public_road" | "", // New field for location type
    establishmentName: "", // New field for establishment
    establishmentAddress: "", // New field for establishment
    establishmentCircumstances: "", // New field for establishment
    hasDock: "" as "yes" | "no" | "",
    hasParking: "" as "yes" | "no" | "",
    roadDetailedLocation: "", // New field for public road
    roadSuspicions: "", // New field for public road
    roadTrafficConditions: "", // New field for public road
    roadWitnesses: "", // New field for public road
    boNumber: "",
    boDate: "",
    sameDay: "" as "yes" | "no" | "",
    responsible: "",
    
    // Dados do Veículo e Motorista
    vehicleId: "" as string | null, // New field to store selected vehicle's ID
    vehiclePlate: "", // Will be populated from selected vehicle
    vehicleModel: "", // Will be populated from selected vehicle
    vehicleTechnology: [] as string[], // New field for vehicle technology
    vehiclePriority: null as number | null, // NEW FIELD
    vehicleBlockerInstalled: null as boolean | null, // NEW FIELD
    driverId: "" as string | null, // New field to store selected driver's ID
    driverName: "", // Will be populated from selected driver
    driverCpf: "", // Will be populated from selected driver
    driverPhone: "", // Will be populated from selected driver
    driverLicense: "", // Will be populated from selected driver
    licenseExpiry: "", // Will be populated from selected driver
    omnilinkScoreRegistrationDate: "" as string | null, // NEW: Omnilink registration date
    omnilinkScoreExpiryDate: "" as string | null, // NEW: Omnilink expiry date
    omnilinkScoreStatus: "" as string | null, // NEW: Omnilink status (em_dia/inapto)
    
    // Laudo Omnilink
    omnilinkStatus: "" as "yes" | "no" | "", // Changed to string
    omnilinkObservations: "",
    omnilinkAnalystVerdict: "", // New field
    
    // Laudo Siga+ (Rastreamento)
    signalLoss: "" as "yes" | "no" | "",
    signalLossTime: "",
    unauthorizedStop: "" as "yes" | "no" | "",
    unauthorizedStopLocation: "",
    prolongedStop: "" as "yes" | "no" | "",
    prolongedStopTime: "",
    prolongedStopJustification: "",
    
    // Apuração do Condutor - Perguntas com Pesos
    vehicleLocked: "" as "yes" | "no" | "", // Changed to string
    driverNearVehicle: "" as "yes" | "no" | "", // Changed to string
    authorizedParking: "" as "yes" | "no" | "", // Changed to string
    leftVehicleTime: "" as "yes" | "no" | "", // Changed to string
    vehicleRunning: "" as "yes" | "no" | "", // Changed to string
    keyToThird: "" as "yes" | "no" | "", // Changed to string
    doorsOpen: "" as "yes" | "no" | "", // Changed to string
    followedInstructions: "" as "yes" | "no" | "", // Changed to string
    reportedAnomalies: "" as "yes" | "no" | "", // Changed to string
    contradictions: "" as "yes" | "no" | "", // Changed to string
    stoppedInSafePlace: "" as "yes" | "no" | "",
    activatedPanicButton: "" as "yes" | "no" | "",
    driverScore: 0,
    riskLevel: "",
    
    // Apuração da Carga
    totalCargoValue: "",
    stolenCargoValue: "",
    cargoObservations: "",
    
    // Monitoramento de Risco
    riskObservations: "",
    
    // Laudo Final
    omnilinkSummary: "",
    driverSummary: "",
    trackingSummary: "",
    cargoSummary: "",
    riskSummary: "",
    finalConclusion: "",
    recommendations: "",
    analystName: "",
    
    // Anexos (agora armazenarão URLs públicas)
    boFiles: [] as AttachmentItem[],
    sapScreenshots: [] as AttachmentItem[],
    riskReports: [] as AttachmentItem[],
    omnilinkPhoto: null as AttachmentItem | null,
  });

  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: boolean }>({
    boFiles: false,
    sapScreenshots: false,
    riskReports: false,
    omnilinkPhoto: false,
  });

  console.log('NewIncidentForm: Re-rendering. Current formData.omnilinkPhoto:', formData.omnilinkPhoto); // ADDED LOG

  const sectionFields = {
    identification: [
      'incidentNumber', 'incidentDate', 'incidentTime', 'location', 'boNumber', 'boDate', 'sameDay', 'responsible',
      'locationType',
    ],
    vehicle: ['vehicleId', 'vehiclePlate', 'vehicleModel', 'vehicleTechnology', 'vehiclePriority', 'vehicleBlockerInstalled', 'driverId', 'driverName', 'driverCpf', 'driverPhone', 'driverLicense', 'licenseExpiry', 'omnilinkScoreRegistrationDate', 'omnilinkScoreExpiryDate', 'omnilinkScoreStatus'], // UPDATED
    omnilink: ['omnilinkStatus', 'omnilinkObservations', 'omnilinkAnalystVerdict'],
    tracking: ['signalLoss', 'unauthorizedStop', 'prolongedStop'],
    cargo: ['totalCargoValue', 'stolenCargoValue', 'cargoObservations'],
    risk: ['riskObservations'],
    final: ['omnilinkSummary', 'driverSummary', 'trackingSummary', 'cargoSummary', 'riskSummary', 'finalConclusion', 'recommendations', 'analystName'],
    attachments: ['boFiles', 'sapScreenshots', 'riskReports', 'omnilinkPhoto'],
    "pdf-customization": [],
  };

  const calculateSectionCompletion = (currentFormData: typeof formData, sectionId: keyof typeof sectionFields | 'evaluation'): number => {
    let filledCount = 0;
    let totalCount = 0;

    // Handle 'evaluation' section dynamically
    if (sectionId === 'evaluation') {
      const evaluationFields: (keyof typeof currentFormData)[] = [
        'followedInstructions', 'reportedAnomalies', 'contradictions',
        'keyToThird', 'doorsOpen', 'leftVehicleTime',
      ];
      
      if (currentFormData.locationType === "establishment") {
        evaluationFields.push('vehicleLocked', 'driverNearVehicle', 'authorizedParking');
      } else if (currentFormData.locationType === "public_road") {
        evaluationFields.push('vehicleRunning', 'stoppedInSafePlace', 'activatedPanicButton');
      }

      evaluationFields.forEach(field => {
        totalCount++;
        const value = currentFormData[field];
        if (typeof value === 'string' && value.trim() !== '') filledCount++;
        else if (value !== null && value !== undefined) filledCount++;
      });

      // CNH expiry is always part of the score, so it should be part of totalCount for evaluation
      totalCount++; // For licenseExpiry check
      if (currentFormData.licenseExpiry && currentFormData.licenseExpiry.trim() !== '') filledCount++; // Assuming licenseExpiry is always filled if a driver is selected

      if (totalCount === 0) return 100;
      return Math.round((filledCount / totalCount) * 100);
    }

    // Existing logic for other sections
    const fields = sectionFields[sectionId as keyof typeof sectionFields]; // Cast to correct type

    fields.forEach(field => {
      totalCount++;
      const value = currentFormData[field as keyof typeof currentFormData];

      if (field.endsWith('Files') || field.endsWith('Photo')) { // Handle array of {name, url} or single {name, url}
        if (Array.isArray(value)) {
          if (value.length > 0) filledCount++;
        } else if (value && typeof value === 'object' && 'url' in value) { // Single photo object
          if (value.url) filledCount++;
        }
      } else if (Array.isArray(value)) { // Handle array types like technology
        if (value.length > 0) filledCount++;
      } else if (typeof value === 'string') {
        if (value.trim() !== '') filledCount++;
      } else if (value !== null && value !== undefined) { // For non-string types like numbers, booleans
        filledCount++;
      }
    });

    // Handle conditional fields for 'identification' section
    if (sectionId === 'identification') {
      if (currentFormData.locationType === "establishment") {
        totalCount += 5; // establishmentName, establishmentAddress, establishmentCircumstances, hasDock, hasParking
        if (currentFormData.establishmentName.trim() !== '') filledCount++;
        if (currentFormData.establishmentAddress.trim() !== '') filledCount++;
        if (currentFormData.establishmentCircumstances.trim() !== '') filledCount++;
        if (currentFormData.hasDock.trim() !== '') filledCount++;
        if (currentFormData.hasParking.trim() !== '') filledCount++;
      } else if (currentFormData.locationType === "public_road") {
        totalCount += 4; // roadDetailedLocation, roadSuspicions, roadTrafficConditions, roadWitnesses
        if (currentFormData.roadDetailedLocation.trim() !== '') filledCount++;
        if (currentFormData.roadSuspicions.trim() !== '') filledCount++;
        if (currentFormData.roadTrafficConditions.trim() !== '') filledCount++;
        if (currentFormData.roadWitnesses.trim() !== '') filledCount++;
      }
    }
    // Handle conditional fields for 'tracking' section
    if (sectionId === 'tracking') {
      if (currentFormData.signalLoss === "yes") {
        totalCount++;
        if (currentFormData.signalLossTime.trim() !== '') filledCount++;
      }
      if (currentFormData.unauthorizedStop === "yes") {
        totalCount++;
        if (currentFormData.unauthorizedStopLocation.trim() !== '') filledCount++;
      }
      if (currentFormData.prolongedStop === "yes") {
        totalCount += 2; // prolongedStopTime and prolongedStopJustification
        if (currentFormData.prolongedStopTime.trim() !== '') filledCount++;
        if (currentFormData.prolongedStopJustification.trim() !== '') filledCount++;
      }
    }

    if (totalCount === 0) return 100; // Avoid division by zero if a section has no fields
    return Math.round((filledCount / totalCount) * 100);
  };

  // Fetch the next incident number
  const { data: nextIncidentNumber, isLoading: isIncidentNumberLoading } = useQuery<string, Error>({
    queryKey: ['nextIncidentNumber'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('incident_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error fetching last incident number:', error);
        return 'OC0001'; // Fallback
      }

      if (data && (data as Incident).incident_number) { // Explicitly cast data to Incident
        const lastNumberMatch = (data as Incident).incident_number!.match(/OC(\d+)/);
        if (lastNumberMatch) {
          const lastNum = parseInt(lastNumberMatch[1], 10);
          const nextNum = lastNum + 1;
          return `OC${String(nextNum).padStart(4, '0')}`;
        }
      }
      return 'OC0001';
    },
    staleTime: Infinity, // Incident numbers don't change frequently
  });

  // Fetch drivers for the select input
  const { data: drivers, isLoading: isLoadingDrivers } = useQuery<Driver[], Error>({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('drivers').select('*').order('full_name', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch vehicles for the select input
  const { data: vehicles, isLoading: isLoadingVehicles } = useQuery<Vehicle[], Error>({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vehicles').select('*').order('plate', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const now = new Date();
    const currentDate = format(now, 'yyyy-MM-dd', { locale: ptBR });
    const currentTime = format(now, 'HH:mm', { locale: ptBR });

    setFormData(prev => ({
      ...prev,
      incidentDate: currentDate,
      incidentTime: currentTime,
      incidentNumber: nextIncidentNumber || 'OC0001', // Use fetched number or default
    }));
  }, [nextIncidentNumber]); // Re-run when nextIncidentNumber is fetched

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Calcular pontuação do condutor se uma pergunta foi respondida
      if ([
        'vehicleLocked', 'driverNearVehicle', 'authorizedParking', 'leftVehicleTime',
        'vehicleRunning', 'keyToThird', 'doorsOpen', 'followedInstructions',
        'reportedAnomalies', 'contradictions', 'licenseExpiry', // Include licenseExpiry here
        'stoppedInSafePlace', 'activatedPanicButton' // New fields
      ].includes(field) || field === 'locationType') { // Recalculate if locationType changes
        const score = calculateDriverScore(newData);
        newData.driverScore = score;
        newData.riskLevel = getRiskLevel(score);
      }
      
      return newData;
    });
  };

  const handleFileUpload = useCallback(async (field: keyof IncidentAttachmentsFormData, files: FileList | File | null) => {
    if (!files || (files instanceof FileList && files.length === 0)) {
      setFormData(prev => ({ ...prev, [field]: field === 'omnilinkPhoto' ? null : [] }));
      console.log('NewIncidentForm: handleFileUpload - Cleared/No files for', field); // ADDED LOG
      return;
    }

    setUploadingFiles(prev => ({ ...prev, [field]: true }));
    const incidentNum = formData.incidentNumber || 'temp'; // Use temp if incident number not yet generated
    const pathPrefix = `incidents/${incidentNum}/${field}/`;

    try {
      if (field === 'omnilinkPhoto') {
        const file = files as File;
        const url = await uploadFile(file, `${pathPrefix}${file.name}`);
        setFormData(prev => ({ ...prev, [field]: { name: file.name, url } }));
        console.log('NewIncidentForm: handleFileUpload - omnilinkPhoto updated in state:', { name: file.name, url }); // ADDED LOG
        toast.success("Upload concluído", { description: `Foto Omnilink carregada.` });
      } else {
        const fileList = files as FileList;
        const urls = await uploadFiles(fileList, pathPrefix);
        const newAttachments = Array.from(fileList).map((file, index) => ({
          name: file.name,
          url: urls[index]
        }));
        setFormData(prev => ({ ...prev, [field]: [...(prev[field] as AttachmentItem[]), ...newAttachments] })); // Append new files
        console.log('NewIncidentForm: handleFileUpload - Multiple files updated in state for', field, newAttachments); // ADDED LOG
        toast.success("Upload concluído", { description: `${urls.length} arquivo(s) carregado(s).` });
      }
    } catch (error: any) {
      console.error('Erro durante o upload:', error);
      toast.error("Erro no upload", { description: error.message || `Falha ao carregar arquivos.` });
    } finally {
      setUploadingFiles(prev => ({ ...prev, [field]: false }));
    }
  }, [formData.incidentNumber])); // Dependency on formData.incidentNumber

  const handleRemoveAttachment = useCallback(async (field: keyof IncidentAttachmentsFormData, index: number) => {
    const attachmentToRemove = Array.isArray(formData[field]) ? (formData[field] as AttachmentItem[])[index] : formData[field] as AttachmentItem | null;

    if (!attachmentToRemove || !attachmentToRemove.url) {
      toast.error("Erro", { description: "Anexo não encontrado para remoção." });
      return;
    }

    // Extract path from URL
    const urlParts = attachmentToRemove.url.split('/');
    const bucketIndex = urlParts.indexOf('incident-attachments');
    const pathInStorage = urlParts.slice(bucketIndex + 1).join('/');

    try {
      const success = await deleteFile(pathInStorage);
      if (success) {
        setFormData(prev => {
          let newAttachments: typeof prev['boFiles'] | typeof prev['omnilinkPhoto'];

          if (field === 'omnilinkPhoto') {
            newAttachments = null; // Single file, set to null
          } else {
            // For array fields, filter the array
            newAttachments = (prev[field] as AttachmentItem[]).filter((_, i) => i !== index);
          }
          return { ...prev, [field]: newAttachments };
        });
        toast.success("Anexo removido", { description: `${attachmentToRemove.name} foi removido.` });
      } else {
        toast.error("Erro", { description: `Falha ao remover ${attachmentToRemove.name} do storage.` });
      }
    } catch (error: any) {
      console.error('Erro ao remover anexo:', error);
      toast.error("Erro", { description: error.message || `Falha ao remover anexo.` });
    }
  }, [formData]); // Dependency on formData

  const handleDriverSelect = (driverId: string) => {
    const selectedDriver = drivers?.find(d => d.id === driverId);
    if (selectedDriver) {
      setFormData(prev => {
        const newData = {
          ...prev,
          driverId: selectedDriver.id,
          driverName: selectedDriver.full_name,
          driverCpf: selectedDriver.cpf,
          driverPhone: selectedDriver.phone || '',
          driverLicense: selectedDriver.cnh || '',
          licenseExpiry: selectedDriver.cnh_expiry || '',
          omnilinkScoreRegistrationDate: selectedDriver.omnilink_score_registration_date || '', // NEW
          omnilinkScoreExpiryDate: selectedDriver.omnilink_score_expiry_date || '', // NEW
          omnilinkScoreStatus: selectedDriver.omnilink_score_status || '', // NEW
        };
        // Recalculate score and risk level after populating driver data
        const score = calculateDriverScore(newData);
        newData.driverScore = score;
        newData.riskLevel = getRiskLevel(score);
        return newData;
      });
    } else {
      // Clear driver fields if no driver is selected or if "Selecionar Motorista" is chosen
      setFormData(prev => ({
        ...prev,
        driverId: null,
        driverName: '',
        driverCpf: '',
        driverPhone: '',
        driverLicense: '',
        licenseExpiry: '',
        omnilinkScoreRegistrationDate: null, // NEW
        omnilinkScoreExpiryDate: null, // NEW
        omnilinkScoreStatus: null, // NEW
        driverScore: calculateDriverScore({ ...prev, driverId: null, driverName: '', driverCpf: '', driverPhone: '', driverLicense: '', licenseExpiry: '', omnilinkScoreRegistrationDate: null }), // Recalculate score
        riskLevel: getRiskLevel(calculateDriverScore({ ...prev, driverId: null, driverName: '', driverCpf: '', driverPhone: '', driverLicense: '', licenseExpiry: '', omnilinkScoreRegistrationDate: null })), // Recalculate risk
      }));
    }
  };

  const handleNewDriverCreated = (newDriverId: string) => {
    // After a new driver is created, automatically select it in the dropdown
    handleDriverSelect(newDriverId);
    setIsNewDriverDialogOpen(false); // Close the dialog
  };

  const handleVehicleSelect = (vehicleId: string) => {
    const selectedVehicle = vehicles?.find(v => v.id === vehicleId);
    if (selectedVehicle) {
      setFormData(prev => ({
        ...prev,
        vehicleId: selectedVehicle.id,
        vehiclePlate: selectedVehicle.plate,
        vehicleModel: selectedVehicle.model,
        vehicleTechnology: selectedVehicle.technology || [], // Populate technology
        vehiclePriority: selectedVehicle.priority || null, // NEW FIELD
        vehicleBlockerInstalled: selectedVehicle.blocker_installed || null, // NEW FIELD
      }));
    } else {
      // Clear vehicle fields if no vehicle is selected or if "Selecionar Veículo" is chosen
      setFormData(prev => ({
        ...prev,
        vehicleId: null,
        vehiclePlate: '',
        vehicleModel: '',
        vehicleTechnology: [], // Clear technology
        vehiclePriority: null, // NEW FIELD
        vehicleBlockerInstalled: null, // NEW FIELD
      }));
    }
  };

  const handleNewVehicleCreated = (newVehicleId: string) => {
    // After a new vehicle is created, automatically select it in the dropdown
    handleVehicleSelect(newVehicleId);
    setIsNewVehicleDialogOpen(false); // Close the dialog
  };

  const calculateDriverScore = (data: any) => {
    let score = 0;
    
    // Common questions (always apply)
    if (data.followedInstructions === "no") score += 4;
    if (data.reportedAnomalies === "no") score += 2;
    if (data.contradictions === "yes") score += 4;
    if (data.keyToThird === "yes") score += 4;
    if (data.doorsOpen === "yes") score += 2;
    if (data.leftVehicleTime === "yes") score += 2;

    // Conditional questions based on locationType
    if (data.locationType === "establishment") {
      if (data.vehicleLocked === "no") score += 1;
      if (data.driverNearVehicle === "no") score += 1;
      if (data.authorizedParking === "no") score += 2;
    } else if (data.locationType === "public_road") {
      if (data.vehicleRunning === "yes") score += 3;
      if (data.stoppedInSafePlace === "no") score += 2; // New question
      if (data.activatedPanicButton === "no") score += 3; // New question
    }
    
    // CNH vencida (peso 10) - always applies if driver selected
    const cnhStatus = getCnhStatus(data.licenseExpiry);
    if (cnhStatus.status === 'expired') {
      score += 10;
    }

    // Omnilink vencido (peso 10) - always applies if driver selected and registration date exists
    const omnilinkDetailedStatus = getDetailedOmnilinkStatus(data.omnilinkScoreRegistrationDate); // Use the correct field
    if (omnilinkDetailedStatus.status === 'vencido') { // Check for 'vencido' status
      score += 10;
    }
    
    return score;
  };

  const getRiskLevel = (score: number) => {
    if (score >= 20) return "Gravíssimo";
    if (score >= 10) return "Grave";
    if (score >= 4) return "Moderado";
    return "Baixo";
  };

  const generatePDF = async (config: PdfConfig | null = null) => {
    try {
      console.log("generatePDF: Starting PDF generation.");
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px'; // Render off-screen
      tempDiv.style.width = '210mm'; // A4 width
      tempDiv.style.minHeight = '297mm'; // A4 height
      document.body.appendChild(tempDiv);
      console.log("generatePDF: Temporary div created and appended.");

      const root = createRoot(tempDiv);
      let resolveRenderPromise: () => void = () => {};
      const renderPromise = new Promise<void>(resolve => {
        resolveRenderPromise = resolve;
      });

      root.render(
        <IncidentReportPDFLayout 
          formData={formData} 
          boAttachments={formData.boFiles}
          sapScreenshotAttachments={formData.sapScreenshots}
          riskReportAttachments={formData.riskReports}
          omnilinkPhotoAttachment={formData.omnilinkPhoto ? [formData.omnilinkPhoto] : []}
          pdfConfig={config || pdfConfig}
          cnhStatus={getCnhStatus(formData.licenseExpiry)}
          omnilinkDetailedStatus={getDetailedOmnilinkStatus(formData.omnilinkScoreRegistrationDate)} // NEW
          onRenderComplete={resolveRenderPromise}
        />
      );
      console.log("generatePDF: IncidentReportPDFLayout rendered into temporary div.");

      await renderPromise; // Wait for the component to signal completion
      console.log("generatePDF: IncidentReportPDFLayout signaled render completion.");

      // Wait a little longer for any async image loading within the layout
      await new Promise(resolve => setTimeout(resolve, 200)); // Reduced from 500ms, might be enough after render complete signal
      console.log("generatePDF: Short additional delay completed.");

      const canvas = await html2canvas(tempDiv, {
        scale: 2, // Increase scale for better quality
        useCORS: true, // Important for images from external sources if any
      });
      console.log("generatePDF: html2canvas captured content.");

      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`laudo-ocorrencia-${formData.incidentNumber || 'novo'}.pdf`);
      
      toast.success("PDF gerado com sucesso!", {
        description: "O arquivo foi baixado para seu computador.",
      });

      // Clean up
      root.unmount();
      document.body.removeChild(tempDiv);
      // No need to revokeObjectURL for public URLs
      console.log("generatePDF: Cleanup complete.");

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar PDF", {
        description: "Ocorreu um erro ao gerar o arquivo PDF. Verifique o console para detalhes.",
      });
    }
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

  const cnhStatus = getCnhStatus(formData.licenseExpiry);

  // Helper to render each section's content
  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case "identification":
        return (
          <IncidentIdentificationSection
            formData={formData}
            handleInputChange={handleInputChange}
            isIncidentNumberLoading={isIncidentNumberLoading}
          />
        );
      case "vehicle":
        return (
          <VehicleDriverSection
            formData={formData}
            handleInputChange={handleInputChange}
            isLoadingDrivers={isLoadingDrivers}
            drivers={drivers}
            handleDriverSelect={handleDriverSelect}
            setIsNewDriverDialogOpen={setIsNewDriverDialogOpen}
            isLoadingVehicles={isLoadingVehicles}
            vehicles={vehicles}
            handleVehicleSelect={handleVehicleSelect}
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
        console.log('NewIncidentForm: Type of handleFileUpload before passing:', typeof handleFileUpload); // ADDED LOG
        return (
          <IncidentAttachmentsSection
            boFiles={formData.boFiles}
            sapScreenshots={formData.sapScreenshots}
            riskReports={formData.riskReports}
            omnilinkPhoto={formData.omnilinkPhoto}
            handleFileUpload={handleFileUpload} 
            uploadingFiles={uploadingFiles} // Pass uploading state
            handleRemoveAttachment={handleRemoveAttachment} // Pass remove function
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
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Modern Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Nova Ocorrência</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">Registrar nova ocorrência no sistema</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Desktop Buttons */}
            <Button variant="ghost" onClick={onClose} size="sm" className="hidden sm:flex">
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={() => generatePDF()} variant="outline" size="sm" className="hidden sm:flex">
              <Download className="mr-2 h-4 w-4" />
              Gerar PDF
            </Button>
            <Button onClick={handleSave} size="sm" className="hidden sm:flex">
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>

            {/* Mobile Dropdown Menu for Actions */}
            {isMobile && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-primary">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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

      <div className="flex-1 bg-gradient-to-br from-background to-muted/20 p-4 sm:p-8">
        <div className="w-full space-y-8" id="incident-form"> {/* Removed mx-auto and max-w-7xl */}
          {isMobile ? (
            // Mobile Accordion View
            <Accordion type="single" collapsible className="w-full space-y-4">
              {sections.map((section) => {
                const completion = calculateSectionCompletion(formData, section.id as keyof typeof sectionFields | 'evaluation');
                const IconComponent = FileText; // Default icon, replace with actual icons if available
                
                return (
                  <AccordionItem 
                    key={section.id} 
                    value={section.id} 
                    className="border-none bg-card/20 border-border/50 backdrop-blur-md shadow-card hover:shadow-elevated transition-shadow rounded-2xl"
                  >
                    <AccordionTrigger className="px-6 py-4 text-lg font-semibold text-foreground hover:no-underline">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-white text-lg">{section.label}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={completion} className="w-20 h-2" />
                            <span className="text-xs text-slate-400">{completion}%</span>
                          </div>
                        </div></AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 pt-2">
                      {renderSectionContent(section.id)}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
            // Desktop Tabs View
            <Tabs defaultValue="identification" className="w-full">
              <div className="border-b mb-8">
                <TabsList className="flex w-full h-auto px-4 sm:px-8 bg-card/20 backdrop-blur-sm border-b border-border/50 rounded-t-lg overflow-x-auto custom-scrollbar flex-nowrap shadow-sm gap-x-4"> {/* Adjusted transparency */}
                  {sections.map((section) => (
                    <TabsTrigger
                      key={section.id}
                      value={section.id}
                      className="flex-shrink-0 whitespace-nowrap text-sm font-medium px-6 py-3 transition-all duration-200
                                 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md
                                 data-[state=active]:border-b-2 data-[state=active]:border-primary-foreground
                                 hover:bg-muted/50 hover:text-foreground rounded-t-md"
                    >
                      {section.label} ({calculateSectionCompletion(formData, section.id as keyof typeof sectionFields | 'evaluation')}%)
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {sections.map((section) => (
                <TabsContent key={section.id} value={section.id} className="space-y-8">
                  <ScrollArea className="h-[calc(100vh-300px)] p-8 bg-card/20 border-border/50 backdrop-blur-xl rounded-2xl overflow-hidden">
                    <div className="pr-4">
                      {renderSectionContent(section.id)}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </div>

      {/* New Driver Dialog */}
      <Dialog open={isNewDriverDialogOpen} onOpenChange={setIsNewDriverDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card/20 backdrop-blur-md border border-border/50"> {/* Adjusted transparency */}
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Motorista</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Preencha os dados para adicionar um novo motorista ao sistema.
            </DialogDescription>
          </DialogHeader>
          <NewDriverForm 
            onDriverCreated={handleNewDriverCreated} 
            onClose={() => setIsNewDriverDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* New Vehicle Dialog */}
      <Dialog open={isNewVehicleDialogOpen} onOpenChange={setIsNewVehicleDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card/20 backdrop-blur-md border border-border/50"> {/* Adjusted transparency */}
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Veículo</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Preencha os dados para adicionar um novo veículo ao sistema.
            </DialogDescription>
          </DialogHeader>
          <NewVehicleForm 
            onVehicleCreated={handleNewVehicleCreated} 
            onClose={() => setIsNewVehicleDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};