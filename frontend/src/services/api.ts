import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const errorMessage =
        error.response.data.message ||
        'Ocorreu um erro na comunicação com o servidor';

      toast.error(errorMessage);
    } else if (error.request) {
      toast.error('Não foi possível conectar ao servidor. Verifique sua conexão.');
    } else {
      toast.error('Ocorreu um erro inesperado na aplicação.');
    }

    return Promise.reject(error);
  }
);

export default api;