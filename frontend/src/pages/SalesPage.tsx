import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/commons/Button';
import DataFetchWrapper from '@/components/commons/DataFetching';
import Table from '@/components/commons/Table';
import Modal from '@/components/commons/Modal';
import Alert from '@/components/commons/Alert';
import SaleForm from '@/components/sales/SaleForm';
import SaleImport from '@/components/sales/SaleImport';
import { formatCurrency } from '@/utils/formatters';
import { getSales, updateSale } from '@/services/saleService';
import { ISale } from '@/types';

const SalesPage: React.FC = () => {
  const [allSales, setAllSales] = useState<ISale[]>([]);
  const [filteredSales, setFilteredSales] = useState<ISale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [selectedSale, setSelectedSale] = useState<ISale | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSales();
      setAllSales(data);
      setFilteredSales(data);
      setLoading(false);
    } catch (error: any) {
      setError('Falha ao carregar as vendas. Por favor, tente novamente.');
      setLoading(false);
      console.error('Erro ao carregar vendas:', error);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  useEffect(() => {
    filterSales();
  }, [searchTerm, dateFilter, platformFilter, allSales]);

  const filterSales = () => {
    let filtered = [...allSales];

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(sale =>
        (typeof sale.book === 'object' && sale.book.title.toLowerCase().includes(term)) ||
        (typeof sale.book === 'object' && typeof sale.book.author === 'object' && sale.book.author.name.toLowerCase().includes(term)) ||
        sale.platform.toLowerCase().includes(term)
      );
    }

    const now = new Date();
    if (dateFilter !== 'all') {
      if (dateFilter === 'today') {
        const today = new Date(now.setHours(0, 0, 0, 0));
        filtered = filtered.filter(sale => new Date(sale.saleDate) >= today);
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter(sale => new Date(sale.saleDate) >= weekAgo);
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filtered = filtered.filter(sale => new Date(sale.saleDate) >= monthAgo);
      }
    }

    if (platformFilter !== 'all') {
      filtered = filtered.filter(sale => sale.platform === platformFilter);
    }

    setFilteredSales(filtered);
  };

  const handleOpenFormModal = (sale: ISale | null = null) => {
    setSelectedSale(sale);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setSelectedSale(null);
  };

  const handleOpenImportModal = () => {
    setIsImportModalOpen(true);
  };

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
  };

  const handleSaveSuccess = () => {
    fetchSales();
    handleCloseFormModal();
    setAlert({
      type: 'success',
      message: selectedSale ? 'Venda atualizada com sucesso!' : 'Venda adicionada com sucesso!'
    });

    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  const handleImportSuccess = () => {
    fetchSales();
    handleCloseImportModal();
    setAlert({ type: 'success', message: 'Vendas importadas com sucesso!' });

    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  const platforms = Array.from(new Set(allSales.map(sale => sale.platform)));

  const totalAmount = filteredSales.reduce((sum, sale) => sum + (sale.salePrice * sale.quantity), 0);
  const totalQuantity = filteredSales.reduce((sum, sale) => sum + sale.quantity, 0);

  const columns = [
    {
      header: 'Livro',
      accessor: 'book',
      render: (sale: ISale) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 mr-3 bg-indigo-100 rounded-md flex items-center justify-center text-indigo-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-gray-900">{typeof sale.book === 'object' ? sale.book.title : 'Livro não disponível'}</div>
            <div className="text-xs text-gray-500">
              {typeof sale.book === 'object' && typeof sale.book.author === 'object' ? `Autor: ${sale.book.author.name}` : ''}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Plataforma',
      accessor: 'platform',
      render: (sale: ISale) => (
        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
          {sale.platform}
        </span>
      )
    },
    {
      header: 'Data',
      accessor: 'saleDate',
      render: (sale: ISale) => (
        <div className="text-sm text-gray-900">
          {new Date(sale.saleDate).toLocaleDateString('pt-BR')}
        </div>
      )
    },
    {
      header: 'Quantidade',
      accessor: 'quantity',
      render: (sale: ISale) => (
        <div className="text-sm text-gray-900 font-medium">
          {sale.quantity} un
        </div>
      )
    },
    {
      header: 'Valor Unitário',
      accessor: 'salePrice',
      render: (sale: ISale) => (
        <div className="text-sm text-gray-900">
          {formatCurrency(sale.salePrice)}
        </div>
      )
    },
    {
      header: 'Total',
      accessor: 'total',
      render: (sale: ISale) => (
        <div className="text-sm font-medium text-gray-900">
          {formatCurrency(sale.salePrice * sale.quantity)}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'commission',
      render: (sale: ISale) => (
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${sale.commission ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {sale.commission ? 'Processada' : 'Pendente'}
        </span>
      )
    },
    {
      header: 'Ações',
      accessor: '_id',
      render: (sale: ISale) => (
        <div className="flex space-x-2">
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenFormModal(sale);
            }}
            disabled={sale.commission !== undefined}
            className="flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Vendas"
        subtitle="Gerencie as vendas de livros da editora"
        actions={
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              onClick={handleOpenImportModal}
              className="flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Importar CSV
            </Button>
            <Button
              variant="primary"
              onClick={() => handleOpenFormModal()}
              className="flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Nova Venda
            </Button>
          </div>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de Registros</p>
              <p className="text-xl font-bold text-gray-900">{filteredSales.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Valor Total</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Livros Vendidos</p>
              <p className="text-xl font-bold text-gray-900">{totalQuantity} un</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Buscar por livro, autor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">Período</label>
            <select
              id="date-filter"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">Todos os períodos</option>
              <option value="today">Hoje</option>
              <option value="week">Últimos 7 dias</option>
              <option value="month">Últimos 30 dias</option>
            </select>
          </div>

          <div>
            <label htmlFor="platform-filter" className="block text-sm font-medium text-gray-700 mb-1">Plataforma</label>
            <select
              id="platform-filter"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
            >
              <option value="all">Todas as plataformas</option>
              {platforms.map(platform => (
                <option key={platform} value={platform}>{platform}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <DataFetchWrapper
        loading={loading}
        error={error}
        isEmpty={filteredSales.length === 0}
        emptyMessage="Nenhuma venda encontrada. Clique em 'Nova Venda' para adicionar."
        onRetry={fetchSales}
      >
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <Table
            columns={columns}
            data={filteredSales}
            keyExtractor={(sale) => sale._id}
            onRowClick={(sale) => !sale.commission && handleOpenFormModal(sale)}
            emptyMessage="Nenhuma venda encontrada."
          />
        </div>
      </DataFetchWrapper>

      <Modal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={selectedSale ? 'Editar Venda' : 'Nova Venda'}
      >
        {isFormModalOpen && (
          <SaleForm
            sale={selectedSale}
            onCancel={handleCloseFormModal}
            onSave={handleSaveSuccess}
          />
        )}
      </Modal>

      <Modal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        title="Importar Vendas"
      >
        {isImportModalOpen && (
          <SaleImport
            onCancel={handleCloseImportModal}
            onSuccess={handleImportSuccess}
          />
        )}
      </Modal>
    </div>
  );
};

export default SalesPage;