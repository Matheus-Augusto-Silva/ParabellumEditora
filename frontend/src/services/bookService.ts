import api from '@/services/api';
import { IBook } from '@/types';

export const getBooks = async (): Promise<IBook[]> => {
  const response = await api.get('/books');
  return response.data;
};

export const getBook = async (id: string): Promise<IBook> => {
  const response = await api.get(`/books/${id}`);
  return response.data;
};

export const createBook = async (bookData: Partial<IBook>): Promise<IBook> => {
  const response = await api.post('/books', bookData);
  return response.data;
};

export const updateBook = async (id: string, bookData: Partial<IBook>): Promise<IBook> => {
  const response = await api.put(`/books/${id}`, bookData);
  return response.data;
};

export const deleteBook = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/books/${id}`);
  return response.data;
};
