"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiClient } from "@/lib/api/client";

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, name: string, email: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name?: string; email?: string; password?: string }) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = "mybasket_auth_token";
const AUTH_USER_KEY = "mybasket_auth_user";

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storeAuth(token: string, user: AuthUser) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  // Also clear the legacy session userId
  localStorage.removeItem("demo_user_id");
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore auth from localStorage on mount
  useEffect(() => {
    const storedToken = getStoredToken();
    const storedUser = getStoredUser();
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
      // Set the token on the API client
      apiClient.setAuthToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const result = await apiClient.login(username, password) as { user: AuthUser; token: string };
    setUser(result.user);
    setToken(result.token);
    storeAuth(result.token, result.user);
    apiClient.setAuthToken(result.token);
  };

  const register = async (username: string, password: string, name: string, email: string) => {
    const result = await apiClient.register(username, password, name, email) as { user: AuthUser; token: string };
    setUser(result.user);
    setToken(result.token);
    storeAuth(result.token, result.user);
    apiClient.setAuthToken(result.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    clearAuth();
    apiClient.setAuthToken(null);
  };

  const updateProfile = async (data: { name?: string; email?: string; password?: string }) => {
    if (!user) throw new Error("Not logged in");
    const updatedUser = await apiClient.updateUser(user.id, data) as AuthUser;
    setUser(updatedUser);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
  };

  const deleteAccount = async () => {
    if (!user) throw new Error("Not logged in");
    await apiClient.deleteUser(user.id);
    logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
