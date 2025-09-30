import React from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tables } from '@/integrations/supabase/types';
import { getCnhStatus, getDetailedOmnilinkStatus } from '@/lib/driver-utils';

type Driver = Tables<'drivers'>;

interface DriverReportPDFLayoutProps {
  drivers: Driver[];
  startDate?: Date;
  endDate?: Date;
  onRenderComplete?: () => void;
}

export const DriverReportPDFLayout: React.FC<DriverReportPDFLayoutProps> = ({
  drivers,
  startDate,
  endDate,
  onRenderComplete,
}) => {
  React.useEffect(() => {
    if (onRenderComplete) {
      onRenderComplete();
    }
  }, [onRenderComplete]);

  const formattedStartDate = startDate ? format(startDate, 'dd/MM/yyyy', { locale: ptBR }) : 'N/A';
  const formattedEndDate = endDate ? format(endDate, 'dd/MM/yyyy', { locale: ptBR }) : 'N/A';
  const generationDate = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR });

  const getIndicacaoStatusLabel = (status: 'indicado' | 'retificado' | 'nao_indicado' | null) => {
    switch (status) {
      case 'indicado': return 'Indicado';
      case 'retificado': return 'Retificado';
      case 'nao_indicado': return 'Não Indicado';
      default: return 'N/A';
    }
  };

  return (
    <div className="font-sans text-gray-900 p-8 bg-white h-fit print:p-0 print:bg-white"> {/* Alterado min-h-screen para h-fit */}
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none border border-gray-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-cyan-600 text-white p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Relatório de Motoristas Cadastrados</h1>
            <p className="text-sm opacity-90">Karne & Keijo - Sistema de Gestão</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">Período:</p>
            <p className="text-sm opacity-90">{formattedStartDate} a {formattedEndDate}</p>
          </div>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-700 mb-4">
            Este relatório apresenta a lista de motoristas cadastrados no sistema no período de {formattedStartDate} a {formattedEndDate}.
          </p>

          <div className="mb-6">
            <h3 className="text-lg font-bold text-blue-800 mb-3">Resumo</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <p><span className="font-semibold">Total de Motoristas:</span> {drivers.length}</p>
              <p><span className="font-semibold">Data de Geração:</span> {generationDate}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome Completo
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CPF
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reg. Omnilink
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status Indicação
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drivers.map((driver) => (
                  <tr key={driver.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {driver.full_name}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                      {driver.cpf}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                      {driver.type || 'N/A'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                      {driver.omnilink_score_registration_date ? format(parseISO(driver.omnilink_score_registration_date), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                      {getIndicacaoStatusLabel(driver.status_indicacao as 'indicado' | 'retificado' | 'nao_indicado' | null)}
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