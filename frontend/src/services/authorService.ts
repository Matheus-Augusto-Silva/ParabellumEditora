import api from '@/services/api';
import { IAuthor, IAuthorStats } from '@/types';

export const getAuthors = async (): Promise<IAuthor[]> => {
  const response = await api.get('/authors');
  return response.data;
};

export const getAuthor = async (id: string): Promise<IAuthor> => {
  const response = await api.get(`/authors/${id}`);
  return response.data;
};

export const createAuthor = async (authorData: Partial<IAuthor>): Promise<IAuthor> => {
  const response = await api.post('/authors', authorData);
  return response.data;
};

export const updateAuthor = async (id: string, authorData: Partial<IAuthor>): Promise<IAuthor> => {
  const response = await api.put(`/authors/${id}`, authorData);
  return response.data;
};

export const deleteAuthor = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/authors/${id}`);
  return response.data;
};

export const getAuthorStats = async (id: string): Promise<IAuthorStats> => {
  const response = await api.get(`/authors/${id}/stats`);
  return response.data;
};