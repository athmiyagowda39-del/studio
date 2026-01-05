'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
  useCallback,
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
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (oldPass: string, newPass: string) => Promise<boolean>;
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
          role: (userData.type as UserRole) || 'admin',
        };
      } else {
        // If the user exists in Auth but not Firestore (e.g. first login of default admin)
        // create the document.
        const username = currentFirebaseUser.email?.split('@')[0] || 'admin';
        const newUserDoc = {
          id: currentFirebaseUser.uid,
          username: username,
          type: 'admin',
          lastLogin: new Date().toISOString(),
        };
        await setDoc(userDocRef, newUserDoc);
        return {
          uid: currentFirebaseUser.uid,
          username: username,
          role: 'admin' as UserRole,
        };
      }
    },
    [firestore]
  );

  useEffect(() => {
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
  }, [isFirebaseUserLoading, firebaseUser, fetchUserRole]);

  const login = async (username: string, pass: string): Promise<boolean> => {
    if (!auth || !firestore) return false;
    
    const email = `${username.toLowerCase()}@example.com`;

    setIsAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      router.push('/');
      return true;
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // If the user does not exist, create it. This is useful for first-time setup.
        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            pass
          );
          // The useEffect hook will handle fetching/creating the user role document.
          router.push('/');
          return true;
        } catch (creationError) {
          console.error('Failed to create default admin user:', creationError);
          setIsAuthLoading(false);
          return false;
        }
      }
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

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isAuthLoading,
        login,
        logout,
        changePassword,
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
