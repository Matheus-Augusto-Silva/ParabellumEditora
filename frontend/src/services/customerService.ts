import api from '@/services/api';
import { ICustomer } from '@/types';

export const getCustomers = async (): Promise<ICustomer[]> => {
  const response = await api.get('customers');
  return response.data;
};

export const getCustomer = async (id: string): Promise<ICustomer> => {
  const response = await api.get(`customers/${id}`);
  return response.data;
};

export const createCustomer = async (customerData: Partial<ICustomer>): Promise<ICustomer> => {
  const response = await api.post('customers', customerData);
  return response.data;
};

export const updateCustomer = async (id: string, customerData: Partial<ICustomer>): Promise<ICustomer> => {
  const response = await api.put(`customers/${id}`, customerData);
  return response.data;
};

export const deleteCustomer = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`customers/${id}`);
  return response.data;
};

export const importCustomersFromSales = async (): Promise<{
  message: string;
  clientsCreated: ICustomer[];
  duplicatecustomers?: string[];
}> => {
  const response = await api.post('customers/import-from-sales');
  return response.data;
};