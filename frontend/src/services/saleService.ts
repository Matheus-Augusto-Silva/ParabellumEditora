import api from '@/services/api';
import { ISale, ISaleStats } from '@/types';

export const getSales = async (): Promise<ISale[]> => {
  const response = await api.get('/sales');
  return response.data;
};

export const getSale = async (id: string): Promise<ISale> => {
  const response = await api.get(`/sales/${id}`);
  return response.data;
};

export const createSale = async (saleData: Partial<ISale>): Promise<ISale> => {
  const response = await api.post('/sales', saleData);
  return response.data;
};

export const updateSale = async (id: string, saleData: Partial<ISale>): Promise<ISale> => {
  const response = await api.put(`/sales/${id}`, saleData);
  return response.data;
};

export const deleteSale = async (id: string) => {
  const response = await api.delete(`/sales/${id}`);
  return response.data;
};

export const getSalesStats = async (): Promise<ISaleStats> => {
  const response = await api.get('/sales/stats');
  return response.data;
};

export const importSales = async (file: File, source: 'parceira' | 'editora' = 'editora'): Promise<{ message: string; salesCreated: ISale[] }> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('source', source);

  const response = await api.post('/sales/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const getSalesByAuthorAndDateRange = async (
  authorId: string,
  startDate: string,
  endDate: string,
  source?: 'parceira' | 'editora'
): Promise<ISale[]> => {
  let url = `/sales/filter?author=${authorId}&startDate=${startDate}&endDate=${endDate}`;

  if (source) {
    url += `&source=${source}`;
  }

  const response = await api.get(url);
  return response.data;
};

export const getSalesStatsBySource = async (): Promise<{
  parceira: ISaleStats;
  editora: ISaleStats;
  total: ISaleStats;
}> => {
  const response = await api.get('/sales/stats/by-source');
  return response.data;
};