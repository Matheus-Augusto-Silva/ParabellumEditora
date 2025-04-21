import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/commons/Button';
import DataFetchWrapper from '@/components/commons/DataFetching';
import Modal from '@/components/commons/Modal';
import Alert from '@/components/commons/Alert';
import CustomerForm from '@/components/customers/CustomerForm';
import CustomerList from '@/components/customers/CustomerList';
import SearchFilter from '@/components/commons/SearchFilter';
import { getCustomers, deleteCustomer, importCustomersFromSales } from '@/services/customerService';
import { ICustomer } from '@/types';

const CustomersPage: React.FC = () => {
  const [allCustomers, setAllCustomers] = useState<ICustomer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<ICustomer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCustomers();
      setAllCustomers(data);
      setFilteredCustomers(data);
      setLoading(false);
    } catch (error: any) {
      setError('Falha ao carregar os clientes. Por favor, tente novamente.');
      setLoading(false);
      console.error('Erro ao carregar clientes:', error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchTerm, dateFilter, allCustomers]);

  const filterCustomers = () => {
    let filtered = [...allCustomers];

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(term) ||
        (customer.email && customer.email.toLowerCase().includes(term)) ||
        (customer.phone && customer.phone.includes(term))
      );
    }

    if (dateFilter.startDate && dateFilter.endDate) {
      const startDate = new Date(dateFilter.startDate).setHours(0, 0, 0, 0);
      const endDate = new Date(dateFilter.endDate).setHours(23, 59, 59, 999);

      filtered = filtered.filter(customer => {
        if (!customer.createdAt) return true;
        const createdAt = new Date(customer.createdAt).getTime();
        return createdAt >= startDate && createdAt <= endDate;
      });
    }

    setFilteredCustomers(filtered);
  };

  const handleOpenModal = (customer: ICustomer | null = null) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleSaveSuccess = () => {
    handleCloseModal();
    fetchCustomers();
    setAlert({
      type: 'success',
      message: selectedCustomer ? 'Cliente atualizado com sucesso!' : 'Cliente adicionado com sucesso!'
    });

    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  const handleDeleteCustomer = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await deleteCustomer(id);
        fetchCustomers();
        setAlert({ type: 'success', message: 'Cliente excluído com sucesso!' });

        setTimeout(() => {
          setAlert(null);
        }, 5000);
      } catch (error: any) {
        console.error('Erro ao excluir cliente:', error);
        setAlert({
          type: 'error',
          message: error.response?.data?.message || 'Erro ao excluir cliente. Tente novamente.'
        });

        setTimeout(() => {
          setAlert(null);
        }, 5000);
      }
    }
  };

  const handleImportFromSales = async () => {
    if (window.confirm('Deseja importar clientes das vendas registradas? Isso criará novos registros de clientes com base nos dados das vendas.')) {
      try {
        setIsImporting(true);
        const result = await importCustomersFromSales();
        fetchCustomers();
        setAlert({
          type: 'success',
          message: `${result.customersCreated.length} clientes importados com sucesso!`
        });
        setIsImporting(false);

        setTimeout(() => {
          setAlert(null);
        }, 5000);
      } catch (error: any) {
        console.error('Erro ao importar clientes:', error);
        setAlert({
          type: 'error',
          message: error.response?.data?.message || 'Erro ao importar clientes. Tente novamente.'
        });
        setIsImporting(false);

        setTimeout(() => {
          setAlert(null);
        }, 5000);
      }
    }
  };

  const handleDateFilterChange = (startDate: string, endDate: string) => {
    setDateFilter({ startDate, endDate });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-full mx-auto">
      <PageHeader
        title="Clientes"
        subtitle="Gerencie os clientes da editora"
        actions={
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <Button
              variant="secondary"
              onClick={handleImportFromSales}
              disabled={isImporting}
              className="w-full sm:w-auto flex items-center justify-center"
            >
              {isImporting ? (
                <div className="animate-spin mr-2 h-4 w-4 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              )}
              Importar das Vendas
            </Button>
            <Button
              variant="primary"
              onClick={() => handleOpenModal()}
              className="w-full sm:w-auto flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Novo Cliente
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

      <div className="mb-6">
        <SearchFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Buscar por nome, email ou telefone..."
          dateFilter={dateFilter}
          onDateFilterChange={handleDateFilterChange}
          showDateFilter={false}
          className="flex flex-col md:flex-row gap-2"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <DataFetchWrapper
          loading={loading}
          error={error}
          isEmpty={filteredCustomers.length === 0}
          emptyMessage="Nenhum cliente encontrado. Clique em 'Novo Cliente' para adicionar."
          onRetry={fetchCustomers}
        >
          <CustomerList
            customers={filteredCustomers}
            onEdit={handleOpenModal}
            onDelete={handleDeleteCustomer}
          />
        </DataFetchWrapper>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedCustomer ? 'Editar Cliente' : 'Novo Cliente'}
      >
        {isModalOpen && (
          <CustomerForm
            customer={selectedCustomer}
            onCancel={handleCloseModal}
            onSave={handleSaveSuccess}
          />
        )}
      </Modal>
    </div>
  );
};

export default CustomersPage;