import React, { useState } from 'react';
import { formatDateToBR } from '@/utils/dateUils';
import { formatCurrency } from '@/utils/formatters';
import Button from '@/components/commons/Button';
import Modal from '@/components/commons/Modal';
import { deleteCommission } from '@/services/commissionService';
import CommissionEditForm from './CommissionEditForm';
import Table from '@/components/commons/Table';

interface CommissionItem {
  _id: string;
  author: {
    _id: string;
    name: string;
  } | string;  // Permitir que o autor seja uma string (ID) ou um objeto
  authorName?: string; // Campo alternativo para o nome do autor
  startDate: string;
  endDate: string;
  commissionAmount: number;
  totalSales: number;
  isPaid: boolean;
  paymentDate?: string;
  createdAt: string;
  sales: string[];
}

interface CommissionListProps {
  commissions: CommissionItem[];
  onCommissionPaid?: (id: string) => void;
  onCommissionDeleted?: () => void;
  onCommissionUpdated?: () => void;
  showPaidButton?: boolean;
}

const CommissionList: React.FC<CommissionListProps> = ({
  commissions,
  onCommissionPaid,
  onCommissionDeleted,
  onCommissionUpdated,
  showPaidButton = false
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [editCommissionId, setEditCommissionId] = useState<string | null>(null);

  console.log("CommissionList received commissions:", commissions);

  const handleDeleteConfirm = async () => {
    if (confirmDeleteId) {
      setDeleteLoading(true);
      try {
        await deleteCommission(confirmDeleteId);
        setConfirmDeleteId(null);
        setDeleteLoading(false);

        if (onCommissionDeleted) {
          onCommissionDeleted();
        }
      } catch (error) {
        console.error('Erro ao excluir comissão:', error);
        setDeleteLoading(false);
      }
    }
  };

  const handleEditSuccess = () => {
    setEditCommissionId(null);
    if (onCommissionUpdated) {
      onCommissionUpdated();
    }
  };

  // Verifica se commissions é um array
  if (!Array.isArray(commissions)) {
    console.error("Commissions is not an array:", commissions);
    return <p className="text-gray-500 italic">Erro ao carregar comissões.</p>;
  }

  if (commissions.length === 0) {
    return <p className="text-gray-500 italic">Nenhuma comissão encontrada.</p>;
  }

  // Função auxiliar para obter o nome do autor
  const getAuthorName = (commission: CommissionItem): string => {
    if (typeof commission.author === 'object' && commission.author !== null && commission.author.name) {
      return commission.author.name;
    } else if (commission.authorName) {
      return commission.authorName;
    } else {
      return 'Autor não identificado';
    }
  };

  const columns = [
    {
      header: 'Autor',
      accessor: 'author',
      render: (item: CommissionItem) => getAuthorName(item)
    },
    {
      header: 'Período',
      accessor: 'period',
      render: (item: CommissionItem) => `${formatDateToBR(item.startDate)} a ${formatDateToBR(item.endDate)}`
    },
    {
      header: 'Total de Vendas',
      accessor: 'totalSales',
      render: (item: CommissionItem) => formatCurrency(item.totalSales)
    },
    {
      header: 'Valor da Comissão',
      accessor: 'commissionAmount',
      render: (item: CommissionItem) => formatCurrency(item.commissionAmount)
    },
    {
      header: 'Data de Criação',
      accessor: 'createdAt',
      render: (item: CommissionItem) => formatDateToBR(item.createdAt)
    },
    {
      header: 'Ações',
      accessor: 'actions',
      render: (item: CommissionItem) => (
        <div className="flex space-x-2 justify-end">
          {showPaidButton && !item.isPaid && onCommissionPaid && (
            <Button
              variant="success"
              size="sm"
              onClick={() => onCommissionPaid(item._id)}
            >
              Marcar como Pago
            </Button>
          )}

          {!item.isPaid && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setEditCommissionId(item._id)}
              >
                Editar
              </Button>

              <Button
                variant="danger"
                size="sm"
                onClick={() => setConfirmDeleteId(item._id)}
              >
                Excluir
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <Table
        columns={columns}
        data={commissions}
        keyExtractor={(item) => item._id}
      />

      <Modal
        isOpen={confirmDeleteId !== null}
        title="Confirmar Exclusão"
        onClose={() => setConfirmDeleteId(null)}
      >
        <div className="p-6">
          <p className="mb-4">
            Tem certeza que deseja excluir esta comissão? Esta ação não pode ser desfeita e as
            vendas associadas ficarão disponíveis novamente para cálculo.
          </p>
          <div className="flex justify-end space-x-2">
            <Button
              variant="secondary"
              onClick={() => setConfirmDeleteId(null)}
              disabled={deleteLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </div>
      </Modal>

      {editCommissionId && (
        <Modal
          isOpen={editCommissionId !== null}
          title="Editar Comissão"
          onClose={() => setEditCommissionId(null)}
        >
          <CommissionEditForm
            commissionId={editCommissionId}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditCommissionId(null)}
          />
        </Modal>
      )}
    </div>
  );
};

export default CommissionList;