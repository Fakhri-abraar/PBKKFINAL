import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// [UPDATE] Sesuaikan interface user dengan respon backend (tambah email)
interface User {
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  // [UPDATE] Register menerima email juga
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // URL API dari environment variable
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    // [FIX] Gunakan API_URL dari env
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.text();
      // Parse error json jika backend mengirim format json message
      try {
        const errorJson = JSON.parse(error);
        throw new Error(errorJson.message || 'Login failed');
      } catch {
        throw new Error(error || 'Login failed');
      }
    }

    const data = await response.json();

    // Pastikan backend mengembalikan user (sesuai perbaikan di auth.service.ts)
    if (data.user && data.access_token) {
      setToken(data.access_token);
      setUser(data.user);

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
    } else {
      throw new Error("Invalid response from server (missing user data)");
    }
  };

  const register = async (username: string, email: string, password: string) => {
    // [FIX] Gunakan API_URL dan kirim email
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const error = await response.text();
      try {
        const errorJson = JSON.parse(error);
        throw new Error(errorJson.message || 'Registration failed');
      } catch {
        throw new Error(error || 'Registration failed');
      }
    }

    // Biasanya register di backend Anda mengembalikan { message, user }, 
    // tapi belum tentu login otomatis (return token). 
    // Jika flow Anda autologin setelah register, sesuaikan logika di bawah.
    // Kode di bawah asumsi backend register mengembalikan token juga (seperti login).
    // Jika HANYA mengembalikan user, Anda mungkin tidak perlu setToken/setUser disini,
    // biarkan user login manual.
    
    // Namun, jika Anda ingin konsisten dengan Login page logic:
    // Page Register.tsx Anda saat ini melakukan redirect ke login page setelah sukses.
    // Jadi fungsi register di context ini mungkin tidak dipanggil langsung oleh page Register Anda yang sekarang.
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Opsional: Panggil endpoint logout backend untuk invalidate refresh token
    // fetch(`${API_URL}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
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