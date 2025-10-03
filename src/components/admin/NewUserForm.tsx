import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner'; // Importar toast do sonner
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

interface NewUserFormProps {
  onUserCreated: () => void;
  onClose: () => void;
}

const NewUserForm: React.FC<NewUserFormProps> = ({ onUserCreated, onClose }) => {
  // Removido: const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    full_name: '',
    role: 'user' as Tables<'profiles'>['role'],
    department: '',
    position: '',
    phone: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const edgeFunctionUrl = `https://iywrcosymxjynxspzjmi.supabase.co/functions/v1/create-user-by-admin`;

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error(sessionError?.message || 'No active session found. Please log in again.');
      }

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          username: formData.username,
          full_name: formData.full_name || null,
          role: formData.role,
          department: formData.department || null,
          position: formData.position || null,
          phone: formData.phone || null,
          is_active: true,
        }),
      });

      const responseData = await response.json();

      let toastTitle = "Usuário criado com sucesso!";
      let toastDescription = `${formData.full_name || formData.username} foi adicionado ao sistema.`;
      let toastType: 'success' | 'error' | 'info' = "success";
      let shouldCloseDialog = true;

      if (responseData.message && responseData.message.includes('User with this email already exists and has a profile.')) {
        toastTitle = "Usuário já existe";
        toastDescription = "Um usuário com este email já está registrado e possui um perfil. Nenhuma ação foi necessária.";
        toastType = "info";
        shouldCloseDialog = false;
      } else if (responseData.message && responseData.message.includes('User already exists, missing profile created.')) {
        toastTitle = "Perfil de usuário restaurado";
        toastDescription = `O perfil para ${formData.full_name || formData.username} foi criado para um usuário existente.`;
        toastType = "info";
        shouldCloseDialog = true;
      } else if (responseData.error) {
        toastTitle = "Erro ao criar usuário";
        toastDescription = responseData.error;
        toastType = "error";
        shouldCloseDialog = false;
      } else if (!response.ok) {
        toastTitle = "Erro ao criar usuário";
        toastDescription = responseData.message || 'Não foi possível criar o usuário via Edge Function.';
        toastType = "error";
        shouldCloseDialog = false;
      }

      toast[toastType](toastTitle, {
        description: toastDescription,
      });

      if (shouldCloseDialog) {
        onUserCreated(); // Notify parent component
        onClose(); // Close the dialog
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error("Erro ao criar usuário", {
        description: error.message || "Não foi possível criar o usuário",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Senha *</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleInputChange}
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="username">Nome de usuário *</Label>
          <Input
            id="username"
            value={formData.username}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="role">Papel *</Label>
          <Select
            value={formData.role}
            onValueChange={(value: Tables<'profiles'>['role']) => handleSelectChange('role', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o papel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">Usuário</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="full_name">Nome completo</Label>
        <Input
          id="full_name"
          value={formData.full_name}
          onChange={handleInputChange}
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="department">Departamento</Label>
          <Input
            id="department"
            value={formData.department}
            onChange={handleInputChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="position">Cargo</Label>
          <Input
            id="position"
            value={formData.position}
            onChange={handleInputChange}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={handleInputChange}
        />
      </div>
      
      <DialogFooter className="pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando...
            </>
          ) : (
            'Criar'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default NewUserForm;