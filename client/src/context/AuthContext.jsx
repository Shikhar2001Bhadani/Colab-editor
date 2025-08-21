import React, { createContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../api/authApi';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        setUserInfo(user);
      } catch (error) {
        setUserInfo(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const login = (userData) => {
    setUserInfo(userData);
  };

  const logout = () => {
    setUserInfo(null);
  };

  return (
    <AuthContext.Provider value={{ userInfo, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};