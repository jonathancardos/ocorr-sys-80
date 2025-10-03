import React from 'react';
import { Vehicle } from '@/types/vehicles';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VehicleReportPDFLayoutProps {
  vehicles: Vehicle[];
  startDate?: Date;
  endDate?: Date;
  filterType: 'all' | 'has_workshop' | 'no_workshop';
  onRenderComplete?: () => void;
}

export const VehicleReportPDFLayout: React.FC<VehicleReportPDFLayoutProps> = ({
  vehicles,
  startDate,
  endDate,
  onRenderComplete,
}) => {
  React.useEffect(() => {
    if (onRenderComplete) {
      onRenderComplete();
    }
  }, [onRenderComplete]);

  return (
    <div className="p-6 bg-white text-gray-800" style={{ width: '210mm', minHeight: '297mm' }}>
      <h1 className="text-2xl font-bold mb-4 text-center">Relatório de Veículos</h1>
      <p className="text-center mb-6">
        {startDate && endDate
          ? `Período: ${format(startDate, 'dd/MM/yyyy', { locale: ptBR })} - ${format(endDate, 'dd/MM/yyyy', { locale: ptBR })}`
          : 'Todos os Períodos'}
      </p>

      {vehicles.length === 0 ? (
        <p className="text-center text-gray-600">Nenhum veículo encontrado para o período selecionado.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="border p-4 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-2">Placa: {vehicle.plate}</h2>
              <p><strong>Modelo:</strong> {vehicle.model}</p>
              <p><strong>Tecnologia:</strong> {vehicle.technology?.join(', ') || 'N/A'}</p>
              <p><strong>Tem Oficina:</strong> {vehicle.has_workshop ? 'Sim' : 'Não'}</p>
              <p><strong>Prioridade:</strong> {vehicle.priority || 'N/A'}</p>
              <p><strong>Bloqueador Instalado:</strong> {vehicle.blocker_installed ? 'Sim' : 'Não'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};