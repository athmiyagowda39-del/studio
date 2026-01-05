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
  writeBatch,
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
  
  const createDefaultAdmin = useCallback(async () => {
    if (!auth || !firestore) return;
     try {
      const adminEmail = 'admin@example.com';
      const adminPass = 'password';
      
      // We don't need to create the user, just their profile if they authenticated
      // but don't have one. For the default admin, we must create it.
      // This is a simplified bootstrap, in a real app this would be a setup script.
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
      const newUser = userCredential.user;
      
      const userDocRef = doc(firestore, 'users', newUser.uid);
      await setDoc(userDocRef, {
        username: 'admin',
        role: 'admin',
      });
      console.log('Default admin user created and profile stored.');

      // Sign the new admin user out so the login screen is presented
      await signOut(auth);

    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
           // This is expected if the admin already exists, do nothing.
           return;
        } else {
          console.error('Failed to create default admin user:', error);
        }
    }
  }, [auth, firestore]);

  const fetchAllUsers = useCallback(async () => {
    if (!firestore) return;
    try {
        const usersCollectionRef = collection(firestore, 'users');
        const snapshot = await getDocs(usersCollectionRef);
        
        if (snapshot.empty) {
            await createDefaultAdmin();
            // After creating, refetch to update the list
            const newSnapshot = await getDocs(usersCollectionRef);
            const userList = newSnapshot.docs.map(
              (doc) => ({ uid: doc.id, ...doc.data() } as User)
            );
            setUsers(userList);

        } else {
            const userList = snapshot.docs.map(
              (doc) => ({ uid: doc.id, ...doc.data() } as User)
            );
            setUsers(userList);
        }
    } catch (e) {
        console.error("Error fetching users:", e);
    }
  }, [firestore, createDefaultAdmin]);

  useEffect(() => {
    setIsAuthLoading(isFirebaseUserLoading);
    if (!isFirebaseUserLoading && firebaseUser) {
      fetchUserRole(firebaseUser).then((roleInfo) => {
        setUser(roleInfo);
        if (roleInfo?.role === 'admin') {
          fetchAllUsers();
        }
        setIsAuthLoading(false);
      });
    } else if (!isFirebaseUserLoading) {
      setUser(null);
      // Check for users to create default admin if none exist, even if logged out.
      fetchAllUsers(); 
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
      // Reauthenticate before changing password
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
    
    // This is tricky client-side. A backend function is the robust way.
    // For this demo, we'll assume we can temporarily create a user.
    // NOTE: This flow has security implications in a real app.
    const originalUser = auth.currentUser;

    try {
        // Create a temporary auth instance to not disturb the current session
        const tempAuth = auth; // In a real app, this would be an admin SDK call.
        const userCredential = await createUserWithEmailAndPassword(
            tempAuth,
            `${username}@example.com`,
            pass
        );
        const newUser = userCredential.user;

        const userDocRef = doc(firestore, 'users', newUser.uid);
        await setDoc(userDocRef, {
            username: username,
            role: role,
        });

        // If the temporary auth is the same as the main one, the new user is now signed in.
        // We need to sign them out and restore the original session.
        if (auth.currentUser?.uid === newUser.uid) {
            await signOut(auth);
            // This part is problematic client-side as we don't have the original user's password.
            // In a real app, you would not do this. The admin would remain logged in.
            // For this tool, we will just force a redirect to login.
            if (originalUser) {
                router.push('/login'); // Force re-login for simplicity
            }
        }
        
        fetchAllUsers();
        return true;
    } catch (error) {
        console.error('Failed to add user:', error);
        return false;
    }
  };

  const removeUser = async (username: string): Promise<void> => {
     if (!firestore || !auth) return;
    const userToRemove = users.find((u) => u.username === username);
    if (!userToRemove) return;

    // This is NOT secure for a production app. It requires admin privileges.
    // This is a simplified deletion for this tool's context.
    try {
        const userDocRef = doc(firestore, 'users', userToRemove.uid);
        await deleteDoc(userDocRef);
        fetchAllUsers(); // Refresh user list
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
