'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
  useCallback,
  useMemo,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  Auth,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  query,
  limit,
} from 'firebase/firestore';
import { useFirebase, useUser } from '@/firebase';

type UserRole = 'admin' | 'user';

type User = {
  uid: string;
  username: string;
  role: UserRole;
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  isAuthLoading: boolean;
  needsSetup: boolean;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (oldPass: string, newPass: string) => Promise<boolean>;
  createUser: (
    username: string,
    pass: string,
    role: UserRole
  ) => Promise<{ success: boolean; message: string }>;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { auth, firestore } = useFirebase();
  const { user: firebaseUser, isUserLoading: isFirebaseUserLoading } =
    useUser();

  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(true); // Assume setup is needed until checked
  const router = useRouter();

  const fetchUserRole = useCallback(
    async (currentFirebaseUser: FirebaseUser) => {
      if (!firestore) return null;
      const userDocRef = doc(firestore, 'users', currentFirebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          uid: currentFirebaseUser.uid,
          username:
            userData.username || currentFirebaseUser.email || 'Unnamed',
          role: (userData.type as UserRole) || 'user',
        };
      }
      return null; // User exists in Auth but not in Firestore, might be an issue
    },
    [firestore]
  );

  const checkInitialSetup = useCallback(async () => {
    if (!firestore) return;
    setIsAuthLoading(true);
    try {
      const usersCollectionRef = collection(firestore, 'users');
      const q = query(usersCollectionRef, limit(1));
      const querySnapshot = await getDocs(q);
      setNeedsSetup(querySnapshot.empty);
    } catch (e) {
      console.error('Error checking for users, assuming setup is needed:', e);
      setNeedsSetup(true);
    } finally {
      setIsAuthLoading(false);
    }
  }, [firestore]);

  useEffect(() => {
    checkInitialSetup();
  }, [checkInitialSetup]);

  useEffect(() => {
    if (!needsSetup) {
      setIsAuthLoading(isFirebaseUserLoading);
      if (!isFirebaseUserLoading && firebaseUser) {
        fetchUserRole(firebaseUser).then((roleInfo) => {
          setUser(roleInfo);
          setIsAuthLoading(false);
        });
      } else if (!isFirebaseUserLoading) {
        setUser(null);
        setIsAuthLoading(false);
      }
    }
  }, [isFirebaseUserLoading, firebaseUser, fetchUserRole, needsSetup]);

  const login = async (username: string, pass: string): Promise<boolean> => {
    if (!auth || !firestore) return false;
    const email = `${username.toLowerCase()}@example.com`;

    setIsAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      router.push('/');
      return true;
    } catch (error: any) {
      console.error('Login failed:', error);
      setIsAuthLoading(false);
      return false;
    }
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    router.push('/login');
  };

  const changePassword = async (
    oldPass: string,
    newPass: string
  ): Promise<boolean> => {
    if (!auth?.currentUser) return false;
    try {
      const email = auth.currentUser.email;
      if (!email) return false;
      const credential = EmailAuthProvider.credential(email, oldPass);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPass);
      return true;
    } catch (error) {
      console.error('Password change failed:', error);
      return false;
    }
  };

  const createUser = async (
    username: string,
    pass: string,
    role: UserRole
  ): Promise<{ success: boolean; message: string }> => {
    if (!auth || !firestore) {
      return { success: false, message: 'Firebase not initialized.' };
    }

    const email = `${username.toLowerCase()}@example.com`;

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        pass
      );
      const newFirebaseUser = userCredential.user;

      // Create user document in Firestore
      const userDocRef = doc(firestore, 'users', newFirebaseUser.uid);
      await setDoc(userDocRef, {
        id: newFirebaseUser.uid,
        username: username,
        type: role,
        lastLogin: new Date().toISOString(),
      });

      // After successful creation, update the setup status
      await checkInitialSetup();

      return { success: true, message: 'User created successfully.' };
    } catch (error: any) {
      console.error('Error creating user:', error);
      if (error.code === 'auth/email-already-in-use') {
        return { success: false, message: 'This username is already taken.' };
      }
      return { success: false, message: 'Failed to create user.' };
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isAuthLoading,
        needsSetup,
        login,
        logout,
        changePassword,
        createUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
