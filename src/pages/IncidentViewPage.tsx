import React, { useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/supabase';
import { Database } from '../types/supabase';

type Incident = Database['public']['Tables']['ocorrencias']['Row'];

const IncidentViewPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
      }
      setLoading(false);
    };

    fetchIncidents();
  }, []);

  if (loading) {
    return <div className="p-4">Carregando ocorrências...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Erro ao carregar ocorrências: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Visualização de Ocorrências</h1>
      {
        incidents.length === 0 ? (
          <p>Nenhuma ocorrência encontrada.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {incidents.map((incident) => (
              <div key={incident.id} className="bg-white p-4 rounded shadow">
                <h2 className="text-lg font-semibold">ID: {incident.id}</h2>
                <p>Status: {incident.status}</p>
                <p>Criado em: {new Date(incident.created_at).toLocaleString()}</p>
                {/* Adicione mais detalhes da ocorrência aqui conforme necessário */}
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
};

export default IncidentViewPage;