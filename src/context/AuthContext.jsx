import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('nutriscan_jwt_token') || null;
    } catch (e) {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verify stored JWT token on mount
    async function checkAuth() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // Token expired or invalid
          setToken(null);
          localStorage.removeItem('nutriscan_jwt_token');
        }
      } catch (e) {
        console.warn('Auth verify check offline:', e);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }

    setToken(data.token);
    setUser(data.user);
    try {
      localStorage.setItem('nutriscan_jwt_token', data.token);
    } catch (e) {}

    return data.user;
  };

  const register = async (name, email, password) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    setToken(data.token);
    setUser(data.user);
    try {
      localStorage.setItem('nutriscan_jwt_token', data.token);
    } catch (e) {}

    return data.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('nutriscan_jwt_token');
    } catch (e) {}
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: Boolean(user), isGuest: !user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
