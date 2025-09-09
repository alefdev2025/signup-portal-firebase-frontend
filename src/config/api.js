export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5173';

//console.log('Using API URL:', API_BASE_URL); // For debugging

export const getApiUrl = (path) => {
  return `${API_BASE_URL}${path}`;
};
