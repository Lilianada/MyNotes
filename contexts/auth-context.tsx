"use client";

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { getDoc, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase/firebase';
import { useToast } from '@/hooks/use-toast';
import { AuthLoadingState } from '@/components/ui/loading-states';
import { getUserStorage } from '@/lib/firebase/firebase-storage';
import { useNoteStore } from '@/lib/state/note-store';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Check if user is admin
  const checkIfAdmin = async (user: User) => {
    try {
      const adminRef = doc(db, 'admins', user.email || '');
      const adminDoc = await getDoc(adminRef);
      const isAdminUser = adminDoc.exists();
      
      // Add temporary admin creation for testing
      if (!isAdminUser && user.email) {
        // Expose function to browser console for testing
        if (typeof window !== 'undefined') {
          (window as any).firebase = {
            ...(window as any).firebase,
            makeUserAdmin: async (email: string) => {
              try {
                const adminRef = doc(db, 'admins', email);
                await setDoc(adminRef, {
                  email: email,
                  isAdmin: true,
                  createdAt: new Date()
                });
                console.log(`✅ Admin entry created for ${email}. Please refresh the page.`);
              } catch (error) {
                console.error('Error creating admin entry:', error);
              }
            }
          };
        }
      }
      
      return isAdminUser;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  // Create or update user document in Firestore
  const createUserDocument = async (user: User, isAdmin: boolean) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Create new user document
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          isAdmin,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });

        // Initialize storage for the user
        await getUserStorage(user.uid, isAdmin);
      } else {
        // Update last login
        await updateDoc(userRef, {
          lastLogin: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error creating/updating user document:', error);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const { user } = result;
      const adminStatus = await checkIfAdmin(user);
      
      // Create or update user document
      await createUserDocument(user, adminStatus);
      
      toast({
        title: "Success",
        description: adminStatus ? "Welcome back, admin!" : "Welcome! You now have 10MB of note storage.",
      });
    } catch (error) {
      console.error('Error signing in with Google:', error);
      toast({
        title: "Error",
        description: "Failed to sign in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast({
        title: "Success",
        description: "Successfully signed out",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      try {
        if (currentUser) {
          setUser(currentUser);
          const adminStatus = await checkIfAdmin(currentUser);
          setIsAdmin(adminStatus);
          
          // Update the note store with the user
          useNoteStore.getState().setUser({
            uid: currentUser.uid
          });
        } else {
          setUser(null);
          setIsAdmin(false);
          
          // Update the note store with null user
          useNoteStore.getState().setUser(null);
        }
      } catch (error) {
        console.error('Error handling auth state change:', error);
      } finally {
        setLoading(false);
      }
    });

    // Clean up subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        signInWithGoogle,
        signOut,
      }}
    >
      {loading && <AuthLoadingState />}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
