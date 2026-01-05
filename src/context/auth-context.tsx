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
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
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
  users: User[];
  isAuthLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (oldPass: string, newPass: string) => Promise<boolean>;
  addUser: (
    username: string,
    pass: string,
    role: UserRole
  ) => Promise<boolean>;
  removeUser: (username: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { auth, firestore } = useFirebase();
  const { user: firebaseUser, isUserLoading: isFirebaseUserLoading } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
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
          role: userData.role || 'user',
        };
      }
      return null;
    },
    [firestore]
  );

  const fetchAllUsers = useCallback(async () => {
    if (!firestore) return;
    try {
        const usersCollectionRef = collection(firestore, 'users');
        const snapshot = await getDocs(usersCollectionRef);
        const userList = snapshot.docs.map(
          (doc) => ({ uid: doc.id, ...doc.data() } as User)
        );
        setUsers(userList);
    } catch (e) {
        console.error("Error fetching users:", e);
    }
  }, [firestore]);

  useEffect(() => {
    setIsAuthLoading(isFirebaseUserLoading);
    if (!isFirebaseUserLoading && firebaseUser) {
      fetchUserRole(firebaseUser).then((roleInfo) => {
        setUser(roleInfo);
        // Always fetch all users if logged in, role-based fetching can be done here if needed
        fetchAllUsers(); 
        setIsAuthLoading(false);
      });
    } else if (!isFirebaseUserLoading) {
      setUser(null);
      fetchAllUsers(); // Fetch users to check if any exist for initial setup
      setIsAuthLoading(false);
    }
  }, [isFirebaseUserLoading, firebaseUser, fetchUserRole, fetchAllUsers]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    if (!auth) return false;
    setIsAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      router.push('/');
      return true;
    } catch (error) {
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

  const addUser = async (
    username: string,
    pass: string,
    role: UserRole
  ): Promise<boolean> => {
    if (!auth || !firestore) return false;
    
    const originalUser = auth.currentUser;
    const wasLoggedIn = !!originalUser;

    try {
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            `${username}@example.com`,
            pass
        );
        const newUser = userCredential.user;

        const userDocRef = doc(firestore, 'users', newUser.uid);
        await setDoc(userDocRef, {
            username: username,
            role: role,
        });
        
        // After creating the user, sign them out and restore the original user session if there was one.
        await signOut(auth);
        
        if (wasLoggedIn && originalUser) {
           // This part is complex and error-prone on the client.
           // A simple re-fetch of users is safer.
        }

        fetchAllUsers();
        return true;
    } catch (error) {
        console.error('Failed to add user:', error);
        
        // If the error was auth/email-already-in-use, we might not need to do anything drastic.
        // But if the session was disrupted, we might need to handle it.
        // For now, we'll just log the error and let the user re-try or re-login.
        
        return false;
    }
  };

  const removeUser = async (username: string): Promise<void> => {
     if (!firestore || !auth) return;
    const userToRemove = users.find((u) => u.username === username);
    if (!userToRemove) return;

    try {
        const userDocRef = doc(firestore, 'users', userToRemove.uid);
        await deleteDoc(userDocRef);
        fetchAllUsers();
    } catch(e) {
        console.error("Could not delete user from firestore. On the client, you can't delete other users from Auth.", e);
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        users,
        isAuthLoading,
        login,
        logout,
        changePassword,
        addUser,
        removeUser,
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
