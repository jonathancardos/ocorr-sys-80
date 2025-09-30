import React, { useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ShieldCheck, Car, CheckCircle, XCircle, Info, Wrench, Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle } from '@/types/vehicles';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export const DoubleBlockerProgressChart: React.FC = () => {
  const { data: vehicles, isLoading, error } = useQuery<Vehicle[], Error>({
    queryKey: ['vehiclesForBlockerChart'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vehicles').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const {
    totalFleet,
    installedBlockersCount,
    notInstalledExplicitlyCount,
    willNotInstallCount,
    unknownBlockerStatusCount,
    priority1InstalledCount,
    priority2InstalledCount,
    priority3InstalledCount,
    overallPercentageInstalled,
  } = useMemo(() => {
    if (!vehicles) {
      return {
        totalFleet: 0,
        installedBlockersCount: 0,
        notInstalledExplicitlyCount: 0,
        willNotInstallCount: 0,
        unknownBlockerStatusCount: 0,
        priority1InstalledCount: 0,
        priority2InstalledCount: 0,
        priority3InstalledCount: 0,
        overallPercentageInstalled: 0,
      };
    }

    const totalFleet = vehicles.length;
    let installedBlockersCount = 0;
    let notInstalledExplicitlyCount = 0;
    let willNotInstallCount = 0;
    let unknownBlockerStatusCount = 0;

    let priority1InstalledCount = 0;
    let priority2InstalledCount = 0;
    let priority3InstalledCount = 0;

    vehicles.forEach(v => {
      if (v.blocker_installed === true) {
        installedBlockersCount++;
        if (v.priority === 1) priority1InstalledCount++;
        else if (v.priority === 2) priority2InstalledCount++;
        else if (v.priority === 3) priority3InstalledCount++;
      } else if (v.blocker_installed === false) {
        if (v.raw_blocker_installed_text?.toLowerCase().includes('não vai instalar') || v.raw_blocker_installed_text?.toLowerCase().includes('nao vai instalar')) {
          willNotInstallCount++;
        } else {
          notInstalledExplicitlyCount++;
        }
      } else if (v.blocker_installed === null) {
        unknownBlockerStatusCount++;
      }
    });

    const overallPercentageInstalled = totalFleet > 0
      ? (installedBlockersCount / totalFleet) * 100
      : 0;

    return {
      totalFleet,
      installedBlockersCount,
      notInstalledExplicitlyCount,
      willNotInstallCount,
      unknownBlockerStatusCount,
      priority1InstalledCount,
      priority2InstalledCount,
      priority3InstalledCount: priority3InstalledCount,
      overallPercentageInstalled,
    };
  }, [vehicles]);

  const circleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (circleRef.current) {
      const circle = circleRef.current;
      const radius = circle.r.baseVal.value;
      const circumference = 2 * Math.PI * radius;
      let percent = overallPercentageInstalled;

      // Ajuste para compensar stroke-linecap: round e garantir continuidade visual
      // Adiciona uma pequena sobreposição para que as bordas arredondadas se encontrem
      const effectiveCircumference = circumference + 1; 

      circle.style.strokeDasharray = `${effectiveCircumference} ${effectiveCircumference}`;
      circle.style.strokeDashoffset = String(effectiveCircumference); // Convert to string

      // Animate the progress
      const timeoutId = setTimeout(() => {
        const offset = effectiveCircumference - (percent / 100) * effectiveCircumference;
        circle.style.strokeDashoffset = String(offset); // Convert to string
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [overallPercentageInstalled]);

  if (isLoading) {
    return (
      <Card className="modern-card h-full flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-2">Carregando dados da frota...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="modern-card h-full flex flex-col items-center justify-center">
        <XCircle className="h-8 w-8 text-destructive" />
        <p className="text-destructive mt-2">Erro ao carregar dados: {error.message}</p>
      </Card>
    );
  }

  return (
    <div className="dashboard-card-new">
      <h2 className="dashboard-title-new">
        <ShieldCheck className="h-5 w-5" /> Bloqueadores Duplos Instalados
      </h2>
      <p className="text-sm text-muted-foreground mt-1">Progresso de instalação de bloqueadores duplos na frota.</p>

      {totalFleet > 0 ? (
        <div className="progress-container-new">
          <svg className="progress-ring-new" width="200" height="200">
            <defs>
              <linearGradient id="gradient-new" gradientTransform="rotate(90)">
                <stop offset="0%" stopColor="hsl(var(--primary-light))"/> {/* Lighter primary */}
                <stop offset="100%" stopColor="hsl(var(--accent-light))"/> {/* Lighter accent */}
              </linearGradient>
              {/* Filter for the glow effect - Refined for layered glow */}
              <filter id="soft-glow">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur1" /> {/* Reduced stdDeviation */}
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur2" /> {/* Reduced stdDeviation */}
                <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur3" /> {/* Reduced stdDeviation */}
                <feMerge>
                  <feMergeNode in="blur1" />
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur3" />
                </feMerge>
              </filter>
            </defs>
            <circle className="progress-ring__circle-new progress-ring__circle-bg-new" strokeWidth="8" r="90" cx="100" cy="100"/>
            {/* Foreground circle */}
            <circle ref={circleRef} className="progress-ring__circle-new progress-ring__circle-fg-new" strokeWidth="8" r="90" cx="100" cy="100"/>
          </svg>
          <div className="progress-text-new">{overallPercentageInstalled.toFixed(1)}%</div>
        </div>
      ) : (
        <div className="text-center text-muted-foreground p-4">
          <Info className="h-8 w-8 mx-auto mb-2" />
          <p>Nenhum veículo encontrado na frota.</p>
        </div>
      )}

      {totalFleet > 0 && (
        <>
          <div className="status-list-new">
            <div className="status-item-new">
              <CheckCircle className="h-4 w-4 text-success" /> Instalado: {installedBlockersCount}
            </div>
            <div className="status-item-new">
              <XCircle className="h-4 w-4 text-destructive" /> Não Instalado: {notInstalledExplicitlyCount}
            </div>
            <div className="status-item-new">
              <Wrench className="h-4 w-4 text-warning" /> Não Vai Instalar: {willNotInstallCount}
            </div>
            <div className="status-item-new">
              <Info className="h-4 w-4 text-muted-foreground" /> Não Classificado: {unknownBlockerStatusCount}
            </div>
          </div>

          <div className="priority-cards-new">
            <div className="priority-card-new p1">
              <h3>P1</h3>
              <span>{priority1InstalledCount}</span> Instalados
            </div>
            <div className="priority-card-new p2">
              <h3>P2</h3>
              <span>{priority2InstalledCount}</span> Instalados
            </div>
            <div className="priority-card-new p3">
              <h3>P3</h3>
              <span>{priority3InstalledCount}</span> Instalados
            </div>
          </div>

          <p className="text-center mt-4 text-muted-foreground text-sm">
            Total de veículos na frota: <b>{totalFleet}</b>
          </p>
        </>
      )}
    </div>
  );
};