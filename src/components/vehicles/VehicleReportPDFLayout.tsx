import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Vehicle } from '@/types/vehicles';

interface VehicleReportPDFLayoutProps {
  vehicles: Vehicle[];
  filterType: 'all' | 'has_workshop' | 'no_workshop' | 'double_blocker' | 'blocker_installed' | 'priority_1' | 'priority_2' | 'priority_3';
  onRenderComplete?: () => void;
}

export const VehicleReportPDFLayout: React.FC<VehicleReportPDFLayoutProps> = ({
  vehicles,
  filterType,
  onRenderComplete,
}) => {
  React.useEffect(() => {
    if (onRenderComplete) {
      onRenderComplete();
    }
  }, [onRenderComplete]);

  const generationDate = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR });

  const getFilterLabel = (type: 'all' | 'has_workshop' | 'no_workshop' | 'double_blocker' | 'blocker_installed' | 'priority_1' | 'priority_2' | 'priority_3') => {
    switch (type) {
      case 'all': return 'Todos os Veículos';
      case 'has_workshop': return 'Veículos com Oficina';
      case 'no_workshop': return 'Veículos sem Oficina';
      case 'double_blocker': return 'Veículos com Bloqueador Duplo';
      case 'blocker_installed': return 'Veículos com Bloqueador Instalado';
      case 'priority_1': return 'Veículos Prioridade 1 (Alta)'; // UPDATED
      case 'priority_2': return 'Veículos Prioridade 2 (Média)'; // UPDATED
      case 'priority_3': return 'Veículos Prioridade 3 (Baixa)'; // UPDATED
      default: return 'N/A';
    }
  };

  return (
    <div className="font-sans text-gray-900 p-8 bg-white min-h-screen print:p-0 print:bg-white">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none border border-gray-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-cyan-600 text-white p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Relatório de Veículos Cadastrados</h1>
            <p className="text-sm opacity-90">Karne & Keijo - Sistema de Gestão</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">Filtro:</p>
            <p className="text-sm opacity-90">{getFilterLabel(filterType)}</p>
          </div>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-700 mb-4">
            Este relatório apresenta a lista de veículos cadastrados no sistema, filtrados por "{getFilterLabel(filterType)}".
          </p>

          <div className="mb-6">
            <h3 className="text-lg font-bold text-blue-800 mb-3">Resumo</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <p><span className="font-semibold">Total de Veículos:</span> {vehicles.length}</p>
              <p><span className="font-semibold">Data de Geração:</span> {generationDate}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Placa
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Modelo
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tecnologias
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tem Oficina?
                  </th>
                  {/* REMOVIDO: <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioridade (Convertido)
                  </th> */}
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioridade (Original)
                  </th>
                  {/* REMOVIDO: <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bloqueador (Convertido)
                  </th> */}
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bloqueador (Original)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {vehicle.plate}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                      {vehicle.model || 'N/A'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                      {(vehicle.technology && vehicle.technology.length > 0) ? vehicle.technology.join(', ') : 'N/A'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                      {vehicle.has_workshop === true ? 'Sim' : vehicle.has_workshop === false ? 'Não' : 'N/A'}
                    </td>
                    {/* REMOVIDO: <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                      {vehicle.priority !== null ? vehicle.priority : 'N/A'}
                    </td> */}
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                      {vehicle.raw_priority_text || 'N/A'}
                    </td>
                    {/* REMOVIDO: <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                      {vehicle.blocker_installed !== null ? (vehicle.blocker_installed ? 'Sim' : 'Não') : 'N/A'}
                    </td> */}
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                      {vehicle.raw_blocker_installed_text || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 text-center text-xs border-t border-gray-200 bg-gray-100 text-gray-600">
          Gerado em {generationDate} pelo Sistema de Gestão Karne & Keijo.
        </div>
      </div>
    </div>
  );
};