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
  const { users } = useUsers(); 

  useEffect(() => {
    const localUserJson = typeof window !== 'undefined' ? localStorage.getItem('loggedInUser') : null;
    if (localUserJson) {
      const localUser = JSON.parse(localUserJson);
      setUser(localUser);
    }
    setIsLoading(false);
  }, []);


  const login = async (email: string, password: string) => {
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (foundUser) {
        const userToSave = {
            username: foundUser.username,
            role: foundUser.role,
            email: foundUser.email,
        };
        localStorage.setItem('loggedInUser', JSON.stringify(userToSave));
        setUser(userToSave);
        router.push('/dashboard');
    } else {
        throw new Error("Invalid email or password");
    }
  };

  const logout = async () => {
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('lastLoginDate');
    setUser(null);
    setFirebaseUser(null);
    // A full reload can also help ensure clean state.
    window.location.href = '/login';
  };

  const value = {
    isAuthenticated: !!user,
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
