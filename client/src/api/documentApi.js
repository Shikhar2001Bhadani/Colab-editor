import axios from 'axios';

const API_URL = '/api/documents';

export const getDocuments = async () => {
  const { data } = await axios.get(API_URL);
  return data;
};

export const createDocument = async (docData) => {
  const { data } = await axios.post(API_URL, docData);
  return data;
};

export const getDocumentById = async (id) => {
  const { data } = await axios.get(`${API_URL}/${id}`);
  return data;
};

export const deleteDocument = async (id) => {
    await axios.delete(`${API_URL}/${id}`);
};

export const shareDocument = async (id, shareData) => {
    const { data } = await axios.post(`${API_URL}/${id}/share`, shareData);
    return data;
};