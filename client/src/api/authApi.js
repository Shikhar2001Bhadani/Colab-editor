import api from './axiosConfig';

const API_URL = '/api/auth';

export const register = async (userData) => {
  const { data } = await api.post(`${API_URL}/register`, userData);
  return data;
};

export const login = async (userData) => {
  const { data } = await api.post(`${API_URL}/login`, userData);
  return data;
};

export const logout = async () => {
  const { data } = await api.post(`${API_URL}/logout`);
  return data;
};

export const getCurrentUser = async () => {
  try {
    const { data } = await api.get(`${API_URL}/me`);
    return data;
  } catch (error) {
    throw new Error('Not authenticated');
  }
};