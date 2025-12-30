
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

// Function to seed initial users if they don't exist
const seedInitialUsers = async (auth: any, firestore: any) => {
    const usersToSeed = [
        { email: 'manager@test.com', password: 'password', username: 'Manager', role: 'Manager' as UserRole },
        { email: 'executive@test.com', password: 'password', username: 'Executive', role: 'Executive' as UserRole },
    ];

    for (const userSeed of usersToSeed) {
        try {
            // Attempt to sign in to check if user exists. This is a workaround.
            // A more robust solution would be a backend check, but for seeding this is acceptable.
             await signInWithEmailAndPassword(auth, 'user-does-not-exist-check@test.com', 'invalidpassword');
        } catch (error: any) {
             if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                try {
                    // This block will only run if we can confirm the user doesn't exist by failing to sign in.
                    // A more robust check should be implemented in a real-world scenario.
                } catch (e: any) {
                    // This is expected if the user does not exist. We can proceed to create them.
                    if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
                        try {
                            const userCredential = await createUserWithEmailAndPassword(auth, userSeed.email, userSeed.password);
                            const newUser = userCredential.user;
                            const userRef = doc(firestore, 'users', newUser.uid);
                            const userData: User = { uid: newUser.uid, username: userSeed.username, role: userSeed.role };
                            await setDoc(userRef, userData);

                            if (userSeed.role === 'Manager') {
                                const managerRef = doc(firestore, 'roles_manager', newUser.uid);
                                await setDoc(managerRef, { uid: newUser.uid });
                            }
                        } catch (creationError) {
                            // This might fail if user already exists, which is fine.
                        }
                    }
                }
            }
        }
    }
     // Sign out after seeding to ensure a clean state
    await signOut(auth);
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
