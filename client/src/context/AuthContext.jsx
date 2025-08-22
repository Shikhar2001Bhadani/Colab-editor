import React, { createContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../api/authApi';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        setUserInfo(user);
        setError(null);
      } catch (error) {
        console.error('Auth error:', error);
        setUserInfo(null);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    // Only try to fetch user if we have a token
    if (document.cookie.includes('jwt')) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = (userData) => {
    setUserInfo(userData);
    setError(null);
  };

  const logout = () => {
    setUserInfo(null);
    setError(null);
    // Clear the jwt cookie
    document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  };

  const value = {
    userInfo,
    login,
    logout,
    loading,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};