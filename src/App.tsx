import { Toaster as Sonner, toast } from "sonner"; // Importar Sonner diretamente
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, useParams, useOutletContext } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Index from "./pages/Index"; // Index will now be a layout component
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { SettingsPage } from "./pages/SettingsPage";
import UserManagement from "./components/admin/UserManagement";
import DriverManagement from "./components/admin/DriverManagement";
import { VehicleManagement } from "./components/admin/VehicleManagement";
import { Dashboard } from "./components/dashboard/Dashboard"; // Import Dashboard
import { NewIncidentForm as ModernNewIncidentForm } from "./components/incidents/ModernNewIncidentForm"; // Import NewIncidentForm
import { IncidentHistory } from "./pages/IncidentHistory"; // Import IncidentHistory
import { DriverOmnilinkStatusDetails } from "./pages/DriverOmnilinkStatusDetails"; // Import new details page
import { ReportsPage } from "./pages/ReportsPage"; // NEW: Import ReportsPage
import { BarChart3 } from "lucide-react"; // Import BarChart3
import React, { useState, useEffect } from 'react';
import OcorrenciasV2Page from "./pages/OcorrenciasV2Page"; // Import the new component
// REMOVIDO: import AnimatedStars from "./components/AnimatedStars"; // REMOVIDO: Import AnimatedStars

const queryClient = new QueryClient();

// Component to handle initial tab selection for SettingsPage
const SettingsPageWrapper = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tab = queryParams.get('tab');

  return <SettingsPage />;
};

// New Wrapper component for ModernNewIncidentForm to handle draft loading
const NewIncidentFormWrapper = ({ onClose, setHasUnsavedChanges }: { onClose: () => void; setHasUnsavedChanges: (hasChanges: boolean) => void }) => {
  const { draftId } = useParams<{ draftId: string }>();
  const [initialDraftData, setInitialDraftData] = useState<any | undefined>(undefined);
  const { handleSaveIncident } = useOutletContext<{ handleSaveIncident: (formData: any, isDraft?: boolean) => void }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (draftId) {
      const storedDrafts = localStorage.getItem('incidentDrafts');
      if (storedDrafts) {
        const drafts = JSON.parse(storedDrafts);
        const foundDraft = drafts.find((d: any) => d.id === draftId);
        setInitialDraftData(foundDraft);
      }
    }
  }, [draftId]);

  const handleClose = () => {
    setHasUnsavedChanges(false);
    navigate('/'); // Navegação SPA sem recarregar a página
  };

  const handleCancelConfirm = () => {
    setHasUnsavedChanges(false);
    if (draftId) {
      setInitialDraftData(undefined); // Clear draft data if canceling a draft
    }
    navigate('/');
  };

  return <ModernNewIncidentForm onClose={handleClose} onSave={handleSaveIncident} initialData={initialDraftData} setHasUnsavedChanges={setHasUnsavedChanges} onCancelConfirm={handleCancelConfirm} />;
};

const App = () => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // Novo estado

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          {/* Sonner para notificações modernas */}
          <Sonner 
            richColors // Cores ricas para diferentes tipos de toast (success, error, warning)
            closeButton // Adiciona um botão para fechar manualmente
            duration={5000} // Esconde automaticamente após 5 segundos
            position="top-right" // Posição no canto superior direito
            className="toast-container" // Classe para estilização adicional se necessário
          />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            {/* Animated Stars Background - REMOVIDO DAQUI */}
            
            <Routes>
              <Route path="/login" element={<Login />} />
              
              {/* Index as a layout component for all protected routes */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Index hasUnsavedChanges={hasUnsavedChanges} setHasUnsavedChanges={setHasUnsavedChanges} /> {/* Index will render Header, Sidebar, and Outlet */}
                  </ProtectedRoute>
                } 
              >
                {/* Nested routes */}
                <Route index element={<Dashboard />} /> {/* Default route for / */}
                <Route path="new-incident" element={<NewIncidentFormWrapper onClose={() => {}} setHasUnsavedChanges={setHasUnsavedChanges} />} />
                <Route path="new-incident/:draftId" element={<NewIncidentFormWrapper onClose={() => {}} setHasUnsavedChanges={setHasUnsavedChanges} />} />
                <Route path="history" element={<IncidentHistory />} />
                <Route path="reports" element={<ReportsPage />} /> {/* UPDATED: Use ReportsPage */}
                <Route path="users" element={<UserManagement />} />
                <Route path="drivers" element={<DriverManagement />} />
                <Route path="vehicles" element={<VehicleManagement />} />
                <Route path="settings" element={<SettingsPageWrapper />} />
                <Route path="settings/:tab" element={<SettingsPageWrapper />} />
                <Route path="driver-omnilink-status" element={<DriverOmnilinkStatusDetails />} /> {/* New route */}
                <Route path="ocorrencias-v2" element={<OcorrenciasV2Page />} /> {/* New route for OcorrenciasV2Page */}
              </Route>
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;