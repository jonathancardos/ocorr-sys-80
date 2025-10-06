import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';
import { useQueryClient } from '@tanstack/react-query'; // Import useQueryClient

interface Profile {
  id: string;
  username: string;
  full_name: string;
  role: 'admin' | 'user';
  department: string | null;
  position: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  avatar_url: string | null;
  cnh: string | null;
  cnh_expiry: string | null;
  email: string | null; // Adicionado: Nova coluna 'email'
  page_permissions?: Tables<'user_page_permissions'>[];
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (emailOrUsername: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: { username: string; full_name: string; role?: 'admin' | 'user' }) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient(); // Get queryClient instance

  const fetchProfile = useCallback(async (userId: string) => {
    console.log('AuthContext: fetchProfile called for userId:', userId);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('AuthContext: Error fetching profile:', profileError);
        setProfile(null);
        return null; // Return null to indicate profile not found or error
      }

      const { data: permissions, error: permissionsError } = await supabase
        .from('user_page_permissions')
        .select('*')
        .eq('user_id', userId);

      if (permissionsError) {
        console.error('AuthContext: Error fetching user page permissions:', permissionsError);
      }

      const fetchedProfile: Profile = {
        ...(profileData as Profile),
        page_permissions: permissions || [],
      };
      console.log('AuthContext: Profile fetched and prepared:', fetchedProfile);
      setProfile(fetchedProfile);
      queryClient.invalidateQueries({ queryKey: ['profile', userId] }); // Invalidate specific profile query
      return fetchedProfile; // Return the fetched profile
    } catch (error: any) {
      console.error('AuthContext: Exception fetching profile:', error);
      setProfile(null);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        toast.error("Erro de Conexão", {
          description: "Não foi possível conectar ao servidor. Verifique sua conexão com a internet ou tente novamente mais tarde.",
        });
      } else {
        toast.error("Erro ao Carregar Perfil", {
          description: "Ocorreu um erro ao carregar suas informações de perfil.",
        });
      }
      return null;
    }
  }, [queryClient]);

  const refreshProfile = useCallback(async () => {
    console.log('AuthContext: refreshProfile called. Current user:', user);
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  const refreshSessionAndUser = useCallback(async () => {
    console.log('AuthContext: refreshSessionAndUser called.');
    const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("AuthContext: Error refreshing session:", sessionError);
      setSession(null);
      setUser(null);
      setProfile(null);
      return;
    }
    setSession(currentSession);
    setUser(currentSession?.user ?? null);
    if (currentSession?.user) {
      console.log('AuthContext: Session refreshed, user found:', currentSession.user.id);
      await fetchProfile(currentSession.user.id);
    } else {
      console.log('AuthContext: Session refreshed, no user found. Clearing profile.');
      setProfile(null);
      queryClient.invalidateQueries({ queryKey: ['profile'] }); // Invalidate generic profile query
    }
  }, [fetchProfile, queryClient]);

  useEffect(() => {
    console.log('AuthContext: useEffect for onAuthStateChange mounted.');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: onAuthStateChange event:', event, 'session:', session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('AuthContext: onAuthStateChange - user found, fetching profile.');
          fetchProfile(session.user.id);
        } else {
          console.log('AuthContext: onAuthStateChange - no user found, clearing profile.');
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    console.log('AuthContext: Checking for existing session on initial load.');
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('AuthContext: Initial getSession result:', session);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('AuthContext: Initial session - user found, fetching profile.');
        await fetchProfile(session.user.id);
      } else {
        console.log('AuthContext: Initial session - no user found. Clearing profile.');
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => {
      console.log('AuthContext: useEffect for onAuthStateChange unmounted.');
      subscription.unsubscribe();
    };
  }, [fetchProfile, queryClient]); // Add queryClient to dependencies

  const signIn = async (emailOrUsername: string, password: string) => {
    console.log('AuthContext: signIn called for:', emailOrUsername);
    let loginEmail = emailOrUsername;

    // Special case for hardcoded admin login
    if (emailOrUsername === 'cardoso' && password === '123456') {
      const ADMIN_EMAIL = 'monitoramentoptckk@gmail.com';
      console.log('AuthContext: Attempting admin signIn with email:', ADMIN_EMAIL);
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: '123456',
      });

      if (!signInError) {
        const { data: { user: adminUser } } = await supabase.auth.getUser();
        if (adminUser) {
          const adminProfileData = await fetchProfile(adminUser.id);
          if (adminProfileData && !adminProfileData.is_active) {
            console.warn('AuthContext: Admin user is inactive. Signing out.');
            await supabase.auth.signOut();
            toast.error("Acesso Negado", {
              description: "Sua conta de administrador está inativa. Entre em contato com o suporte.",
            });
            return { error: new Error("Admin account is inactive.") };
          }
        }
        console.log('AuthContext: Admin signIn successful, refreshing session and user.');
        await refreshSessionAndUser();
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        return { error: null };
      } else {
        console.warn("AuthContext: Admin 'cardoso' not found or login failed, attempting to create via Edge Function...");
        const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-admin-user`;

        let edgeFunctionResponse;
        let edgeFunctionError = null;

        try {
          const response = await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              email: ADMIN_EMAIL,
              password: '123456',
              username: 'cardoso',
              full_name: 'Administrador Cardoso',
              role: 'admin',
              is_active: true,
            }),
          });

          edgeFunctionResponse = await response.json();

          if (!response.ok) {
            edgeFunctionError = new Error(edgeFunctionResponse.error || 'Failed to create admin user via Edge Function');
          }
        } catch (err: any) {
          edgeFunctionError = err;
        }

        if (edgeFunctionError) {
          console.error('AuthContext: Error creating admin via Edge Function:', edgeFunctionError);
          toast.error("Erro ao criar administrador", {
            description: edgeFunctionError.message,
          });
          return { error: edgeFunctionError };
        } else if (edgeFunctionResponse && (edgeFunctionResponse as any).error) {
          console.error('AuthContext: Edge Function returned application error:', (edgeFunctionResponse as any).error);
          toast.error("Erro ao criar administrador", {
            description: (edgeFunctionResponse as any).error,
          });
          return { error: new Error((edgeFunctionResponse as any).error) };
        }
        
        toast.info("Usuário administrador criado com sucesso!", {
          description: "Aguardando sincronização para login...",
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('AuthContext: Retrying admin signIn after Edge Function creation.');
        const { error: finalSignInError } = await supabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password: '123456',
        });
        if (finalSignInError) {
          console.error('AuthContext: Final signIn attempt failed:', finalSignInError);
          toast.error("Erro no login após criação", {
            description: finalSignInError.message,
          });
          return { error: finalSignInError };
        }
        const { data: { user: finalAdminUser } } = await supabase.auth.getUser();
        if (finalAdminUser) {
          const finalAdminProfileData = await fetchProfile(finalAdminUser.id);
          if (finalAdminProfileData && !finalAdminProfileData.is_active) {
            console.warn('AuthContext: Admin user is inactive after creation. Signing out.');
            await supabase.auth.signOut();
            toast.error("Acesso Negado", {
              description: "Sua conta de administrador está inativa. Entre em contato com o suporte.",
            });
            return { error: new Error("Admin account is inactive.") };
          }
        }
      }
      console.log('AuthContext: Admin signIn successful, refreshing session and user.');
      await refreshSessionAndUser();
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      return { error: null };
    }

    // Determine if input is email or username
    const isEmail = emailOrUsername.includes('@');

    if (!isEmail) {
      // If it's a username, find the corresponding email
      console.log('AuthContext: Attempting to sign in with username:', emailOrUsername);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', emailOrUsername)
        .single();

      if (profileError || !profileData?.email) {
        console.error('AuthContext: Profile not found or email missing for username:', emailOrUsername, profileError);
        toast.error("Erro no login", {
          description: "Usuário não encontrado ou email associado ausente.",
        });
        return { error: new Error("User not found or associated email missing.") };
      }
      loginEmail = profileData.email;
      console.log('AuthContext: Found email for username:', loginEmail);
    }

    console.log('AuthContext: Attempting regular signIn with email:', loginEmail);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error) {
      console.error('AuthContext: Regular signIn failed:', error);
      toast.error("Erro no login", {
        description: error.message,
      });
      return { error };
    } else {
      const { data: { user: loggedInUser } } = await supabase.auth.getUser();
      if (loggedInUser) {
        const userProfile = await fetchProfile(loggedInUser.id);
        if (userProfile && !userProfile.is_active) {
          console.warn('AuthContext: User account is inactive. Signing out.');
          await supabase.auth.signOut();
          toast.error("Acesso Negado", {
            description: "Sua conta está inativa. Por favor, aguarde a aprovação de um administrador.",
          });
          return { error: new Error("User account is inactive.") };
        }
      }
      console.log('AuthContext: Regular signIn successful, refreshing session and user.');
      await refreshSessionAndUser();
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }

    return { error: null };
  };

  const signUp = async (email: string, password: string, userData: { username: string; full_name: string; role?: 'admin' | 'user' }) => {
    console.log('AuthContext: signUp called for:', email);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: userData.username,
            full_name: userData.full_name,
            role: userData.role || 'user',
            is_active: false, // Explicitly set to false for self-registered users
            email: email, // Pass email to metadata for trigger
          },
          emailRedirectTo: window.location.origin, // Redirect back to app after email confirmation
        },
      });

      if (error) {
        console.error('AuthContext: signUp failed:', error);
        toast.error("Erro no cadastro", {
          description: error.message,
        });
        return { error };
      } else {
        console.log('AuthContext: signUp successful:', data);
        // User is created, email confirmation sent. Profile will be created by trigger.
        // No need to invalidate queries here, as the user is not yet active/logged in.
        return { error: null };
      }
    } catch (error: any) {
      console.error('AuthContext: Exception during signUp:', error);
      toast.error("Erro no cadastro", {
        description: error.message || "Ocorreu um erro inesperado durante o cadastro.",
      });
      return { error };
    }
  };

  const signOut = async () => {
    console.log('AuthContext: signOut function called.');
    
    const { data: { session: currentSupabaseSession } } = await supabase.auth.getSession();

    if (!currentSupabaseSession) {
      console.log('AuthContext: No active Supabase session found. Clearing local state directly.');
      setUser(null);
      setSession(null);
      setProfile(null);
      toast.success("Sessão encerrada", {
        description: "Você já estava desconectado.",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('AuthContext: Error signing out from Supabase:', error);
        toast.error("Erro ao sair", {
          description: error.message,
        });
      } else {
        console.log('AuthContext: Supabase signOut successful. Clearing local state.');
        // Add a small delay to allow the logout request to complete before clearing local state
        await new Promise(resolve => setTimeout(resolve, 100)); 
        setUser(null);
        setSession(null);
        setProfile(null);
      }
    } catch (error: any) {
      console.error('AuthContext: Unexpected error during signOut:', error);
      toast.error("Erro inesperado ao sair", {
        description: error.message,
      });
    } finally {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['inactiveUsers'] });
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};