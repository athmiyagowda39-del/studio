
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, firestore as db } from '@/lib/firebase';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export type AppUser = {
  id: string;
  username: string;
  email: string;
  role: 'Super Admin' | 'Admin' | 'Sub Admin' | 'Executive';
  password?: string; // Only used for creation/migration, not stored in Firestore
  phoneNumber?: string;
};

type UsersContextType = {
  users: AppUser[];
  addUser: (user: Omit<AppUser, 'id'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<Omit<AppUser, 'id'>>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
};

const UsersContext = createContext<UsersContextType | undefined>(undefined);

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>([]);

  // Listen for real-time updates to the users collection
  useEffect(() => {
    const usersCollection = collection(db, 'users');
    const unsubscribe = onSnapshot(usersCollection, (snapshot) => {
      const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser));
      setUsers(userList);
    }, (error) => {
        console.error("Error listening to users collection:", error);
    });
    return () => unsubscribe();
  }, []);

  const addUser = async (userData: Omit<AppUser, 'id'>) => {
      if (!userData.password) throw new Error("Password is required to create a user.");
      
      // 1. Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const uid = userCredential.user.uid;

      // 2. Create user profile document in Firestore
      const { password, ...profileData } = userData; // Don't store password in Firestore
      const userDocRef = doc(db, 'users', uid);
      await setDoc(userDocRef, profileData);
  };

  const updateUser = async (id: string, updates: Partial<Omit<AppUser, 'id'>>) => {
    const { password, ...firestoreUpdates } = updates;
    const userDocRef = doc(db, 'users', id);
    await updateDoc(userDocRef, firestoreUpdates);
    // Note: Password updates must be handled separately using updatePassword in Firebase Auth
  };

  const deleteUser = async (id: string) => {
    // This only deletes the Firestore record, not the Firebase Auth user.
    // Deleting an auth user from the client is a restricted operation.
    // This effectively disables the user in the app, but their auth record remains.
    const userDocRef = doc(db, 'users', id);
    await deleteDoc(userDocRef);
  };


  const value = {
    users,
    addUser,
    updateUser,
    deleteUser,
  };

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsers() {
  const context = useContext(UsersContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UsersProvider');
  }
  return context;
}
