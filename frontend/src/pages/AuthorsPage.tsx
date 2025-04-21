import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/commons/Button';
import DataFetchWrapper from '@/components/commons/DataFetching';
import Modal from '@/components/commons/Modal';
import Alert from '@/components/commons/Alert';
import AuthorForm from '@/components/authors/AuthorForm';
import AuthorList from '@/components/authors/AuthorList';
import Pagination from '@/components/commons/Pagination';
import { formatCurrency } from '@/utils/formatters';
import { getAuthors, getAuthorStats, deleteAuthor } from '@/services/authorService';
import { IAuthor, IAuthorStats } from '@/types';
import SearchFilter from '@/components/commons/SearchFilter';

const AuthorsPage: React.FC = () => {
  const [allAuthors, setAllAuthors] = useState<IAuthor[]>([]);
  const [filteredAuthors, setFilteredAuthors] = useState<IAuthor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedAuthor, setSelectedAuthor] = useState<IAuthor | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [authorStats, setAuthorStats] = useState<IAuthorStats | null>(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState<boolean>(false);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit] = useState<number>(10);

  const fetchAuthors = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getAuthors(currentPage, limit);

      const paginationData = await getAuthors(currentPage, limit);

      setAllAuthors(data);
      setFilteredAuthors(data);
      setTotalPages(paginationData.totalPages);
      setLoading(false);
    } catch (error: any) {
      setError('Falha ao carregar os organizadores. Por favor, tente novamente.');
      setLoading(false);
      console.error('Erro ao carregar organizadores:', error);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, [currentPage, limit]);

  useEffect(() => {
    filterAuthors();
  }, [searchTerm, dateFilter, allAuthors]);

  const filterAuthors = () => {
    let filtered = [...allAuthors];

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(author =>
        author.name.toLowerCase().includes(term) ||
        (author.email && author.email.toLowerCase().includes(term))
      );
    }

    if (dateFilter.startDate && dateFilter.endDate) {
      const startDate = new Date(dateFilter.startDate).setHours(0, 0, 0, 0);
      const endDate = new Date(dateFilter.endDate).setHours(23, 59, 59, 999);

      filtered = filtered.filter(author => {
        if (!author.createdAt) return true;
        const createdAt = new Date(author.createdAt).getTime();
        return createdAt >= startDate && createdAt <= endDate;
      });
    }

    setFilteredAuthors(filtered);
  };

  const handleOpenModal = (author: IAuthor | null = null) => {
    setSelectedAuthor(author);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAuthor(null);
  };

  const handleSaveSuccess = () => {
    handleCloseModal();
    fetchAuthors();
    setAlert({
      type: 'success',
      message: selectedAuthor ? 'Organizador atualizado com sucesso!' : 'Organizador adicionado com sucesso!'
    });

    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  const handleDeleteAuthor = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este organizador?')) {
      try {
        await deleteAuthor(id);
        fetchAuthors();
        setAlert({ type: 'success', message: 'Organizador excluído com sucesso!' });

        setTimeout(() => {
          setAlert(null);
        }, 5000);
      } catch (error) {
        console.error('Erro ao excluir organizador:', error);
        setAlert({ type: 'error', message: 'Organizador possui livro(s) cadastrado(s)' });
      }
    }
  };

  const handleViewStats = async (id: string) => {
    try {
      setStatsLoading(true);
      const stats = await getAuthorStats(id);
      setAuthorStats(stats);
      setIsStatsModalOpen(true);
      setStatsLoading(false);
    } catch (error) {
      setAlert({ type: 'error', message: 'Erro ao carregar estatísticas do organizador' });
      setStatsLoading(false);
    }
  };


  const handleDateFilterChange = (startDate: string, endDate: string) => {
    setDateFilter({ startDate, endDate });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div>
      <PageHeader
        title="Organizadores"
        subtitle="Gerencie os organizadores e suas comissões"
        actions={
          <Button
            variant="primary"
            onClick={() => handleOpenModal()}
            className="flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Novo Organizador
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

      <SearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nome ou email..."
        dateFilter={dateFilter}
        onDateFilterChange={handleDateFilterChange}
        showDateFilter={false}
        className="mb-6"
      />

      <DataFetchWrapper
        loading={loading}
        error={error}
        isEmpty={filteredAuthors.length === 0}
        emptyMessage="Nenhum organizador encontrado. Clique em 'Novo Organizador' para adicionar."
        onRetry={fetchAuthors}
      >
        <AuthorList
          authors={filteredAuthors}
          onEdit={handleOpenModal}
          onDelete={handleDeleteAuthor}
          onViewStats={handleViewStats}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </DataFetchWrapper>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedAuthor ? 'Editar Organizador' : 'Novo Organizador'}
      >
        <AuthorForm
          author={selectedAuthor}
          onCancel={handleCloseModal}
          onSave={handleSaveSuccess}
        />
      </Modal>

      <Modal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        title="Estatísticas do Organizador"
        size="lg"
      >
        {statsLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : authorStats ? (
          <div className="p-4">
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-lg p-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm font-medium mb-1">Total de Vendas</p>
                    <p className="text-2xl font-bold tracking-tight">
                      {formatCurrency(authorStats.totalSales)}
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-lg p-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium mb-1">Quantidade Total</p>
                    <p className="text-2xl font-bold tracking-tight">
                      {authorStats.totalQuantity} livros
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4">Vendas por Plataforma</h3>
              {Object.keys(authorStats.salesByPlatform).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(authorStats.salesByPlatform).map(([platform, data]) => (
                    <div key={platform} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <h4 className="font-semibold text-gray-800 mb-2">{platform}</h4>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Quantidade:</span>
                        <span className="font-medium">{data.quantity} livros</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-medium">{formatCurrency(data.total)}</span>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full"
                          style={{ width: `${(data.total / authorStats.totalSales) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Não há dados de vendas por plataforma.</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4">Vendas por Livro</h3>
              {authorStats.salesByBook.length > 0 ? (
                <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Livro
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantidade
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Percentual
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {authorStats.salesByBook.map((book, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {book.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {book.quantity} und
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(book.total)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 w-24">
                                <div
                                  className="bg-indigo-600 h-2.5 rounded-full"
                                  style={{ width: `${(book.total / authorStats.totalSales) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-700">
                                {((book.total / authorStats.totalSales) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">Não há dados de vendas por livro.</p>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                variant="primary"
                onClick={() => setIsStatsModalOpen(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <p className="text-gray-500">Não foi possível carregar as estatísticas.</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuthorsPage;