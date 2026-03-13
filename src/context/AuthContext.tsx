import React, { createContext, useContext, useState, useCallback } from 'react';

interface User {
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'smartsight_session';
const ACCOUNTS_KEY = 'smartsight_accounts';

// Password validation
const validatePassword = (password: string): string | null => {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
  return null;
};

// Simple hash for demo (in production use bcrypt on server)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'smartsight_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const getAccounts = (): Record<string, { name: string; email: string; hash: string }> => {
  try {
    const data = localStorage.getItem(ACCOUNTS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

const saveAccount = (email: string, name: string, hash: string) => {
  const accounts = getAccounts();
  accounts[email.toLowerCase()] = { name, email, hash };
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      // Validate session structure
      if (parsed?.email && parsed?.name) return parsed;
      return null;
    } catch {
      return null;
    }
  });

  const register = useCallback(async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Input validation
    if (!name.trim() || name.trim().length < 2) {
      return { success: false, error: 'Name must be at least 2 characters.' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    const pwdError = validatePassword(password);
    if (pwdError) return { success: false, error: pwdError };

    const accounts = getAccounts();
    if (accounts[email.toLowerCase()]) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const hash = await hashPassword(password);
    saveAccount(email, name.trim(), hash);

    const newUser = { name: name.trim(), email: email.toLowerCase() };
    setUser(newUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    return { success: true };
  }, []);

  const login = useCallback(async (
    _name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!email || !password) {
      return { success: false, error: 'Please fill in all fields.' };
    }

    const accounts = getAccounts();
    const account = accounts[email.toLowerCase()];

    // If no accounts exist yet, allow first-time login (demo mode)
    if (!account) {
      // Demo mode: create account on first login
      const newUser = { name: email.split('@')[0], email: email.toLowerCase() };
      setUser(newUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
      return { success: true };
    }

    const hash = await hashPassword(password);
    if (hash !== account.hash) {
      return { success: false, error: 'Incorrect email or password.' };
    }

    const loggedInUser = { name: account.name, email: account.email };
    setUser(loggedInUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(loggedInUser));
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
