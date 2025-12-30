
'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from 'react';
import { useUser, useAuth } from '@/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

type UserRole = 'Manager' | 'Executive';

type User = {
  uid: string;
  username: string;
  role: UserRole;
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (oldPass: string, newPass: string) => Promise<boolean>;
  addUser: (
    email: string,
    pass: string,
    username: string,
    role: UserRole
  ) => Promise<string | null>;
  deleteUser: (uid: string) => Promise<boolean>;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const {
    user: firebaseUser,
    isUserLoading: isAuthLoading,
    userError,
  } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (firebaseUser) {
      const userRef = doc(firestore, 'users', firebaseUser.uid);
      getDoc(userRef).then((docSnap) => {
        if (docSnap.exists()) {
          setUser(docSnap.data() as User);
        } else {
          // Handle case where user exists in Auth but not in Firestore
          setUser(null);
        }
      });
    } else {
      setUser(null);
    }
  }, [firebaseUser, firestore]);

  const login = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      return true;
    } catch (error) {
      console.error('Login failed', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const addUser = async (
    email: string,
    pass: string,
    username: string,
    role: UserRole
  ) => {
    try {
      // Note: This is not a secure way to create users.
      // In a real app, this should be done via a backend/admin SDK.
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        pass
      );
      const newUser = userCredential.user;
      const userRef = doc(firestore, 'users', newUser.uid);
      const userData: User = { uid: newUser.uid, username, role };
      await setDoc(userRef, userData);

      // If manager, add to manager collection
      if (role === 'Manager') {
        const managerRef = doc(firestore, 'roles_manager', newUser.uid);
        await setDoc(managerRef, { uid: newUser.uid });
      }

      return newUser.uid;
    } catch (error) {
      console.error('Failed to add user:', error);
      return null;
    }
  };

  const deleteUser = async (uid: string) => {
    // This is a placeholder. Deleting users requires Admin SDK.
    console.warn(
      'User deletion is a privileged operation and requires Admin SDK.'
    );
    // In a real app, you would call a Cloud Function to do this.
    return false;
  };

  const changePassword = async (oldPass: string, newPass: string) => {
    // Firebase doesn't have a direct "change password" method with old password.
    // Re-authentication is the standard flow.
    console.warn('Password change requires re-authentication, which is not implemented in this mock.');
    return false;
  };

  const isAuthenticated = !!firebaseUser && !!user;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        firebaseUser,
        isAuthLoading,
        login,
        logout,
        changePassword,
        addUser,
        deleteUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
