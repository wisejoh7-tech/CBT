import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut, signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/src/lib/firebase';
import { UserProfile, Candidate } from '@/src/types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  candidate: Candidate | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, role: 'admin' | 'reg_admin' | 'super_admin') => Promise<void>;
  loginWithExamNumber: (examNumber: string) => Promise<void>;
  logOut: () => Promise<void>;
  devAdminLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // First check if it's a regular user profile
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const profileData = userDoc.data() as UserProfile;
          setProfile(profileData);
          setCandidate(null);
        } else {
          // If no user profile, check if this is an anonymous candidate session
          // We look for a profile linked to this UID or just check if they have a 'candidateId' in users collection
          // Actually, let's keep it simple: if you login with exam number, we tag you in the 'users' collection with role: 'student'
          // and link to candidate details.
          
          setProfile(null);
          setCandidate(null);
        }
      } else {
        setProfile(null);
        setCandidate(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || 'Staff User',
          role: 'admin',
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', user.uid), newProfile);
        setProfile(newProfile);
      } else {
        setProfile(userDoc.data() as UserProfile);
      }
    } catch (e: any) {
      if (e.code === 'auth/popup-blocked') {
        toast.error("Login popup was blocked. Please enable popups.");
      } else if (e.code === 'auth/cancelled-popup-request') {
        return;
      }
      console.error("Sign-in error:", e);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (e: any) {
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string, role: 'admin' | 'reg_admin' | 'super_admin') => {
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      const user = result.user;
      const newProfile: UserProfile = {
        uid: user.uid,
        email,
        displayName: name,
        role,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', user.uid), newProfile);
      setProfile(newProfile);
    } catch (e: any) {
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const loginWithExamNumber = async (examNumber: string) => {
    setLoading(true);
    try {
      // Step 1: Perform anonymous sign in FIRST
      // This establishes a session so that Firestore rules like 'if request.auth != null' are satisfied.
      const signResult = await signInAnonymously(auth);
      const user = signResult.user;

      // Step 2: Search for candidate record
      let candidateData: Candidate | null = null;
      
      const directDoc = await getDoc(doc(db, 'candidates', examNumber));
      if (directDoc.exists()) {
        candidateData = { id: directDoc.id, ...directDoc.data() } as Candidate;
      } else {
        // Fallback for legacy records or cases where ID isn't the exam number
        const q = query(collection(db, 'candidates'), where('examNumber', '==', examNumber));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          candidateData = { id: qSnap.docs[0].id, ...qSnap.docs[0].data() } as Candidate;
        }
      }
      
      if (!candidateData) {
        // If not found, log out the anonymous user to keep the environment clean
        await signOut(auth);
        throw new Error("Invalid Exam Number. Please contact the administrator.");
      }
      
      if (candidateData.status === 'suspended') {
        await signOut(auth);
        throw new Error("Your registration is suspended.");
      }

      // Step 3: Link session to candidate identity
      const profileData: UserProfile = {
        uid: user.uid,
        email: `${examNumber}@vivicbt.local`,
        displayName: candidateData.fullName,
        examNumber: candidateData.examNumber,
        faceUrl: candidateData.faceUrl || '',
        photoURL: candidateData.faceUrl || '',
        role: 'student',
        thumbprinted: candidateData.thumbprinted || false,
        subjectCombination: candidateData.subjectCombination || [],
        dateOfBirth: candidateData.dateOfBirth || '',
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', user.uid), profileData);
      setProfile(profileData);
      setCandidate(candidateData);
    } catch (e: any) {
      console.error("Login Sequence Failure:", e);
      if (e.code === 'permission-denied') {
        throw new Error("Permission Denied: Your Firestore rules are blocking authenticated anonymous users. Check your console rules.");
      }
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    await signOut(auth);
  };

  const devAdminLogin = async () => {
    setLoading(true);
    try {
      const signResult = await signInAnonymously(auth);
      const user = signResult.user;
      const profileData: UserProfile = {
        uid: user.uid,
        email: 'dev-admin@vivi-simulator.local',
        displayName: 'System Administrator (Dev)',
        role: 'super_admin',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', user.uid), profileData);
      setProfile(profileData);
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, candidate, loading, signIn, signInWithEmail, signUpWithEmail, loginWithExamNumber, logOut, devAdminLogin }}>
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
