import api from '@/services/api';
import { IClient } from '@/types';

export const getClients = async (): Promise<IClient[]> => {
  const response = await api.get('/clients');
  return response.data;
};

export const getClient = async (id: string): Promise<IClient> => {
  const response = await api.get(`/clients/${id}`);
  return response.data;
};

export const createClient = async (clientData: Partial<IClient>): Promise<IClient> => {
  const response = await api.post('/clients', clientData);
  return response.data;
};

export const updateClient = async (id: string, clientData: Partial<IClient>): Promise<IClient> => {
  const response = await api.put(`/clients/${id}`, clientData);
  return response.data;
};

export const deleteClient = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/clients/${id}`);
  return response.data;
};

export const importClientsFromSales = async (): Promise<{
  message: string;
  clientsCreated: IClient[];
  duplicateClients?: string[];
}> => {
  const response = await api.post('/clients/import-from-sales');
  return response.data;
};