import api from '@/services/api';
import { ISaleStats, IPendingCommissions, IPaidCommissions } from '@/types';

export const getSalesStats = async (): Promise<ISaleStats> => {
  const response = await api.get('/sales/stats');
  return response.data;
};

export const getPendingCommissionsStats = async (): Promise<IPendingCommissions> => {
  const response = await api.get('/commissions/pendingCommissions');
  return response.data;
};

export const getPaidCommissionsStats = async (): Promise<IPaidCommissions> => {
  const response = await api.get('/commissions/paidCommissions');
  return response.data;
};