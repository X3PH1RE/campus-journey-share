
import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { UserProfile } from '@/types/profile';

type Profile = Database['public']['Tables']['profiles']['Row'];

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isDriver: boolean;
  toggleDriverMode: () => void;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setProfile(data as Profile);
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast('Error fetching profile', {
        description: 'Please try refreshing the page.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      toast('Sign in failed', {
        description: error.message,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function signUp(email: string, password: string, username: string) {
    try {
      setIsLoading(true);
      
      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          }
        }
      });

      if (error) {
        throw error;
      }

      // Profile will be created by the database trigger
    } catch (error: any) {
      toast('Sign up failed', {
        description: error.message,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function signOut() {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error: any) {
      toast('Sign out failed', {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const toggleDriverMode = async () => {
    if (!profile || !user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_driver: !profile.is_driver })
        .eq('id', user.id);

      if (error) throw error;
      
      setProfile({
        ...profile,
        is_driver: !profile.is_driver,
      });
      
      toast('Switched mode', {
        description: `You are now in ${!profile.is_driver ? 'driver' : 'rider'} mode.`,
      });
    } catch (error: any) {
      toast('Failed to switch mode', {
        description: error.message,
      });
    }
  };

  // Add the updateProfile function
  const updateProfile = async (profileData: Partial<UserProfile>) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      if (error) throw error;
      
      // Update local profile state with the new data
      setProfile(prev => {
        if (!prev) return null;
        return { ...prev, ...profileData } as Profile;
      });
      
      toast('Profile updated', {
        description: 'Your profile information has been updated successfully.',
      });
    } catch (error: any) {
      toast('Failed to update profile', {
        description: error.message,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const isDriver = profile?.is_driver || false;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isDriver,
        toggleDriverMode,
        isLoading,
        signIn,
        signUp,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
