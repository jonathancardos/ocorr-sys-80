import { Toaster as Sonner } from "sonner"; // Importar Sonner diretamente
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
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
import { BarChart3 } from "lucide-react"; // Import BarChart3

const queryClient = new QueryClient();

// Component to handle initial tab selection for SettingsPage
const SettingsPageWrapper = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tab = queryParams.get('tab');

  return <SettingsPage />;
};

const App = () => (
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
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Index as a layout component for all protected routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Index /> {/* Index will render Header, Sidebar, and Outlet */}
                </ProtectedRoute>
              } 
            >
              {/* Nested routes */}
              <Route index element={<Dashboard onNewIncident={() => {}} />} /> {/* Default route for / */}
              <Route path="new-incident" element={<ModernNewIncidentForm onClose={() => {}} onSave={() => {}} />} />
              <Route path="history" element={<IncidentHistory />} />
              <Route path="reports" element={
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">Relatórios</h3>
                    <p className="text-muted-foreground">Em desenvolvimento...</p>
                  </div>
                </div>
              } />
              <Route path="users" element={<UserManagement />} />
              <Route path="drivers" element={<DriverManagement />} />
              <Route path="vehicles" element={<VehicleManagement />} />
              <Route path="settings" element={<SettingsPageWrapper />} />
              <Route path="settings/:tab" element={<SettingsPageWrapper />} />
            </Route>
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;