import React, { useState, useEffect } from 'react';
import Input from '@/components/commons/Input';
import Button from '@/components/commons/Button';
import { IBook, IAuthor } from '@/types';
import { createBook, updateBook } from '@/services/bookService';
import { getAuthors } from '@/services/authorService';
import InputMask from 'react-input-mask';

interface BookFormProps {
  book: IBook | null;
  onCancel: () => void;
  onSave: () => void;
}

const BookForm: React.FC<BookFormProps> = ({ book, onCancel, onSave }) => {
  const [title, setTitle] = useState<string>('');
  const [authorIds, setAuthorIds] = useState<string[]>([]);
  const [availableAuthors, setAvailableAuthors] = useState<IAuthor[]>([]);
  const [isbn, setIsbn] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [publishDate, setPublishDate] = useState<string>('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingAuthors, setFetchingAuthors] = useState<boolean>(true);

  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const data = await getAuthors();
        setAvailableAuthors(data);
        setFetchingAuthors(false);
      } catch (error) {
        console.error('Erro ao carregar organizadores:', error);
        setFetchingAuthors(false);
      }
    };

    fetchAuthors();

    if (book) {
      setTitle(book.title);
      if (Array.isArray(book.author)) {
        setAuthorIds(
          book.author.map(author =>
            typeof author === 'object' ? author._id : author
          )
        );
      } else {
        setAuthorIds([
          typeof book.author === 'object' && book.author !== null
            ? (book.author as { _id: string })._id
            : book.author,
        ]);
      }
      setIsbn(book.isbn || '');
      setPrice(book.price ? book.price.toString() : '');
      setDescription(book.description || '');
      if (book.publishDate) {
        const date = new Date(book.publishDate);
        setPublishDate(date.toISOString().split('T')[0]);
      }
    }
  }, [book]);

  const formatPrice = (value: string): string => {
    const numericValue = value.replace(/\D/g, '');

    if (numericValue === '') return '';

    const floatValue = parseFloat(numericValue) / 100;
    return floatValue.toFixed(2);
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) {
      newErrors.title = 'O título é obrigatório';
    }

    if (authorIds.length === 0) {
      newErrors.authorIds = 'Pelo menos um organizador é obrigatório';
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
        author: authorIds,
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

  const handleAuthorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.options);
    const selectedValues = options
      .filter(option => option.selected)
      .map(option => option.value);

    setAuthorIds(selectedValues);
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

      <div className="mb-4">
        <label htmlFor="authors" className="block text-sm font-medium text-gray-700 mb-1">
          Organizadores <span className="text-red-500">*</span>
        </label>
        <select
          id="authors"
          multiple
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3F90C2] ${errors.authorIds ? 'border-red-500' : 'border-gray-300'
            }`}
          value={authorIds}
          onChange={handleAuthorChange}
          disabled={fetchingAuthors}
          required
          size={4}
        >
          {availableAuthors.map((author) => (
            <option key={author._id} value={author._id}>
              {author.name}
            </option>
          ))}
        </select>
        {errors.authorIds && <p className="mt-1 text-sm text-red-600">{errors.authorIds}</p>}
        <p className="mt-1 text-xs text-gray-500">
          Segure Ctrl (ou Command no Mac) para selecionar múltiplos organizadores
        </p>
      </div>

      <Input
        id="isbn"
        label="ISBN"
        value={isbn}
        onChange={(e) => setIsbn(e.target.value)}
        placeholder="Digite o ISBN (opcional)"
      />

      <div className="mb-4">
        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
          Preço <span className="text-red-500">*</span>
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">R$</span>
          </div>
          <InputMask
            mask="999.999,99"
            id="price"
            value={price}
            onChange={(e) => setPrice(formatPrice(e.target.value))}
            className={`focus:ring-[#3F90C2] focus:border-[#3F90C2] block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md ${errors.price ? 'border-red-500' : ''
              }`}
            placeholder="0,00"
            required
          />
        </div>
        {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
      </div>

      <div className="mb-4">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Descrição
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Digite a descrição do livro (opcional)"
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3F90C2] border-gray-300"
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