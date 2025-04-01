import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/commons/Button';
import DataFetchWrapper from '@/components/commons/DataFetching';
import Alert from '@/components/commons/Alert';
import Modal from '@/components/commons/Modal';
import BookForm from '@/components/books/BookForm';
import BookList from '@/components/books/BookList';
import { getBooks, deleteBook } from '@/services/bookService';
import { IBook } from '@/types';

const BooksPage: React.FC = () => {
  const [allBooks, setAllBooks] = useState<IBook[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<IBook[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedBook, setSelectedBook] = useState<IBook | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBooks();
      setAllBooks(data);
      setFilteredBooks(data);
      setLoading(false);
    } catch (error: any) {
      setError('Falha ao carregar os livros. Por favor, tente novamente.');
      setLoading(false);
      console.error('Erro ao carregar livros:', error);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredBooks(allBooks);
    } else {
      const term = searchTerm.toLowerCase().trim();
      const filtered = allBooks.filter(book =>
        book.title.toLowerCase().includes(term) ||
        (typeof book.author === 'object' && book.author.name.toLowerCase().includes(term)) ||
        (book.isbn && book.isbn.includes(term))
      );
      setFilteredBooks(filtered);
    }
  }, [searchTerm, allBooks]);

  const handleOpenModal = (book: IBook | null = null) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBook(null);
  };

  const handleSaveSuccess = () => {
    handleCloseModal();
    fetchBooks();
    setAlert({
      type: 'success',
      message: selectedBook
        ? 'Livro atualizado com sucesso!'
        : 'Livro adicionado com sucesso!'
    });

    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  const handleDeleteBook = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este livro?')) {
      try {
        await deleteBook(id);
        fetchBooks();
        setAlert({ type: 'success', message: 'Livro excluído com sucesso!' });

        setTimeout(() => {
          setAlert(null);
        }, 5000);
      } catch (error: any) {
        console.error('Erro ao excluir livro:', error);
      }
    }
  };

  return (
    <div>
      <PageHeader
        title="Livros"
        subtitle="Gerencie o catálogo de livros da editora"
        actions={
          <Button
            variant="primary"
            onClick={() => handleOpenModal()}
            className="flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Novo Livro
          </Button>
        }
      />

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          className="mb-4"
          onClose={() => setAlert(null)}
        />
      )}

      <div className="mb-6">
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-4 py-2 sm:text-sm border-gray-300 rounded-md"
            placeholder="Buscar por título, autor ou ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <DataFetchWrapper
        loading={loading}
        error={error}
        isEmpty={filteredBooks.length === 0}
        emptyMessage="Nenhum livro encontrado. Clique em 'Novo Livro' para adicionar."
        onRetry={fetchBooks}
      >
        <BookList
          books={filteredBooks}
          onEdit={handleOpenModal}
          onDelete={handleDeleteBook}
        />
      </DataFetchWrapper>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedBook ? 'Editar Livro' : 'Novo Livro'}
      >
        {isModalOpen && (
          <BookForm
            book={selectedBook}
            onCancel={handleCloseModal}
            onSave={handleSaveSuccess}
          />
        )}
      </Modal>
    </div>
  );
};

export default BooksPage;