import React from 'react';
import { Vehicle } from '@/types/vehicles';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VehicleReportPDFLayoutProps {
  vehicles: Vehicle[];
  startDate?: Date;
  endDate?: Date;
  filterType: 'all' | 'has_workshop' | 'no_workshop' | 'double_blocker' | 'blocker_installed' | 'priority_1' | 'priority_2' | 'priority_3' | 'selected_plates';
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

  const generationDate = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR });

  return (
    <div className="p-6 bg-white text-gray-800" style={{ width: '210mm', minHeight: '297mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-700">Nome da Empresa</h1>
          <h2 className="text-xl font-semibold text-gray-700">Relatório de Veículos</h2>
          <p className="text-sm text-gray-500">Gerado em: {generationDate}</p>
        </div>

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
      <div className="text-center text-sm text-gray-500 mt-8">
        <p>Página 1 de X</p>
      </div>
    </div>
  );
};