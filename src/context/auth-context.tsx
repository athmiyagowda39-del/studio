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
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  DocumentData,
} from 'firebase/firestore';
import { useFirebase, useUser } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

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
  login: (username: string, pass: string) => Promise<boolean>;
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
  const { auth, firestore, isUserLoading } = useFirebase();
  const { user: firebaseUser } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const router = useRouter();

  const fetchUserRole = useCallback(
    async (firebaseUser: FirebaseUser) => {
      if (!firestore) return null;
      const userDocRef = doc(firestore, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          uid: firebaseUser.uid,
          username:
            userData.username || firebaseUser.email || 'Unnamed',
          role: userData.role || 'user',
        };
      }
      return null;
    },
    [firestore]
  );

  const fetchAllUsers = useCallback(async () => {
    if (!firestore) return;
    const usersCollectionRef = collection(firestore, 'users');
    const snapshot = await getDocs(usersCollectionRef);
    const userList = snapshot.docs.map(
      (doc) =>
        ({
          uid: doc.id,
          ...doc.data(),
        } as User)
    );
    setUsers(userList);
  }, [firestore]);

  useEffect(() => {
    setIsAuthLoading(isUserLoading);
    if (!isUserLoading && firebaseUser) {
      fetchUserRole(firebaseUser).then((roleInfo) => {
        setUser(roleInfo);
        setIsAuthLoading(false);
      });
      fetchAllUsers();
    } else if (!isUserLoading) {
      setUser(null);
      setIsAuthLoading(false);
    }
  }, [isUserLoading, firebaseUser, fetchUserRole, fetchAllUsers]);

  const login = async (username: string, pass: string): Promise<boolean> => {
    if (!auth) return false;
    setIsAuthLoading(true);
    try {
      // Assuming email is username for login
      await signInWithEmailAndPassword(auth, `${username}@example.com`, pass);
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
    // Re-authentication is needed for security-sensitive operations
    try {
      const email = auth.currentUser.email;
      if (!email) return false;
      await signInWithEmailAndPassword(auth, email, oldPass);
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
    try {
      // Note: This creates a user in Firebase Auth.
      // It's not standard to do this from the client-side in a real app
      // without proper admin rights, but for this context it's okay.
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        `${username}@example.com`,
        pass
      );
      const newUser = userCredential.user;

      // Now, store the user's role and username in Firestore.
      const userDocRef = doc(firestore, 'users', newUser.uid);
      await setDoc(userDocRef, {
        username: username,
        role: role,
      });

      // Refresh the list of users
      fetchAllUsers();
      return true;
    } catch (error) {
      console.error('Failed to add user:', error);
      return false;
    }
  };

  const removeUser = async (username: string): Promise<void> => {
    if (!firestore) return;
    const userToRemove = users.find((u) => u.username === username);
    if (!userToRemove) return;

    // In a real app, deleting a user from Auth requires admin privileges and a backend.
    // Here, we'll just remove them from the Firestore 'users' collection.
    const userDocRef = doc(firestore, 'users', userToRemove.uid);
    await deleteDoc(userDocRef);
    fetchAllUsers(); // Refresh user list
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
