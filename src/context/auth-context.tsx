
'use client';

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, firestore as db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { AppUser } from './users-context';

type AuthContextType = {
  isAuthenticated: boolean;
  user: AppUser | null; // The current user (can be the impersonated one)
  originalUser: AppUser | null; // The originally logged-in user (admin)
  isImpersonating: boolean;
  isLoading: boolean;
  isReadOnly: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  impersonate: (userToImpersonate: AppUser) => void;
  stopImpersonation: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [originalUser, setOriginalUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // User is signed in with Firebase Auth, fetch their profile from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const loggedInUser = { id: userDoc.id, ...userDoc.data() } as AppUser;
          setOriginalUser(loggedInUser);

          // Check for impersonation
          const storedImpersonatedUser = localStorage.getItem('impersonatedUser');
          if (storedImpersonatedUser) {
            const impersonated = JSON.parse(storedImpersonatedUser);
            // Verify that the original user is still an admin
            if (['Admin', 'Sub Admin', 'Super Admin'].includes(loggedInUser.role)) {
              setUser(impersonated);
            } else {
              // If original user is no longer admin, stop impersonation
              localStorage.removeItem('impersonatedUser');
              setUser(loggedInUser);
            }
          } else {
            setUser(loggedInUser);
          }
        } else {
          // Auth user exists but no Firestore profile, log them out
          await signOut(auth);
          setUser(null);
          setOriginalUser(null);
        }
      } else {
        // No user is signed in
        setUser(null);
        setOriginalUser(null);
        localStorage.removeItem('impersonatedUser');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will handle setting the user state and redirection
    router.push('/dashboard');
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem('impersonatedUser');
    // onAuthStateChanged will handle setting user state to null
    router.push('/login');
  };

  const impersonate = (userToImpersonate: AppUser) => {
    if (originalUser && ['Admin', 'Sub Admin', 'Super Admin'].includes(originalUser.role)) {
      localStorage.setItem('impersonatedUser', JSON.stringify(userToImpersonate));
      setUser(userToImpersonate);
      router.push('/dashboard');
    }
  };

  const stopImpersonation = () => {
    localStorage.removeItem('impersonatedUser');
    setUser(originalUser);
    router.push('/users');
  };

  const isImpersonating = !!(originalUser && user && originalUser.id !== user.id);
  const isReadOnly = isImpersonating;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!originalUser,
        user,
        originalUser,
        isImpersonating,
        isLoading,
        isReadOnly,
        login,
        logout,
        impersonate,
        stopImpersonation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
