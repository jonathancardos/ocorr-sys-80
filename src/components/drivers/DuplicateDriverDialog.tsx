import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, UserCheck, UserX, AlertTriangle, Info } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner'; // Import toast

type Driver = Tables<'drivers'>;
type DriverPendingApproval = Tables<'drivers_pending_approval'>;

interface DuplicateDriverDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pendingDriver: DriverPendingApproval;
  // Removido '| null' aqui. O componente pai (DriverManagement) é responsável por garantir que este não seja nulo quando o diálogo estiver aberto.
  duplicateDriverInfo: Pick<Driver, 'id' | 'full_name' | 'cpf' | 'cnh' | 'cnh_expiry' | 'phone' | 'type' | 'omnilink_score_registration_date' | 'omnilink_score_expiry_date' | 'omnilink_score_status' | 'status_indicacao' | 'reason_nao_indicacao'>;
  onResolve: (choice: 'keepExisting' | 'keepNew', pendingDriverId: string, existingDriverId: string) => void;
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  try {
    return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return dateString;
  }
};

const getOmnilinkStatusLabel = (status: string | null) => {
  if (status === 'em_dia') return 'Em Dia';
  if (status === 'inapto') return 'Inapto';
  return '-';
};

const getIndicacaoStatusLabel = (status: 'indicado' | 'retificado' | 'nao_indicado' | null) => {
  switch (status) {
    case 'indicado': return 'Indicado';
    case 'retificado': return 'Retificado';
    case 'nao_indicado': return 'Não Indicado';
    default: return '-';
  }
};

export const DuplicateDriverDialog: React.FC<DuplicateDriverDialogProps> = ({
  isOpen,
  onClose,
  pendingDriver,
  duplicateDriverInfo,
  onResolve,
}) => {
  console.log('DuplicateDriverDialog: duplicateDriverInfo prop received:', duplicateDriverInfo); // Log para depuração
  console.log('DuplicateDriverDialog: duplicateDriverInfo.id:', duplicateDriverInfo?.id); // Log para depuração

  // Adicionar uma verificação defensiva aqui
  if (!duplicateDriverInfo || !duplicateDriverInfo.id) {
    console.error("DuplicateDriverDialog: Received invalid duplicateDriverInfo or missing ID. Closing dialog.");
    toast.error("Erro interno", {
      description: "Dados do motorista duplicado incompletos. Por favor, tente novamente.",
    });
    onClose();
    return null; // Não renderiza nada se os dados forem inválidos
  }

  const handleChoice = (choice: 'keepExisting' | 'keepNew') => {
    const existingDriverId = duplicateDriverInfo.id;

    console.log('DuplicateDriverDialog: handleChoice called. choice:', choice);
    console.log('DuplicateDriverDialog: existingDriverId from duplicateDriverInfo.id (before validation):', existingDriverId); // --- NEW LOG ---

    // Verificação robusta para o ID do motorista existente
    if (!existingDriverId || typeof existingDriverId !== 'string' || existingDriverId.length !== 36) { // UUIDs são 36 caracteres
      console.error("DuplicateDriverDialog: ID do motorista existente inválido ou ausente:", existingDriverId);
      toast.error("Erro ao resolver duplicação", {
        description: "ID do motorista existente inválido ou não encontrado. Não foi possível prosseguir.",
      });
      onClose();
      return;
    }
    console.log('DuplicateDriverDialog: existingDriverId after validation, before onResolve:', existingDriverId);

    onResolve(choice, pendingDriver.id, existingDriverId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-6 w-6" />
            Duplicação de Motorista Detectada!
          </DialogTitle>
          <DialogDescription>
            O motorista que você está tentando aprovar possui informações conflitantes com um motorista já cadastrado.
            Por favor, revise os detalhes abaixo e escolha qual registro deseja manter.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-4 -mx-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4">
            {/* Motorista Existente */}
            <Card className="border-2 border-success/50 bg-success/5 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-success">
                  <UserCheck className="h-5 w-5" /> Motorista Existente
                </CardTitle>
                <CardDescription>
                  Este é o registro atual na sua base de dados.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {/* Como duplicateDriverInfo é garantido como não-nulo, podemos renderizar diretamente */}
                <>
                  <p><span className="font-semibold">Nome Completo:</span> {duplicateDriverInfo.full_name}</p>
                  <p><span className="font-semibold">CPF:</span> {duplicateDriverInfo.cpf}</p>
                  <p><span className="font-semibold">Tipo:</span> {duplicateDriverInfo.type || '-'}</p>
                  <p><span className="font-semibold">CNH:</span> {duplicateDriverInfo.cnh || '-'}</p>
                  <p><span className="font-semibold">Validade CNH:</span> {formatDate(duplicateDriverInfo.cnh_expiry)}</p>
                  <p><span className="font-semibold">Telefone:</span> {duplicateDriverInfo.phone || '-'}</p>
                  <p><span className="font-semibold">Reg. Omnilink Score:</span> {formatDate(duplicateDriverInfo.omnilink_score_registration_date)}</p>
                  <p><span className="font-semibold">Venc. Omnilink Score:</span> {formatDate(duplicateDriverInfo.omnilink_score_expiry_date)}</p>
                  <p><span className="font-semibold">Status Omnilink:</span> <Badge variant="success">{getOmnilinkStatusLabel(duplicateDriverInfo.omnilink_score_status)}</Badge></p>
                  <p><span className="font-semibold">Status Indicação:</span> <Badge variant="success">{getIndicacaoStatusLabel(duplicateDriverInfo.status_indicacao as 'indicado' | 'retificado' | 'nao_indicado')}</Badge></p>
                  {duplicateDriverInfo.status_indicacao === 'nao_indicado' && duplicateDriverInfo.reason_nao_indicacao && (
                    <p><span className="font-semibold">Motivo Não Indicação:</span> {duplicateDriverInfo.reason_nao_indicacao}</p>
                  )}
                  <Badge variant="secondary" className="mt-2">ID: {duplicateDriverInfo.id}</Badge>
                </>
              </CardContent>
            </Card>

            {/* Motorista Pendente (Novo) */}
            <Card className="border-2 border-primary/50 bg-primary/5 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <User className="h-5 w-5" /> Motorista Pendente (Novo)
                </CardTitle>
                <CardDescription>
                  Este é o registro que você está tentando adicionar/aprovar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="font-semibold">Nome Completo:</span> {pendingDriver.full_name}</p>
                <p><span className="font-semibold">CPF:</span> {pendingDriver.cpf}</p>
                <p><span className="font-semibold">Tipo:</span> {pendingDriver.type || '-'}</p>
                <p><span className="font-semibold">CNH:</span> {pendingDriver.cnh || '-'}</p>
                <p><span className="font-semibold">Validade CNH:</span> {formatDate(pendingDriver.cnh_expiry)}</p>
                <p><span className="font-semibold">Telefone:</span> {pendingDriver.phone || '-'}</p>
                <p><span className="font-semibold">Reg. Omnilink Score:</span> {formatDate(pendingDriver.omnilink_score_registration_date)}</p>
                <p><span className="font-semibold">Venc. Omnilink Score:</span> {formatDate(pendingDriver.omnilink_score_expiry_date)}</p>
                   <p><span className="font-semibold">Status Omnilink:</span> <Badge variant="secondary">{getOmnilinkStatusLabel(pendingDriver.omnilink_score_status)}</Badge></p>
                   <p><span className="font-semibold">Status Indicação:</span> <Badge variant="secondary">{getIndicacaoStatusLabel(pendingDriver.status_indicacao as 'indicado' | 'retificado' | 'nao_indicado')}</Badge></p>
                {pendingDriver.status_indicacao === 'nao_indicado' && pendingDriver.reason_nao_indicacao && (
                  <p><span className="font-semibold">Motivo Não Indicação:</span> {pendingDriver.reason_nao_indicacao}</p>
                )}
                <Badge variant="secondary" className="mt-2">ID: {pendingDriver.id}</Badge>
                {pendingDriver.reason && (
                  <p className="flex items-center gap-1 text-sm text-destructive mt-2">
                    <Info className="h-4 w-4" />
                    <span className="font-semibold">Motivo da Duplicação:</span> {pendingDriver.reason.replace(/_/g, ' ').replace('duplicate', 'duplicado')}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4">
          <Button
            variant="outline"
            onClick={() => handleChoice('keepExisting')}
            className="flex items-center gap-2"
          >
            <UserCheck className="h-4 w-4" /> Manter Existente
          </Button>
          <Button
            onClick={() => handleChoice('keepNew')}
            className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <User className="h-4 w-4" /> Manter Novo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};