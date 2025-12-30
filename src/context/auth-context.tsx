
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
  signInWithCredential,
  EmailAuthCredential,
  EmailAuthProvider,
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

// Function to seed initial users if they don't exist
const seedInitialUsers = async (auth: any, firestore: any) => {
  const usersToSeed = [
    { email: 'manager@test.com', password: 'password', username: 'Manager', role: 'Manager' as UserRole },
    { email: 'executive@test.com', password: 'password', username: 'Executive', role: 'Executive' as UserRole },
  ];

  // Temporarily sign in to perform admin-like operations for seeding.
  // In a real app, this would be a secure admin process.
  const tempAdminEmail = 'admin-seeder@temp.com';
  const tempAdminPassword = 'temp-password-seeder';
  let tempAdminCredential;
  try {
    tempAdminCredential = await signInWithEmailAndPassword(auth, tempAdminEmail, tempAdminPassword);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      tempAdminCredential = await createUserWithEmailAndPassword(auth, tempAdminEmail, tempAdminPassword);
    } else {
      console.error("Failed to sign in or create temporary admin for seeding:", error);
      return;
    }
  }


  for (const userSeed of usersToSeed) {
    try {
      // The operation of creating user is now done by a temporary admin user.
      const userCredential = await createUserWithEmailAndPassword(auth, userSeed.email, userSeed.password);
      const newUser = userCredential.user;
      const userRef = doc(firestore, 'users', newUser.uid);
      const userData: User = { uid: newUser.uid, username: userSeed.username, role: userSeed.role };
      await setDoc(userRef, userData);

      if (userSeed.role === 'Manager') {
        const managerRef = doc(firestore, 'roles_manager', newUser.uid);
        await setDoc(managerRef, { uid: newUser.uid });
      }
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        // User already exists, which is fine for seeding.
      } else {
        // Log other errors for debugging.
        console.error('Error seeding user:', userSeed.email, error);
      }
    }
  }
  
  // Important: Sign out the temporary admin user to restore normal auth state.
  if (auth.currentUser?.email === tempAdminEmail) {
    await signOut(auth);
  }
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const {
    user: firebaseUser,
    isUserLoading: isAuthLoading,
    userError,
  } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [isSeeding, setIsSeeding] = useState(true);

  useEffect(() => {
    const seed = async () => {
        if (auth && firestore) {
            await seedInitialUsers(auth, firestore);
            setIsSeeding(false);
        }
    };
    seed();
  }, [auth, firestore]);

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
    if (!auth.currentUser) return false;
    
    try {
        const credential = EmailAuthProvider.credential(auth.currentUser.email!, oldPass);
        // Re-authenticate user before changing password
        await signInWithCredential(auth, credential as any);
        // Now change password
        // This is a placeholder as re-authentication is complex.
        console.warn("Password change requires re-authentication, which is not fully implemented here.");
        return false; // For now, we will return false
    } catch (error) {
        console.error("Failed to re-authenticate for password change", error);
        return false;
    }
  };

  const isAuthenticated = !!firebaseUser && !!user;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        firebaseUser,
        isAuthLoading: isAuthLoading || isSeeding,
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
