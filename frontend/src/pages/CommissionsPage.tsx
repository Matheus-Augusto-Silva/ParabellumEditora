import React, { useState, useEffect } from 'react';
import Button from '@/components/commons/Button';
import Modal from '@/components/commons/Modal';
import CommissionForm from '@/components/commissions/CommissionForm';
import CommissionList from '@/components/commissions/CommissionList';
import { getPendingCommissions, getPaidCommissions, markCommissionAsPaid } from '@/services/commissionService';
import Alert from '@/components/commons/Alert';
import Container from '@/components/commons/Container';
import Card from '@/components/commons/Card';
import DataFetchWrapper from '@/components/commons/DataFetching';

const CommissionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'paid'>('pending');
  const [pendingCommissions, setPendingCommissions] = useState<any[]>([]);
  const [paidCommissions, setPaidCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showNewCommissionModal, setShowNewCommissionModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [markingAsPaid, setMarkingAsPaid] = useState<boolean>(false);

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const [pendingData, paidData] = await Promise.all([
        getPendingCommissions(),
        getPaidCommissions()
      ]);

      console.log("Pending commissions raw data:", pendingData);
      console.log("Paid commissions raw data:", paidData);

      const pendingArray = pendingData && pendingData.pendingCommissions
        ? pendingData.pendingCommissions
        : [];

      const paidArray = paidData && paidData.paidCommissions
        ? paidData.paidCommissions
        : [];

      console.log("Setting pending commissions:", pendingArray);
      console.log("Setting paid commissions:", paidArray);

      setPendingCommissions(pendingArray);
      setPaidCommissions(paidArray);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar comissões:', error);
      setError('Erro ao carregar dados de comissões. Tente recarregar a página.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, []);

  const handleCommissionCreated = () => {
    setShowNewCommissionModal(false);
    setSuccess('Comissão calculada com sucesso!');
    fetchCommissions();

    setTimeout(() => {
      setSuccess(null);
    }, 3000);
  };

  const handleCommissionPaid = async (id: string) => {
    if (markingAsPaid) return;

    setMarkingAsPaid(true);
    try {
      await markCommissionAsPaid(id);
      setSuccess('Comissão marcada como paga com sucesso!');
      fetchCommissions();

      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Erro ao marcar comissão como paga:', error);
      setError('Erro ao marcar comissão como paga. Tente novamente.');
    } finally {
      setMarkingAsPaid(false);
    }
  };

  const renderTabContent = () => {
    if (activeTab === 'pending') {
      return (
        <CommissionList
          commissions={pendingCommissions}
          onCommissionPaid={handleCommissionPaid}
          onCommissionDeleted={fetchCommissions}
          onCommissionUpdated={fetchCommissions}
          showPaidButton={true}
        />
      );
    } else {
      return (
        <CommissionList
          commissions={paidCommissions}
          showPaidButton={false}
        />
      );
    }
  };

  return (
    <Container>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Comissões</h1>
        <Button
          variant="primary"
          onClick={() => setShowNewCommissionModal(true)}
        >
          Calcular Nova Comissão
        </Button>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          className="mb-4"
          onClose={() => setError(null)}
        />
      )}

      {success && (
        <Alert
          type="success"
          message={success}
          className="mb-4"
          onClose={() => setSuccess(null)}
        />
      )}

      <Card>
        <div className="border-b border-gray-200 mb-4">
          <nav className="flex -mb-px">
            <button
              className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              onClick={() => setActiveTab('pending')}
              type="button"
            >
              Comissões Pendentes
            </button>
            <button
              className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'paid'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              onClick={() => setActiveTab('paid')}
              type="button"
            >
              Comissões Pagas
            </button>
          </nav>
        </div>

        <DataFetchWrapper
          loading={loading}
          error={error}
          isEmpty={activeTab === 'pending' ? pendingCommissions.length === 0 : paidCommissions.length === 0}
          emptyMessage={activeTab === 'pending'
            ? "Não há comissões pendentes. Calcule uma nova comissão."
            : "Não há comissões pagas."
          }
          onRetry={fetchCommissions}
        >
          {renderTabContent()}
        </DataFetchWrapper>
      </Card>

      <Modal
        isOpen={showNewCommissionModal}
        title="Calcular Nova Comissão"
        onClose={() => setShowNewCommissionModal(false)}
      >
        <CommissionForm
          onSuccess={handleCommissionCreated}
          onCancel={() => setShowNewCommissionModal(false)}
        />
      </Modal>
    </Container>
  );
};

export default CommissionsPage;