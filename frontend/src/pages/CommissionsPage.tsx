import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/commons/Button';
import Alert from '@/components/commons/Alert';
import Modal from '@/components/commons/Modal';
import Card from '@/components/commons/Card';
import CommissionForm from '@/components/comissions/CommissionForm';
import { formatCurrency } from '@/utils/formatters';
import {
  getPendingCommissions,
  getPaidCommissions,
  markCommissionAsPaid
} from '@/services/commissionService';
import { ICommission } from '@/types';
import DataFetchWrapper from '@/components/commons/DataFetching';

const CommissionsPage: React.FC = () => {
  const [allCommissions, setAllCommissions] = useState<ICommission[]>([]);
  const [pendingCommissions, setPendingCommissions] = useState<ICommission[]>([]);
  const [paidCommissions, setPaidCommissions] = useState<ICommission[]>([]);
  const [totalPending, setTotalPending] = useState<number>(0);
  const [totalPaid, setTotalPaid] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [selectedCommission, setSelectedCommission] = useState<ICommission | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'paid'>('all');
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('transfer');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isMarkingAsPaid, setIsMarkingAsPaid] = useState<boolean>(false);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      setError(null);

      const pendingData = await getPendingCommissions();
      setPendingCommissions(pendingData.pendingCommissions);
      setTotalPending(pendingData.totalPending);

      const paidData = await getPaidCommissions();
      setPaidCommissions(paidData.paidCommissions);
      setTotalPaid(paidData.totalPaid);

      setAllCommissions([...pendingData.pendingCommissions, ...paidData.paidCommissions]);
    } catch (error: any) {
      setError('Falha ao carregar as comissões. Por favor, tente novamente.');
      console.error('Erro ao carregar comissões:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, []);

  const handleOpenFormModal = () => {
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
  };

  const handleOpenPaymentModal = (commission: ICommission) => {
    setSelectedCommission(commission);
    setPaymentMethod('transfer');
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedCommission(null);
  };

  const handleFormSuccess = () => {
    fetchCommissions();
    handleCloseFormModal();
    setAlert({
      type: 'success',
      message: 'Comissão calculada com sucesso!'
    });

    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  const handleMarkAsPaid = async () => {
    if (!selectedCommission) return;

    try {
      setIsMarkingAsPaid(true);
      await markCommissionAsPaid(selectedCommission._id);
      fetchCommissions();
      handleClosePaymentModal();
      setAlert({ type: 'success', message: 'Comissão marcada como paga com sucesso!' });

      setTimeout(() => {
        setAlert(null);
      }, 5000);
    } catch (error) {
      console.error('Erro ao marcar comissão como paga:', error);
      setAlert({ type: 'error', message: 'Erro ao processar o pagamento. Tente novamente.' });
    } finally {
      setIsMarkingAsPaid(false);
    }
  };

  const getFilteredCommissions = () => {
    let data: ICommission[] = [];

    switch (activeTab) {
      case 'pending':
        data = pendingCommissions;
        break;
      case 'paid':
        data = paidCommissions;
        break;
      default:
        data = allCommissions;
        break;
    }

    if (searchTerm.trim() === '') {
      return data;
    }

    const term = searchTerm.toLowerCase().trim();
    return data.filter(comm =>
      (typeof comm.author === 'object' && comm.author.name.toLowerCase().includes(term))
    );
  };

  const filteredCommissions = getFilteredCommissions();

  const formatDateRange = (startDate: string, endDate: string) => {
    return `${new Date(startDate).toLocaleDateString('pt-BR')} - ${new Date(endDate).toLocaleDateString('pt-BR')}`;
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-red-100 text-red-800',
      'bg-yellow-100 text-yellow-800',
      'bg-green-100 text-green-800',
      'bg-blue-100 text-blue-800',
      'bg-indigo-100 text-indigo-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800'
    ];

    const charSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[charSum % colors.length];
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div>
      <PageHeader
        title="Comissões"
        subtitle="Gerencie as comissões dos autores"
        actions={
          <Button
            variant="primary"
            onClick={handleOpenFormModal}
            className="flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            Calcular Nova Comissão
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium mb-1">Comissões Pendentes</p>
              <p className="text-2xl font-bold tracking-tight">
                {formatCurrency(totalPending)}
              </p>
              <p className="text-amber-100 text-xs mt-2">
                {pendingCommissions.length} comissões a serem pagas
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium mb-1">Comissões Pagas</p>
              <p className="text-2xl font-bold tracking-tight">
                {formatCurrency(totalPaid)}
              </p>
              <p className="text-emerald-100 text-xs mt-2">
                {paidCommissions.length} comissões já pagas
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b">
          <div className="flex space-x-4 px-4">
            <button
              className={`py-4 px-2 focus:outline-none ${activeTab === 'all'
                ? 'border-b-2 border-indigo-500 text-indigo-600 font-medium'
                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
                }`}
              onClick={() => setActiveTab('all')}
            >
              Todas
            </button>
            <button
              className={`py-4 px-2 focus:outline-none ${activeTab === 'pending'
                ? 'border-b-2 border-indigo-500 text-indigo-600 font-medium'
                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
                }`}
              onClick={() => setActiveTab('pending')}
            >
              Pendentes
            </button>
            <button
              className={`py-4 px-2 focus:outline-none ${activeTab === 'paid'
                ? 'border-b-2 border-indigo-500 text-indigo-600 font-medium'
                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
                }`}
              onClick={() => setActiveTab('paid')}
            >
              Pagas
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              placeholder="Buscar por autor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <DataFetchWrapper
        loading={loading}
        error={error}
        isEmpty={filteredCommissions.length === 0}
        emptyMessage="Nenhuma comissão encontrada. Clique no botão para calcular uma nova comissão."
        onRetry={fetchCommissions}
      >
        <div className="space-y-4">
          {filteredCommissions.map((commission) => (
            <div key={commission._id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <div className="flex items-center mb-4 sm:mb-0">
                    <div className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center text-lg font-medium ${typeof commission.author === 'object' ? getAvatarColor(commission.author.name) : ''}`}>
                      {typeof commission.author === 'object' ? getInitials(commission.author.name) : 'NA'}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {typeof commission.author === 'object' ? commission.author.name : 'Autor não disponível'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatDateRange(commission.startDate, commission.endDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(commission.commissionAmount)}</p>
                    <span className={`mt-1 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${commission.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {commission.isPaid ? 'Paga' : 'Pendente'}
                      {commission.paymentDate && ` em ${new Date(commission.paymentDate).toLocaleDateString('pt-BR')}`}
                    </span>
                  </div>
                </div>

                {!commission.isPaid && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleOpenPaymentModal(commission)}
                      className="flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Marcar como Paga
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </DataFetchWrapper>

      <Modal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        title="Calcular Comissão"
      >
        <CommissionForm
          onSuccess={handleFormSuccess}
          onCancel={handleCloseFormModal}
        />
      </Modal>

      <Modal
        isOpen={isPaymentModalOpen}
        onClose={handleClosePaymentModal}
        title="Confirmar Pagamento"
      >
        {selectedCommission && (
          <div className="p-4">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Você está prestes a marcar esta comissão como paga. Esta ação não pode ser desfeita.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4 bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Detalhes da Comissão</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Autor</p>
                  <p className="font-medium">{typeof selectedCommission.author === 'object' ? selectedCommission.author.name : 'Autor não disponível'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Período</p>
                  <p className="font-medium">{formatDateRange(selectedCommission.startDate, selectedCommission.endDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Valor</p>
                  <p className="font-medium">{formatCurrency(selectedCommission.commissionAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Data de Pagamento</p>
                  <p className="font-medium">{new Date().toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pagamento</label>
              <select
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="transfer">Transferência Bancária</option>
                <option value="pix">Pix</option>
                <option value="check">Cheque</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações (opcional)</label>
              <textarea
                rows={3}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                placeholder="Adicione observações sobre este pagamento..."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              ></textarea>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="secondary"
                onClick={handleClosePaymentModal}
                disabled={isMarkingAsPaid}
              >
                Cancelar
              </Button>
              <Button
                variant="success"
                onClick={handleMarkAsPaid}
                disabled={isMarkingAsPaid}
              >
                {isMarkingAsPaid ? 'Processando...' : 'Confirmar Pagamento'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CommissionsPage;