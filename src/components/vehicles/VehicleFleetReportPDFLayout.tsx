import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Vehicle } from '@/types/vehicles';

interface VehicleFleetReportPDFLayoutProps {
  vehicles: Vehicle[];
  onRenderComplete?: () => void;
}

export const VehicleFleetReportPDFLayout: React.FC<VehicleFleetReportPDFLayoutProps> = ({
  vehicles,
  onRenderComplete,
}) => {
  React.useEffect(() => {
    if (onRenderComplete) {
      onRenderComplete();
    }
  }, [onRenderComplete]);

  const generationDate = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR });

  // Data aggregation
  const totalVehicles = vehicles.length;
  const vehiclesWithBlockerInstalled = vehicles.filter(v => v.blocker_installed === true).length;
  const vehiclesBlockerNotInstalledExplicitly = vehicles.filter(v => 
    v.blocker_installed === false && 
    !(v.raw_blocker_installed_text?.toLowerCase().includes('não vai instalar') || v.raw_blocker_installed_text?.toLowerCase().includes('nao vai instalar'))
  ).length;
  const vehiclesBlockerNotInstalling = vehicles.filter(v => 
    v.blocker_installed === false && 
    (v.raw_blocker_installed_text?.toLowerCase().includes('não vai instalar') || v.raw_blocker_installed_text?.toLowerCase().includes('nao vai instalar'))
  ).length;
  const vehiclesBlockerStatusUnknown = vehicles.filter(v => v.blocker_installed === null).length;

  const vehiclesByPriority: { [key: number]: Vehicle[] } = {
    1: vehicles.filter(v => v.priority === 1),
    2: vehicles.filter(v => v.priority === 2),
    3: vehicles.filter(v => v.priority === 3),
  };

  const getBlockerStatusLabel = (vehicle: Vehicle) => {
    if (vehicle.blocker_installed === true) return 'Instalado';
    if (vehicle.blocker_installed === false) {
      if (vehicle.raw_blocker_installed_text?.toLowerCase().includes('não vai instalar') || vehicle.raw_blocker_installed_text?.toLowerCase().includes('nao vai instalar')) {
        return 'Não Vai Instalar';
      }
      return 'Não Instalado';
    }
    return 'Não Classificado';
  };

  const getPriorityLabel = (priority: number | null) => {
    switch (priority) {
      case 1: return 'Alta';
      case 2: return 'Média';
      case 3: return 'Baixa';
      default: return 'N/A';
    }
  };

  return (
    <div className="font-sans text-gray-900 p-8 bg-white h-fit print:p-0 print:bg-white"> {/* Alterado min-h-screen para h-fit */}
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none border border-gray-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-cyan-600 text-white p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Relatório de Estatísticas da Frota</h1>
            <p className="text-sm opacity-90">Karne & Keijo - Sistema de Gestão</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">Total de Veículos:</p>
            <p className="text-sm opacity-90">{totalVehicles}</p>
          </div>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-700 mb-6">
            Este relatório apresenta uma visão geral das estatísticas da frota, incluindo o status do bloqueador e a distribuição por prioridade.
          </p>

          {/* Resumo Geral */}
          <div className="mb-8 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-bold text-blue-800 mb-3">Resumo Geral do Status do Bloqueador</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <p><span className="font-semibold">Total de Veículos:</span> {totalVehicles}</p>
              <p><span className="font-semibold">Instalado:</span> {vehiclesWithBlockerInstalled} ({totalVehicles > 0 ? (vehiclesWithBlockerInstalled / totalVehicles * 100).toFixed(0) : 0}%)</p>
              <p><span className="font-semibold">Não Instalado:</span> {vehiclesBlockerNotInstalledExplicitly} ({totalVehicles > 0 ? (vehiclesBlockerNotInstalledExplicitly / totalVehicles * 100).toFixed(0) : 0}%)</p>
              <p><span className="font-semibold">Não Vai Instalar:</span> {vehiclesBlockerNotInstalling} ({totalVehicles > 0 ? (vehiclesBlockerNotInstalling / totalVehicles * 100).toFixed(0) : 0}%)</p>
              <p><span className="font-semibold">Não Classificado:</span> {vehiclesBlockerStatusUnknown} ({totalVehicles > 0 ? (vehiclesBlockerStatusUnknown / totalVehicles * 100).toFixed(0) : 0}%)</p>
            </div>
          </div>

          {/* Seção por Prioridade */}
          <h3 className="text-lg font-bold text-blue-800 mb-4">Detalhes por Prioridade</h3>
          {Object.keys(vehiclesByPriority).map(priorityKey => {
            const priorityNum = parseInt(priorityKey, 10);
            const priorityVehicles = vehiclesByPriority[priorityNum];
            const installedCount = priorityVehicles.filter(v => v.blocker_installed === true).length;
            const notInstalledCount = priorityVehicles.filter(v => v.blocker_installed === false && !(v.raw_blocker_installed_text?.toLowerCase().includes('não vai instalar') || v.raw_blocker_installed_text?.toLowerCase().includes('nao vai instalar'))).length;
            const notInstallingCount = priorityVehicles.filter(v => v.blocker_installed === false && (v.raw_blocker_installed_text?.toLowerCase().includes('não vai instalar') || v.raw_blocker_installed_text?.toLowerCase().includes('nao vai instalar'))).length;
            const unknownStatusCount = priorityVehicles.filter(v => v.blocker_installed === null).length;

            const vehiclesWithOtherStatus = priorityVehicles.filter(v => v.blocker_installed === null || (v.blocker_installed === false && v.raw_blocker_installed_text && !(v.raw_blocker_installed_text?.toLowerCase().includes('não vai instalar') || v.raw_blocker_installed_text?.toLowerCase().includes('nao vai instalar')) && !(v.raw_blocker_installed_text?.toLowerCase().includes('não') || v.raw_blocker_installed_text?.toLowerCase().includes('nao'))));

            return (
              <div key={priorityNum} className="mb-6 p-4 border rounded-lg bg-gray-50">
                <h4 className="text-md font-bold text-gray-800 mb-2">Prioridade {priorityNum} ({getPriorityLabel(priorityNum)}) - {priorityVehicles.length} Veículos</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-3">
                  <p><span className="font-semibold">Instalado:</span> {installedCount}</p>
                  <p><span className="font-semibold">Não Instalado:</span> {notInstalledCount}</p>
                  <p><span className="font-semibold">Não Vai Instalar:</span> {notInstallingCount}</p>
                  <p><span className="font-semibold">Não Classificado:</span> {unknownStatusCount}</p>
                </div>

                {vehiclesWithOtherStatus.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-orange-700 mb-2">Veículos com Status Não Classificado ou Detalhes Adicionais:</p>
                    <ul className="list-disc list-inside text-xs text-gray-700">
                      {vehiclesWithOtherStatus.map(v => (
                        <li key={v.id}>
                          <span className="font-medium">{v.plate}</span>: {getBlockerStatusLabel(v)} ({v.raw_blocker_installed_text || 'N/A'})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 text-center text-xs border-t border-gray-200 bg-gray-100 text-gray-600">
          Gerado em {generationDate} pelo Sistema de Gestão Karne & Keijo.
        </div>
      </div>
    </div>
  );
};