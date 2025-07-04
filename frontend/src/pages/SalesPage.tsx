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
import { deleteSale, getSales } from '@/services/saleService';
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
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');

  const canEditSale = (sale: ISale): boolean => {
    if (sale.status === 'canceled') return false;

    if (!sale.commission) return true;

    if (typeof sale.commission === 'object') {
      return !sale.commission.isPaid;
    }

    return true;
  };

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

  }, [searchTerm, dateFilter, platformFilter, sourceFilter, statusFilter, paymentStatusFilter, allSales]);

  const handleDeleteSale = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.')) {
      try {
        await deleteSale(id);
        fetchSales();
        setAlert({ type: 'success', message: 'Venda excluída com sucesso!' });

        setTimeout(() => {
          setAlert(null);
        }, 5000);
      } catch (error: any) {
        console.error('Erro ao excluir venda:', error);

        if (error.response && error.response.status === 400) {
          setAlert({
            type: 'error',
            message: 'Não é possível excluir uma venda que já foi processada em uma comissão.'
          });
        } else {
          setAlert({
            type: 'error',
            message: 'Erro ao excluir venda. Tente novamente.'
          });
        }
      }
    }
  };

  const filterSales = () => {
    let filtered = [...allSales];

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(sale =>
        sale.book?.title?.toLowerCase().includes(term) ||
        (Array.isArray(sale.book?.author)
          ? sale.book.author.some(author => author.name?.toLowerCase().includes(term))
          : sale.book?.author?.name?.toLowerCase().includes(term)
        ) ||
        sale.platform?.toLowerCase().includes(term) ||
        sale.customerName?.toLowerCase().includes(term) ||
        sale.orderNumber?.toLowerCase().includes(term)
      );
    }

    if (dateFilter.startDate && dateFilter.endDate) {
      const startDate = new Date(dateFilter.startDate).setHours(0, 0, 0, 0);
      const endDate = new Date(dateFilter.endDate).setHours(23, 59, 59, 999);

      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.saleDate).getTime();
        return saleDate >= startDate && saleDate <= endDate;
      });
    }

    if (platformFilter !== 'all') {
      filtered = filtered.filter(sale => sale.platform === platformFilter);
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(sale => sale.source === sourceFilter);
    }

    if (statusFilter !== 'all') {
      switch (statusFilter) {
        case 'canceled':
          filtered = filtered.filter(sale => sale.status === 'canceled');
          break;
        case 'pending':
          filtered = filtered.filter(sale => !sale.commission && sale.status !== 'canceled');
          break;
        case 'processed':
          filtered = filtered.filter(sale =>
            sale.commission &&
            (typeof sale.commission !== 'object' || !sale.commission.isPaid)
          );
          break;
        case 'paid':
          filtered = filtered.filter(sale =>
            sale.commission &&
            typeof sale.commission === 'object' &&
            sale.commission.isPaid
          );
          break;
      }
    }

    if (paymentStatusFilter !== 'all') {
      filtered = filtered.filter(sale => sale.paymentStatus === paymentStatusFilter);
    }

    setFilteredSales(filtered);
  };

  const renderPaymentStatus = (sale: ISale) => {
    const statusConfig = {
      pending: {
        label: 'Pendente',
        className: 'bg-yellow-100 text-yellow-800',
        icon: '⏳'
      },
      partial: {
        label: 'Parcial',
        className: 'bg-blue-100 text-blue-800',
        icon: '🔄'
      },
      completed: {
        label: 'Pago',
        className: 'bg-green-100 text-green-800',
        icon: '✅'
      }
    };

    const config = statusConfig[sale.paymentStatus || 'pending'];

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const renderAuthorInfo = (sale: ISale) => {
    if (!sale.book.author) return 'Autor não disponível';

    if (Array.isArray(sale.book.author)) {
      if (sale.book.author.length === 1) {
        return sale.book.author[0].name;
      }
      return (
        <div>
          <div className="font-medium">{sale.book.author.length} autores</div>
          <div className="text-xs text-gray-500 truncate" title={sale.book.author.map(a => a.name).join(', ')}>
            {sale.book.author.map(a => a.name).join(', ')}
          </div>
        </div>
      );
    }

    return typeof sale.book.author === 'object' ? sale.book.author.name : 'Autor não disponível';
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


  const totalAmount = filteredSales.reduce((sum, sale) => {
    if (sale.status !== 'canceled') {
      return sum + (sale.salePrice * sale.quantity);
    }
    return sum;
  }, 0);

  const totalQuantity = filteredSales.reduce((sum, sale) => {
    if (sale.status !== 'canceled') {
      return sum + sale.quantity;
    }
    return sum;
  }, 0);

  const statusStats = {
    total: filteredSales.length,
    canceled: filteredSales.filter(sale => sale.status === 'canceled').length,

    active: filteredSales.filter(sale => sale.status !== 'canceled').length,
    pending: filteredSales.filter(sale => sale.paymentStatus === 'pending').length,
    partial: filteredSales.filter(sale => sale.paymentStatus === 'partial').length,
    completed: filteredSales.filter(sale => sale.paymentStatus === 'completed').length,
  };

  const columns = [
    {
      header: 'Livro',
      accessor: 'book',
      render: (sale: ISale) => {
        const bookTitle = typeof sale.book === 'object' ? sale.book.title : 'Livro não disponível';

        return (
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 mr-3 bg-indigo-100 rounded-md flex items-center justify-center text-indigo-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className={`font-medium truncate ${sale.status === 'canceled' ? 'text-red-700' : 'text-gray-900'}`} title={bookTitle}>
                {bookTitle}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Autor(es)',
      accessor: 'author',
      render: (sale: ISale) => {
        const authorName = typeof sale.book.author === 'object' ? sale.book.author.name : 'Author não disponível';
        return (
          <div className={`text-sm ${sale.status === 'canceled' ? 'text-red-700' : 'text-gray-900'}`}>
            {authorName}
          </div>
        );
      }
    },
    {
      header: 'Plataforma',
      accessor: 'platform',
      render: (sale: ISale) => (
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
          ${sale.status === 'canceled'
            ? 'bg-red-50 text-red-700'
            : 'bg-blue-100 text-blue-800'}`}>
          {sale.platform}
        </span>
      )
    },
    {
      header: 'Origem',
      accessor: 'source',
      render: (sale: ISale) => (
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
          ${sale.status === 'canceled'
            ? 'bg-red-50 text-red-700'
            : sale.source === 'editora'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
          {sale.source === 'editora' ? 'Editora' : 'Parceira'}
        </span>
      )
    },
    {
      header: 'Data',
      accessor: 'saleDate',
      render: (sale: ISale) => (
        <div className={`text-sm ${sale.status === 'canceled' ? 'text-red-700' : 'text-gray-900'}`}>
          {new Date(sale.saleDate).toLocaleDateString('pt-BR')}
        </div>
      )
    },
    {
      header: 'Qtd',
      accessor: 'quantity',
      render: (sale: ISale) => (
        <div className={`text-sm font-medium ${sale.status === 'canceled' ? 'text-red-700' : 'text-gray-900'}`}>
          {sale.quantity}
        </div>
      )
    },
    {
      header: 'Valor Unit.',
      accessor: 'salePrice',
      render: (sale: ISale) => (
        <div className={`text-sm ${sale.status === 'canceled' ? 'text-red-700' : 'text-gray-900'}`}>
          {formatCurrency(sale.salePrice)}
        </div>
      )
    },
    {
      header: 'Total',
      accessor: 'total',
      render: (sale: ISale) => (
        <div className={`text-sm font-medium ${sale.status === 'canceled'
          ? 'text-red-700 line-through'
          : 'text-gray-900'
          }`}>
          {formatCurrency(sale.salePrice * sale.quantity)}
        </div>
      )
    },
    {


      header: 'Status Pagamento',
      accessor: 'paymentStatus',
      render: (sale: ISale) => {
        if (sale.status === 'canceled') {
          return (
            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
              Cancelada
            </span>
          );
        }






















        return renderPaymentStatus(sale);
      }
    },
    {
      header: 'Status Comissão',
      accessor: 'commissionStatus',
      render: (sale: ISale) => {
        if (sale.status === 'canceled') {
          return (
            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
              Cancelada
            </span>
          );
        }

        if (!sale.commission) {
          return (
            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
              Não processada
            </span>
          );
        }

        if (typeof sale.commission === 'object') {
          if (sale.commission.isPaid) {
            return (
              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                Comissão Paga
              </span>
            );
          } else {
            return (
              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                Comissão Pendente
              </span>
            );
          }
        }

        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Em Comissão
          </span>
        );
      }
    },
    {
      header: 'Ações',
      accessor: '_id',
      render: (sale: ISale) => (
        <div className="flex space-x-1">
          {canEditSale(sale) && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenFormModal(sale);
                }}
                className="flex items-center px-2 py-1"
                title="Editar venda"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSale(sale._id);
                }}
                className="flex items-center px-2 py-1"
                title="Excluir venda"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            </>
          )}
          {!canEditSale(sale) && (
            <span className="text-xs text-gray-500 px-2 py-1">
              {sale.status === 'canceled' ? 'Cancelada' : 'Comissão Paga'}
            </span>
          )}
        </div>
      ),
    },
  ];

  const getRowClass = (sale: ISale) => {
    if (sale.status === 'canceled') {
      return 'bg-red-50 hover:bg-red-100';
    }

    if (sale.paymentStatus === 'completed') {
      return 'bg-green-50 hover:bg-green-100';
    }
    if (sale.paymentStatus === 'partial') {
      return 'bg-blue-50 hover:bg-blue-100';
    }
    if (sale.source === 'editora') {
      return 'bg-gray-50 hover:bg-gray-100';
    }
    return '';
  };

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
              Importar Relatório
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


      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de Registros</p>
              <p className="text-xl font-bold text-gray-900">


                {statusStats.total} vendas
                <span className="text-sm text-red-500 font-normal ml-2">
                  ({statusStats.canceled} canceladas)
                </span>
              </p>
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

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Livros Vendidos</p>
              <p className="text-xl font-bold text-gray-900">{totalQuantity} un</p>
            </div>
          </div>
        </div>

        {/* Novo card para status de pagamento */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status Pagamento</p>
              <div className="text-sm">
                <div className="flex justify-between">
                  <span className="text-green-600">✅ {statusStats.completed}</span>
                  <span className="text-blue-600">🔄 {statusStats.partial}</span>
                  <span className="text-yellow-600">⏳ {statusStats.pending}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">

        <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
          <div className="md:col-span-2">

            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
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
                placeholder="Buscar por livro ou autor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>

            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
              Data Inicial
            </label>
            <input
              id="start-date"
              type="date"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={dateFilter.startDate}
              onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
            />
          </div>

          <div>

            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
              Data Final
            </label>
            <input
              id="end-date"
              type="date"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={dateFilter.endDate}
              onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
            />
          </div>

          <div>

            <label htmlFor="source-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Origem
            </label>
            <select
              id="source-filter"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="all">Todas</option>
              <option value="editora">Editora</option>
              <option value="parceira">Parceira</option>
            </select>
          </div>

          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              id="status-filter"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="pending">Pendentes</option>
              <option value="processed">Processados</option>
              <option value="canceled">Cancelados</option>
            </select>
          </div>

          {/* Novo filtro para status de pagamento */}
          <div>
            <label htmlFor="payment-status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status Pagamento
            </label>
            <select
              id="payment-status-filter"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="pending">⏳ Pendente</option>
              <option value="partial">🔄 Parcial</option>
              <option value="completed">✅ Pago</option>
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
          {filteredSales.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              Nenhuma venda encontrada.
            </div>
          ) : (
            <Table
              columns={columns}
              data={filteredSales}
              keyExtractor={(sale) => sale._id}
              onRowClick={(sale) => !sale.commission && sale.status !== 'canceled' && handleOpenFormModal(sale)}
              rowClassName={getRowClass}
            />
          )}

          <div className="bg-gray-50 px-4 py-3 text-right sm:px-6 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              <span className="font-medium">Legenda:</span>
              <span className="inline-flex items-center ml-4">
                <span className="w-3 h-3 bg-green-50 border border-green-200 rounded-full mr-1"></span>
                Pagamento Completo
              </span>
              <span className="inline-flex items-center ml-4">
                <span className="w-3 h-3 bg-blue-50 border border-blue-200 rounded-full mr-1"></span>
                Pagamento Parcial
              </span>
              <span className="inline-flex items-center ml-4">
                <span className="w-3 h-3 bg-red-50 border border-red-200 rounded-full mr-1"></span>
                Vendas Canceladas
              </span>
            </div>
          </div>
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
        size="lg"
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
