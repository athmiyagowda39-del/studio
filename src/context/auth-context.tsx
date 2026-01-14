'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useUsers, AppUser } from './users-context';

type User = {
  username: string;
  role: string;
  email: string;
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { users } = useUsers(); // We still need this to get role info

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        // Find the matching user in our user data to get role and username
        const appUser = users.find(u => u.email.toLowerCase() === fbUser.email?.toLowerCase());
        if (appUser) {
          setUser({
            username: appUser.username,
            role: appUser.role,
            email: appUser.email
          });
        } else {
          // If user exists in Firebase Auth but not in our user list,
          // it's an inconsistent state. For now, log them out.
          setUser(null);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [users]);


  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    router.push('/dashboard');
  };

  const logout = async () => {
    await signOut(auth);
    // Clearing local storage is still a good practice to remove any other app data.
    localStorage.clear(); 
    // This redirect should be enough, Firebase state change will handle the rest.
    router.push('/login');
    // A full reload can also help ensure clean state.
    window.location.href = '/login';
  };

  const value = {
    isAuthenticated: !!firebaseUser,
    user,
    firebaseUser,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
