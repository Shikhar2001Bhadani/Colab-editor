import axios from 'axios';

const API_URL = '/api/ai';

export const checkGrammar = async (text) => {
  const { data } = await axios.post(`${API_URL}/grammar-check`, { text });
  return data;
};

export const enhanceText = async (text, tone) => {
  const { data } = await axios.post(`${API_URL}/enhance`, { text, tone });
  return data;
};

export const summarizeText = async (text) => {
  const { data } = await axios.post(`${API_URL}/summarize`, { text });
  return data;
};

export const autoCompleteText = async (params) => {
  const { data } = await axios.post(`${API_URL}/autocomplete`, params);
  return data;
};