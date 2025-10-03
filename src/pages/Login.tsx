import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Importar Tabs

import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Shield, Eye, EyeOff, UserPlus, Truck } from 'lucide-react'; // Adicionado Truck
import { toast } from 'sonner';
import ParticlesBackground from '@/components/ParticlesBackground'; // Import the new component

const backgroundImages = [
  './login-background.jpg',
];

const Login = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentTab, setCurrentTab] = useState('login'); // Estado para controlar a aba ativa
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Sign Up form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupFullName, setSignupFullName] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const [currentBgImage, setCurrentBgImage] = useState('');

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');
    if (savedEmail && savedPassword) {
      setLoginEmail(savedEmail);
      setLoginPassword(savedPassword);
      setRememberMe(true);
    }

    const randomIndex = Math.floor(Math.random() * backgroundImages.length);
    setCurrentBgImage(backgroundImages[randomIndex]);
  }, []);

  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(loginEmail, loginPassword);
      
      if (!error) {
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', loginEmail);
          localStorage.setItem('rememberedPassword', loginPassword);
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberedPassword');
        }
        toast.success("Login realizado com sucesso!", {
          description: "Bem-vindo ao sistema",
        });
      } else {
        // Error message is already handled by toast in AuthContext,
        // but we can add specific handling here if needed.
        // For now, just ensure isLoading is set to false.
      }
    } catch (error) {
      console.error('Login error:', error);
      // This catch block might not be hit if signIn handles its own errors with toast
      // but it's good practice to have it.
      toast.error("Erro inesperado no login", {
        description: "Ocorreu um erro inesperado. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signUp(signupEmail, signupPassword, {
        username: signupUsername,
        full_name: signupFullName,
        role: 'user', // Default role for self-registered users
      });
      
      if (!error) {
        toast.success("Cadastro realizado com sucesso!", {
          description: "Verifique seu e-mail para confirmar sua conta. Após a confirmação, um administrador precisará aprová-la.",
        });
        // Clear sign-up form
        setSignupEmail('');
        setSignupPassword('');
        setSignupUsername('');
        setSignupFullName('');
        setCurrentTab('login'); // Switch back to login tab
      }
    } catch (error) {
      console.error('Sign Up error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
        style={{ 
          backgroundImage: `url(${currentBgImage})`,
          filter: 'blur(8px)',
          transform: 'scale(1.05)',
          zIndex: -1,
        }}
      ></div>
      <div className="absolute inset-0 bg-black opacity-50 z-0"></div>

      {/* NEW: Particles Background, behind the card but above the blurred image/overlay */}
      <ParticlesBackground /> 

      <Card className="w-full max-w-md modern-card relative z-10">
        {/* Background Icons for the Card */}
        <div className="absolute inset-0 overflow-hidden rounded-xl opacity-5 pointer-events-none">
          <Truck className="absolute -top-8 -left-8 h-32 w-32 text-primary rotate-12" />
          <Shield className="absolute top-1/4 -right-10 h-24 w-24 text-accent -rotate-45" />
          <Truck className="absolute bottom-1/3 -left-12 h-28 w-28 text-primary -rotate-12" />
          <Shield className="absolute -bottom-8 -right-8 h-36 w-36 text-accent rotate-45" />
        </div>

        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Sistema de Gestão</CardTitle>
          <CardDescription className="text-muted-foreground">Acesse ou crie sua conta</CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-card/20 backdrop-blur-sm border border-border/50"> {/* Adjusted transparency */}
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Usuário ou Email</Label>
                  <Input
                    id="login-email"
                    type="text"
                    placeholder="Digite seu usuário ou email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
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

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked: boolean) => setRememberMe(checked)}
                  />
                  <Label htmlFor="remember-me">Lembrar-me</Label>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup" className="mt-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email *</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha *</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showSignupPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                    >
                      {showSignupPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Nome de Usuário *</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder="seu_usuario"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-full-name">Nome Completo</Label>
                  <Input
                    id="signup-full-name"
                    type="text"
                    placeholder="Seu Nome Completo"
                    value={signupFullName}
                    onChange={(e) => setSignupFullName(e.target.value)}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Cadastrar
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;