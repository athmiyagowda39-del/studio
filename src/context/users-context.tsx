
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, firestore as db } from '@/lib/firebase';
import { collection, doc, getDocs, onSnapshot, setDoc, updateDoc, deleteDoc, writeBatch, query, limit } from 'firebase/firestore';

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

// The default users to seed the database with if it's empty
const defaultUsers: Omit<AppUser, 'id'>[] = [
    { username: 'Athmiya.ag', email: 'athmiya.ag@peopleworks.in', role: 'Super Admin', password: 'Welcome123#' },
    { username: 'Varghese Vincent', email: 'Varghese@peopleworks.in', role: 'Admin', password: 'Varghese@123', phoneNumber: 'N/A' },
    { username: 'sam.devasia', email: 'sam.devasia@peopleworks.in', role: 'Admin', password: 'SamDev@456', phoneNumber: 'N/A' },
    { username: 'Luke Rajkumar', email: 'Luke.rajkumar@peopleworks.in', role: 'Admin', password: 'Luke@123', phoneNumber: '9500038277' },
    { username: 'Yathish G', email: 'yathish.g@peopleworks.in', role: 'Sub Admin', password: 'Yathish@789', phoneNumber: '8553309892' },
    { username: 'Mandanna N', email: 'mandanna.n@peopleworks.in', role: 'Executive', password: 'Mandanna@101', phoneNumber: '9845622777' },
    { username: 'Hukum Chand Kewat', email: 'hukum@peopleworks.in', role: 'Executive', password: 'Hukum@112', phoneNumber: '9036010968' },
    { username: 'Hemant Sharma', email: 'hemant.sharma@peopleworks.in', role: 'Executive', password: 'Password123' },
    { username: 'Keerthi Taduru', email: 'keerth.taduru@peopleworks.in', role: 'Executive', password: 'keerthi789' },
    { username: 'Akshay Azariah', email: 'Akshay.azariah@peopleworks.in', role: 'Executive', password: 'Password123' },
];

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>([]);

  // One-time check to seed the database with default users if it's empty
  useEffect(() => {
    const seedUsers = async () => {
      const usersCollection = collection(db, 'users');
      const q = query(usersCollection, limit(1));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log("Firestore 'users' collection is empty. Seeding default users...");
        const tempAuth = auth; // Use a temporary auth instance for seeding
        
        for (const user of defaultUsers) {
            if (!user.password) continue;
            try {
                // Create user in Firebase Auth
                const userCredential = await createUserWithEmailAndPassword(tempAuth, user.email, user.password);
                const uid = userCredential.user.uid;
                
                // Create user profile in Firestore
                const userDocRef = doc(db, 'users', uid);
                const { password, ...profileData } = user; // Exclude password from Firestore doc
                await setDoc(userDocRef, profileData);
                 console.log(`Successfully created user: ${user.email}`);
            } catch (error: any) {
                if (error.code === 'auth/email-already-in-use') {
                    console.warn(`User ${user.email} already exists in Auth. Skipping.`);
                } else {
                    console.error(`Failed to create user ${user.email}:`, error);
                }
            }
        }
        console.log("Default user seeding process complete.");
      }
    };
    seedUsers();
  }, []);

  // Listen for real-time updates to the users collection
  useEffect(() => {
    const usersCollection = collection(db, 'users');
    const unsubscribe = onSnapshot(usersCollection, (snapshot) => {
      const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser));
      setUsers(userList);
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
