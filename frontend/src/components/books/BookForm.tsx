import React, { useState, useEffect } from 'react';
import Input from '@/components/commons/Input';
import Select from '@/components/commons/Select';
import Button from '@/components/commons/Button';
import { IBook, IAuthor } from '@/types';
import { createBook, updateBook } from '@/services/bookService';
import { getAuthors } from '@/services/authorService';

interface BookFormProps {
  book: IBook | null;
  onCancel: () => void;
  onSave: () => void;
}

const BookForm: React.FC<BookFormProps> = ({ book, onCancel, onSave }) => {
  const [title, setTitle] = useState<string>('');
  const [authorId, setAuthorId] = useState<string>('');
  const [isbn, setIsbn] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [publishDate, setPublishDate] = useState<string>('');
  const [authors, setAuthors] = useState<IAuthor[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingAuthors, setFetchingAuthors] = useState<boolean>(true);

  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const data = await getAuthors();
        setAuthors(data);
        setFetchingAuthors(false);
      } catch (error) {
        console.error('Erro ao carregar autores:', error);
        setFetchingAuthors(false);
      }
    };

    fetchAuthors();

    if (book) {
      setTitle(book.title);
      setAuthorId(typeof book.author === 'object' ? book.author._id : book.author);
      setIsbn(book.isbn || '');
      setPrice(book.price.toString());
      setDescription(book.description || '');
      if (book.publishDate) {
        const date = new Date(book.publishDate);
        setPublishDate(date.toISOString().split('T')[0]);
      }
    }
  }, [book]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) {
      newErrors.title = 'O título é obrigatório';
    }

    if (!authorId) {
      newErrors.authorId = 'O autor é obrigatório';
    }

    if (!price.trim()) {
      newErrors.price = 'O preço é obrigatório';
    } else if (isNaN(Number(price)) || Number(price) <= 0) {
      newErrors.price = 'O preço deve ser um número positivo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const bookData = {
        title,
        author: authorId,
        isbn: isbn || undefined,
        price: Number(price),
        description: description || undefined,
        publishDate: publishDate || undefined
      };

      if (book) {
        await updateBook(book._id, bookData);
      } else {
        await createBook(bookData);
      }

      setLoading(false);
      onSave();
    } catch (error) {
      console.error('Erro ao salvar livro:', error);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        id="title"
        label="Título"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Digite o título do livro"
        error={errors.title}
        required
      />

      <Select
        id="author"
        label="Autor"
        value={authorId}
        onChange={(e) => setAuthorId(e.target.value)}
        options={authors.map((author) => ({ value: author._id, label: author.name }))}
        error={errors.authorId}
        required
        disabled={fetchingAuthors}
      />

      <Input
        id="isbn"
        label="ISBN"
        value={isbn}
        onChange={(e) => setIsbn(e.target.value)}
        placeholder="Digite o ISBN (opcional)"
      />

      <Input
        id="price"
        label="Preço"
        type="number"
        step="0.01"
        min="0"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Digite o preço"
        error={errors.price}
        required
      />

      <div className="mb-4">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Descrição
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Digite a descrição do livro (opcional)"
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
          rows={3}
        />
      </div>

      <Input
        id="publishDate"
        label="Data de Publicação"
        type="date"
        value={publishDate}
        onChange={(e) => setPublishDate(e.target.value)}
        placeholder="Selecione a data de publicação (opcional)"
      />

      <div className="flex justify-end space-x-2 mt-6">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
        >
          {loading ? 'Salvando...' : book ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
};

export default BookForm;