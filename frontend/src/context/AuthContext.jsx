import React, { createContext, useContext } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { signOut } = useClerkAuth();

  const loading = !userLoaded;

  // Map Clerk user to our existing user structure
  const user = clerkUser
    ? {
        username: clerkUser.username || clerkUser.firstName || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0],
        email: clerkUser.primaryEmailAddress?.emailAddress,
        profile_pic: clerkUser.imageUrl,
      }
    : null;

  const logout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Login and signup are handled directly by Clerk components.
  // We provide stub functions to keep useAuth interface compatible if referenced elsewhere.
  const login = async () => {
    throw new Error('Please use Clerk login flow');
  };

  const signup = async () => {
    throw new Error('Please use Clerk signup flow');
  };

  return (
    <AuthContext.Provider value={{ user, loading, error: null, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
