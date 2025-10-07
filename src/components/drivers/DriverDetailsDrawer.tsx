import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { getDetailedOmnilinkStatus } from '@/lib/driver-utils';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DriverDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  driver: {
    id: string;
    full_name: string;
    cpf: string | null;
    cnh: string | null;
    cnh_expiry: string | null;
    phone: string | null;
    type: string | null;
    omnilink_score_registration_date: string | null;
    omnilink_score_expiry_date: string | null;
    omnilink_score_status: string | null;
    status_indicacao: string | null;
    reason_nao_indicacao: string | null;
    created_at?: string;
  } | null;
  isPending?: boolean;
  reason?: string | null;
  duplicateInfo?: {
    full_name: string;
    cpf: string;
    cnh: string | null;
  } | null;
}

export const DriverDetailsDrawer = ({ isOpen, onClose, driver, isPending, reason, duplicateInfo }: DriverDetailsDrawerProps) => {
  if (!driver) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getOmnilinkBadgeVariant = (status: string) => {
    switch (status) {
      case 'em_dia': return 'success';
      case 'prest_vencer': return 'warning';
      case 'vencido': return 'destructive';
      default: return 'secondary';
    }
  };

  const getIndicacaoStatusBadgeVariant = (status: string | null) => {
    switch (status) {
      case 'indicado': return 'success';
      case 'retificado': return 'warning';
      case 'nao_indicado': return 'destructive';
      default: return 'secondary';
    }
  };

  const omnilinkStatus = getDetailedOmnilinkStatus(driver.omnilink_score_registration_date);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl">Detalhes do Motorista</SheetTitle>
          <SheetDescription>
            Informações completas do motorista cadastrado
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground">Informações Básicas</h3>
            <Separator />
            
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Nome Completo</Label>
                <p className="text-sm font-medium">{driver.full_name}</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">CPF</Label>
                <p className="text-sm font-medium">{driver.cpf || 'N/A'}</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Tipo</Label>
                <p className="text-sm font-medium">{driver.type || 'N/A'}</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Telefone</Label>
                <p className="text-sm font-medium">{driver.phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* CNH */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground">CNH</h3>
            <Separator />
            
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Número da CNH</Label>
                <p className="text-sm font-medium">{driver.cnh || 'N/A'}</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Validade</Label>
                <p className="text-sm font-medium">{formatDate(driver.cnh_expiry)}</p>
              </div>
            </div>
          </div>

          {/* Omnilink Score */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground">Omnilink Score</h3>
            <Separator />
            
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Data de Registro</Label>
                <p className="text-sm font-medium">{formatDate(driver.omnilink_score_registration_date)}</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Data de Vencimento</Label>
                <p className="text-sm font-medium">{formatDate(driver.omnilink_score_expiry_date)}</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div className="flex items-center gap-2">
                  {driver.omnilink_score_registration_date ? (
                    <Badge variant={getOmnilinkBadgeVariant(omnilinkStatus.status)}>
                      {omnilinkStatus.status === 'em_dia' ? 'Em Dia' : 
                       omnilinkStatus.status === 'prest_vencer' ? 'Prestes a Vencer' : 
                       omnilinkStatus.status === 'vencido' ? 'Vencido' : 'N/A'}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">N/A</Badge>
                  )}
                </div>
                {omnilinkStatus.status !== 'em_dia' && omnilinkStatus.status !== 'unknown' && (
                  <div className={cn(
                    "flex items-center gap-2 text-xs mt-1",
                    omnilinkStatus.status === 'vencido' && "text-destructive",
                    omnilinkStatus.status === 'prest_vencer' && "text-warning"
                  )}>
                    <AlertTriangle className="h-3 w-3" />
                    {omnilinkStatus.message}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status de Indicação */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground">Indicação</h3>
            <Separator />
            
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div>
                  {driver.status_indicacao ? (
                    <Badge variant={getIndicacaoStatusBadgeVariant(driver.status_indicacao)}>
                      {driver.status_indicacao === 'indicado' ? 'Indicado' : 
                       driver.status_indicacao === 'retificado' ? 'Retificado' : 
                       'Não Indicado'}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">N/A</Badge>
                  )}
                </div>
              </div>

              {driver.status_indicacao === 'nao_indicado' && driver.reason_nao_indicacao && (
                <div>
                  <Label className="text-xs text-muted-foreground">Motivo</Label>
                  <p className="text-sm">{driver.reason_nao_indicacao}</p>
                </div>
              )}
            </div>
          </div>

          {/* Status do Cadastro */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground">Status do Cadastro</h3>
            <Separator />
            
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div>
                  {isPending ? (
                    <Badge variant="warning">Pendente de Aprovação</Badge>
                  ) : (
                    <Badge variant="success">Ativo</Badge>
                  )}
                </div>
              </div>

              {reason && (
                <div>
                  <Label className="text-xs text-muted-foreground">Motivo</Label>
                  <p className="text-sm">{reason.replace(/_/g, ' ').replace('duplicate', 'duplicado')}</p>
                </div>
              )}

              {duplicateInfo && (
                <div className="rounded-lg border border-warning/50 bg-warning/10 p-3">
                  <Label className="text-xs text-warning font-semibold">Duplicação Detectada</Label>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs"><span className="font-medium">Nome:</span> {duplicateInfo.full_name}</p>
                    <p className="text-xs"><span className="font-medium">CPF:</span> {duplicateInfo.cpf}</p>
                    {duplicateInfo.cnh && <p className="text-xs"><span className="font-medium">CNH:</span> {duplicateInfo.cnh}</p>}
                  </div>
                </div>
              )}

              {driver.created_at && (
                <div>
                  <Label className="text-xs text-muted-foreground">Data de Cadastro</Label>
                  <p className="text-sm">{formatDate(driver.created_at)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
