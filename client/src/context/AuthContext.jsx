import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('agentsql-user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Validate the stored token against the server on every app load.
  // If the token is expired or tampered, log the user out automatically.
  useEffect(() => {
    const validateSession = async () => {
      const stored = localStorage.getItem('agentsql-user');
      if (!stored) {
        setLoading(false);
        return;
      }

      try {
        const { token } = JSON.parse(stored);
        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          // Token expired or invalid — clear session
          localStorage.removeItem('agentsql-user');
          setUser(null);
        } else {
          const data = await response.json();
          // Refresh user data from server (name, role, etc.)
          const refreshed = { ...JSON.parse(stored), ...data.user };
          localStorage.setItem('agentsql-user', JSON.stringify(refreshed));
          setUser(refreshed);
        }
      } catch {
        // Network error — keep user logged in (offline tolerance)
      } finally {
        setLoading(false);
      }
    };

    validateSession();
  }, []);

  const login = (userData) => {
    // Clear any previous user's sessionStorage data (chat messages, selected connection, etc.)
    // This prevents a previous account's chat from bleeding into the new session.
    sessionStorage.clear();
    localStorage.setItem('agentsql-user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    sessionStorage.clear();
    localStorage.removeItem('agentsql-user');
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, logout, loading }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {/* Don't render children until session validation completes */}
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
