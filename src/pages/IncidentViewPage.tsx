import React, { useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/supabase';
import { Database } from '../types/supabase';

type Incident = Database['public']['Tables']['ocorrencias']['Row'];

type FilterOptions = {
  status: string;
  priority: string;
};

const IncidentViewPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    priority: 'all',
  });

  useEffect(() => {
    const fetchIncidents = async () => {
      const { data, error } = await supabase
        .from('ocorrencias')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (data) {
        setIncidents(data as Incident[]);
        setFilteredIncidents(data as Incident[]);
      }
      setLoading(false);
    };

    fetchIncidents();
  }, []);

  useEffect(() => {
    const filtered = incidents.filter((incident) => {
      const statusMatch = filters.status === 'all' || incident.status === filters.status;
      const priorityMatch = filters.priority === 'all' || incident.priority === filters.priority;
      return statusMatch && priorityMatch;
    });
    setFilteredIncidents(filtered);
  }, [filters, incidents]);

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'Urgente':
        return {
          bg: 'bg-red-900/50 border-red-500 hover:shadow-red-500/30',
          text: 'text-red-400',
          dot: 'bg-red-500',
        };
      case 'Em Andamento':
        return {
          bg: 'bg-blue-900/50 border-blue-500 hover:shadow-blue-500/30',
          text: 'text-blue-400',
          dot: 'bg-blue-500',
        };
      case 'Pendente':
        return {
          bg: 'bg-yellow-900/50 border-yellow-500 hover:shadow-yellow-500/30',
          text: 'text-yellow-400',
          dot: 'bg-yellow-500',
        };
      default:
        return {
          bg: 'bg-gray-800 border-gray-700 hover:shadow-gray-700/30',
          text: 'text-gray-400',
          dot: 'bg-gray-500',
        };
    }
  };

  if (loading) {
    return <div className="p-4 text-gray-100">Carregando ocorrências...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Erro ao carregar ocorrências: {error}</div>;
  }

  return (
    <div className="bg-gray-900 text-gray-100 min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-6 border-b-2 border-indigo-500 pb-2">
          Ocorrências em Andamento
        </h1>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-lg transition duration-150 ease-in-out cursor-pointer"
          >
            <option value="all">Todos os Status</option>
            <option value="Em Andamento">Em Andamento</option>
            <option value="Pendente">Pendente</option>
            <option value="Urgente">Urgente</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-lg transition duration-150 ease-in-out cursor-pointer"
          >
            <option value="all">Todas as Prioridades</option>
            <option value="Alta">Alta</option>
            <option value="Média">Média</option>
            <option value="Baixa">Baixa</option>
          </select>
        </div>

        {filteredIncidents.length === 0 ? (
          <p className="text-center text-gray-500 mt-12">Nenhuma ocorrência encontrada com os filtros atuais.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIncidents.map((incident) => {
              const statusInfo = getStatusClasses(incident.status || '');
              const priorityColor = incident.priority === 'Alta' ? 'text-red-500 font-bold' :
                                 incident.priority === 'Média' ? 'text-yellow-500' : 'text-green-500';

              return (
                <div
                  key={incident.id}
                  className={`p-6 rounded-xl border-t-4 transition duration-300 ease-in-out transform hover:scale-[1.01] cursor-pointer shadow-xl ${statusInfo.bg}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-gray-400">{incident.id}</span>
                      <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`}></span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusInfo.text} ${statusInfo.dot.replace('bg-', 'bg-').replace('500', '900/30')} border border-current`}>
                        {incident.status}
                      </span>
                    </div>
                    <span className={`text-xs font-semibold ${priorityColor} p-1 rounded`}>
                      Prioridade: {incident.priority}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-white mb-2 line-clamp-2">
                    {incident.description || 'Sem descrição'}
                  </h2>

                  <div className="text-xs text-gray-400 space-y-1">
                    <p><strong>Responsável:</strong> {incident.assignee || 'Não Atribuído'}</p>
                    <p><strong>Aberto em:</strong> {new Date(incident.created_at).toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentViewPage;