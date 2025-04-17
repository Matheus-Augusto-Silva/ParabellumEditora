import React from 'react';
import { IBook } from '@/types';
import Table from '@/components/commons/Table';
import Button from '@/components/commons/Button';
import { formatCurrency } from '@/utils/formatters';

interface BookListProps {
  books: IBook[];
  onEdit: (book: IBook) => void;
  onDelete: (id: string) => void;
}

const BookList: React.FC<BookListProps> = ({ books, onEdit, onDelete }) => {
  const getAuthorNames = (book: IBook) => {
    if (Array.isArray(book.author)) {
      return book.author
        .map(author => typeof author === 'object' ? author.name : 'Organizador não disponível')
        .join(', ');
    } else if (typeof book.author === 'object') {
      return book.author.name;
    }
    return 'Organizador não disponível';
  };

  const columns = [
    {
      header: 'Título',
      accessor: 'title',
      render: (book: IBook) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 mr-3 bg-indigo-100 rounded-md flex items-center justify-center text-indigo-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-gray-900">{book.title}</div>
            <div className="text-xs text-gray-500">
              {book.description && book.description.substring(0, 40)}
              {book.description && book.description.length > 40 ? '...' : ''}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Organizador(es)',
      accessor: 'author',
      render: (book: IBook) => (
        <div>
          <div className="text-sm text-gray-900">
            {getAuthorNames(book)}
          </div>
          {Array.isArray(book.author) && book.author.length > 0 && typeof book.author[0] === 'object' && (
            <div className="text-xs text-gray-500">
              Taxa: {book.author[0].commissionRate}%
            </div>
          )}
        </div>
      )
    },
    {
      header: 'ISBN',
      accessor: 'isbn',
      render: (book: IBook) => (
        <span className="text-gray-500 text-sm">{book.isbn || '-'}</span>
      )
    },
    {
      header: 'Publicação',
      accessor: 'publishDate',
      render: (book: IBook) => (
        <span className="text-gray-500 text-sm">
          {book.publishDate ? new Date(book.publishDate).toLocaleDateString('pt-BR') : '-'}
        </span>
      )
    },
    {
      header: 'Preço',
      accessor: 'price',
      render: (book: IBook) => (
        <span className="text-gray-900 font-medium">{formatCurrency(book.price || 0)}</span>
      )
    },
    {
      header: 'Ações',
      accessor: '_id',
      render: (book: IBook) => (
        <div className="flex space-x-2">
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(book);
            }}
          >
            Editar
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(book._id);
            }}
          >
            Excluir
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <Table
        columns={columns}
        data={books}
        keyExtractor={(book) => book._id}
        onRowClick={onEdit}
        emptyMessage="Nenhum livro encontrado."
      />
    </div>
  );
};

export default BookList;