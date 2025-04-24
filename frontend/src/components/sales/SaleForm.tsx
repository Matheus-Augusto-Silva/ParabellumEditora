import React, { useState, useEffect } from 'react';
import Button from '@/components/commons/Button';
import { getBooks } from '@/services/bookService';
import { createSale, updateSale } from '@/services/saleService';
import { IBook, ISale } from '@/types';
import InputMask from 'react-input-mask';

interface SaleFormProps {
  sale?: ISale | null;
  onCancel: () => void;
  onSave: () => void;
}

const SaleForm: React.FC<SaleFormProps> = ({ sale, onCancel, onSave }) => {
  const [books, setBooks] = useState<IBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [platform, setPlatform] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [salePrice, setSalePrice] = useState<string>('');
  const [saleDate, setSaleDate] = useState<string>('');
  const [source, setSource] = useState<'parceira' | 'editora'>('editora');
  const [status, setStatus] = useState<'completed' | 'canceled'>('completed');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const data = await getBooks();
        setBooks(data);
      } catch (error) {
        console.error('Erro ao carregar livros:', error);
        setError('Falha ao carregar os livros. Por favor, tente novamente.');
      }
    };

    fetchBooks();

    if (sale) {
      console.log('Sale data:', sale);
      setSelectedBook(typeof sale.book === 'object' ? sale.book._id : sale.book);
      setPlatform(sale.platform);
      setQuantity(sale.quantity);
      setSalePrice(sale.salePrice.toString());
      setSaleDate(new Date(sale.saleDate).toISOString().split('T')[0]);
      setSource(sale.source === 'parceira' || sale.source === 'editora' ? sale.source : 'editora');
      setStatus(sale.status === 'canceled' ? 'canceled' : 'completed');
    } else {
      setSaleDate(new Date().toISOString().split('T')[0]);
    }
  }, [sale]);

  const formatPrice = (value: string): string => {
    const numericValue = value.replace(/\D/g, '');

    if (numericValue === '') return '';

    const floatValue = parseFloat(numericValue) / 100;
    return floatValue.toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBook || !platform || !quantity || !salePrice) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const saleData = {
        book: selectedBook,
        platform,
        quantity,
        salePrice: parseFloat(salePrice),
        saleDate,
        source,
        status
      };

      if (sale && sale._id) {
        await updateSale(sale._id, saleData);
      } else {
        await createSale(saleData);
      }

      setLoading(false);
      onSave();
    } catch (error: any) {
      console.error('Erro ao salvar venda:', error);
      setError(error.response?.data?.message || 'Erro ao salvar venda. Tente novamente.');
      setLoading(false);
    }
  };

  const customPlatforms = [
    'Amazon',
    'Mercado Livre',
    'Estante Virtual',
    'umLivro',
    'Carrefour',
    'Americanas',
    'Site da Editora',
    'Outra plataforma'
  ];

  return (
    <form onSubmit={handleSubmit} className="p-4">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="book" className="block text-sm font-medium text-gray-700 mb-1">
            Livro <span className="text-red-500">*</span>
          </label>
          <select
            id="book"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={selectedBook}
            onChange={(e) => setSelectedBook(e.target.value)}
            required
          >
            <option value="">Selecione um livro</option>
            {books.map((book) => (
              <option key={book._id} value={book._id}>
                {book.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-1">
            Plataforma <span className="text-red-500">*</span>
          </label>
          <select
            id="platform"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            required
          >
            <option value="">Selecione uma plataforma</option>
            {customPlatforms.map((plat) => (
              <option key={plat} value={plat}>
                {plat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
            Origem da Venda <span className="text-red-500">*</span>
          </label>
          <select
            id="source"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={source}
            onChange={(e) => setSource(e.target.value as 'parceira' | 'editora')}
            required
          >
            <option value="editora">Site/Editora (90% editora, 10% organizador)</option>
            <option value="parceira">Parceira (30% editora, 70% parceira)</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {source === 'editora' ?
              'Das vendas do site/editora, 90% fica com a editora (dos quais 10% vai para o organizador)' :
              'Das vendas via parceira, 30% fica com a editora (dos quais 10% vai para o organizador) e 70% vai para a parceira'}
          </p>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status da Venda <span className="text-red-500">*</span>
          </label>
          <select
            id="status"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'completed' | 'canceled')}
            required
          >
            <option value="completed">Completada</option>
            <option value="canceled">Cancelada</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {status === 'canceled'
              ? 'Vendas canceladas são importadas, mas não contabilizadas no total de vendas para comissões.'
              : 'Vendas completadas são contabilizadas para cálculo de comissões.'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Quantidade <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="quantity"
              min="1"
              step="1"
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              required
            />
          </div>

          <div>
            <label htmlFor="salePrice" className="block text-sm font-medium text-gray-700 mb-1">
              Preço Unitário (R$) <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">R$</span>
              </div>
              <InputMask
                id="salePrice"
                value={salePrice}
                onChange={(e) => setSalePrice(formatPrice(e.target.value))}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                placeholder="0,00"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="saleDate" className="block text-sm font-medium text-gray-700 mb-1">
              Data da Venda <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="saleDate"
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Salvando...' : (sale ? 'Atualizar' : 'Salvar')}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default SaleForm;