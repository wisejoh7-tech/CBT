import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, Candidate } from '@/src/types';
import { toast } from 'sonner';
import { getApiUrl, safeJsonResponse, getFriendlyErrorMessage, apiFetch } from '@/src/lib/api-config';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  candidate: Candidate | null;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, role: 'admin' | 'reg_admin' | 'super_admin') => Promise<void>;
  loginWithExamNumber: (examNumber: string) => Promise<void>;
  loginCandidateWithEmail: (email: string, pass: string) => Promise<void>;
  devAdminLogin: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const savedProfile = localStorage.getItem('profile');

      if (token && savedProfile && savedProfile.trim() !== '' && savedProfile !== 'undefined') {
        try {
          const parsedProfile = JSON.parse(savedProfile);
          if (parsedProfile && typeof parsedProfile === 'object') {
            const standardizedProfile = {
              ...parsedProfile,
              displayName: parsedProfile?.displayName || parsedProfile?.fullName,
              uid: parsedProfile?.uid || parsedProfile?.id || parsedProfile?.examNumber
            };
            setProfile(standardizedProfile);
            setUser({ uid: standardizedProfile.uid });
            if (standardizedProfile?.role === 'student') {
              setCandidate(standardizedProfile);
            }
          }
        } catch (e) {
          console.error("Auth restoration failed", e);
          localStorage.removeItem('token');
          localStorage.removeItem('profile');
        }
      } else if (savedProfile === 'undefined' || savedProfile === '') {
        localStorage.removeItem('profile');
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await apiFetch(getApiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });

      const data = await safeJsonResponse(res);

      if (!data || !data.user) {
        throw new Error("User not found or invalid response received");
      }

      const userId = data.user?.id || data.user?.uid || data.user?.email;
      localStorage.setItem('token', data.token);
      localStorage.setItem('profile', JSON.stringify(data.user));

      setProfile(data.user);
      setUser({ uid: userId });
      toast.success("Welcome back, " + (data.user.displayName || "User"));
    } catch (e: any) {
      toast.error(getFriendlyErrorMessage(e));
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string, role: 'admin' | 'reg_admin' | 'super_admin') => {
    setLoading(true);
    try {
      const res = await apiFetch(getApiUrl('/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass, displayName: name, role }),
      });

      await safeJsonResponse(res);

      toast.success("Account created successfully. Please login.");
    } catch (e: any) {
      toast.error(getFriendlyErrorMessage(e));
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const loginWithExamNumber = async (examNumber: string) => {
    setLoading(true);
    try {
      const res = await apiFetch(getApiUrl('/auth/candidate-login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examNumber }),
      });
      
      const data = await safeJsonResponse(res);

      if (!data || !data.profile) {
        throw new Error("User not found or invalid profile data received");
      }

      const profileData: UserProfile = {
        ...data.profile,
        uid: data.profile?.examNumber || data.profile?.id,
        displayName: data.profile?.fullName || data.profile?.displayName,
        role: 'student',
        loginMethod: 'examNumber'
      };

      localStorage.setItem('token', data.token);
      localStorage.setItem('profile', JSON.stringify(profileData));

      setProfile(profileData);
      setCandidate(data.profile);
      setUser({ uid: profileData.uid });

    } catch (e: any) {
      console.error("Login Sequence Failure:", e);
      toast.error(getFriendlyErrorMessage(e));
      throw new Error(getFriendlyErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const loginCandidateWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await apiFetch(getApiUrl('/auth/candidate/login-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });

      const data = await safeJsonResponse(res);

      if (!data || !data.profile) {
        throw new Error("User not found or invalid profile data received");
      }

      const profileData: UserProfile = {
        ...data.profile,
        uid: data.profile?.examNumber || data.profile?.id,
        displayName: data.profile?.fullName || data.profile?.displayName,
        role: 'student',
        loginMethod: 'email'
      };

      localStorage.setItem('token', data.token);
      localStorage.setItem('profile', JSON.stringify(profileData));

      setProfile(profileData);
      setCandidate(data.profile);
      setUser({ uid: profileData.uid });

    } catch (e: any) {
      toast.error(getFriendlyErrorMessage(e));
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('profile');
    setUser(null);
    setProfile(null);
    setCandidate(null);
    toast.success("Logged out successfully");
  };

  const devAdminLogin = async () => {
    // In dev, we can just log in with the default seeded admin
    await signInWithEmail("admin@vivicbt.com", "admin123");
  };

  return (
    <AuthContext.Provider value={{
      user, profile, candidate, loading,
      signInWithEmail, signUpWithEmail, loginWithExamNumber,
      loginCandidateWithEmail, devAdminLogin, logOut
    }}>
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
