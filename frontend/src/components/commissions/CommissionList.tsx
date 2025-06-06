import React, { useState } from 'react';
import { formatDateToBR } from '@/utils/dateUils';
import { formatCurrency } from '@/utils/formatters';
import Button from '@/components/commons/Button';
import Modal from '@/components/commons/Modal';
import { deleteCommission } from '@/services/commissionService';
import CommissionEditForm from './CommissionEditForm';
import Table from '@/components/commons/Table';

interface ICommissionDetail {
  bookTitle: string;
  numberOfAuthors?: number;
  coAuthors?: string[];
  saleTotal: number;
  originalRate?: number;
  dividedRate?: string;
  rate?: number;
  commission: string;
}

interface CommissionItem {
  _id: string;
  author: {
    _id: string;
    name: string;
  } | string;
  authorName?: string;
  startDate: string;
  endDate: string;
  commissionAmount: number;
  totalSales: number;
  isPaid: boolean;
  paymentDate?: string;
  createdAt: string;
  sales: string[];
  hasDividedCommissions?: boolean;
  dividedCommissionDetails?: ICommissionDetail[];
  integralCommissionDetails?: ICommissionDetail[];
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
  const [expandedCommission, setExpandedCommission] = useState<string | null>(null);

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

  if (!Array.isArray(commissions)) {
    console.error("Commissions is not an array:", commissions);
    return <p className="text-gray-500 italic">Erro ao carregar comissões.</p>;
  }

  if (commissions.length === 0) {
    return <p className="text-gray-500 italic">Nenhuma comissão encontrada.</p>;
  }

  const getAuthorName = (commission: CommissionItem): string => {
    if (typeof commission.author === 'object' && commission.author !== null && commission.author.name) {
      return commission.author.name;
    } else if (commission.authorName) {
      return commission.authorName;
    } else {
      return 'Autor não identificado';
    }
  };

  const renderCommissionType = (item: CommissionItem) => {
    if (item.hasDividedCommissions) {
      return (
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
            </svg>
            Dividida
          </span>
          <button
            onClick={() => setExpandedCommission(
              expandedCommission === item._id ? null : item._id
            )}
            className="text-blue-600 hover:text-blue-800 text-sm underline"
          >
            {expandedCommission === item._id ? 'Ocultar detalhes' : 'Ver detalhes'}
          </button>
        </div>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Integral
      </span>
    );
  };

  const renderExpandedDetails = (item: CommissionItem) => {
    if (expandedCommission !== item._id || !item.hasDividedCommissions) {
      return null;
    }

    return (
      <tr>
        <td colSpan={6} className="px-6 py-4 bg-gray-50">
          <div className="space-y-4">
            {/* Comissões Divididas */}
            {item.dividedCommissionDetails && item.dividedCommissionDetails.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Livros com Comissão Dividida:</h4>
                <div className="space-y-2">
                  {item.dividedCommissionDetails.map((detail, index) => (
                    <div key={index} className="bg-white p-3 rounded border border-yellow-200">
                      <div className="font-medium text-gray-900">{detail.bookTitle}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        <div>Co-autores: {detail.coAuthors?.join(', ')}</div>
                        <div>Taxa: {detail.dividedRate}% (original: {detail.originalRate}%)</div>
                        <div>Dividido entre {detail.numberOfAuthors} autores</div>
                        <div>Valor da venda: {formatCurrency(detail.saleTotal)}</div>
                        <div className="font-medium">Comissão: R$ {detail.commission}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comissões Integrais */}
            {item.integralCommissionDetails && item.integralCommissionDetails.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Livros com Comissão Integral:</h4>
                <div className="space-y-2">
                  {item.integralCommissionDetails.map((detail, index) => (
                    <div key={index} className="bg-white p-3 rounded border border-green-200">
                      <div className="font-medium text-gray-900">{detail.bookTitle}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        <div>Taxa: {detail.rate}%</div>
                        <div>Valor da venda: {formatCurrency(detail.saleTotal)}</div>
                        <div className="font-medium">Comissão: R$ {detail.commission}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const columns = [
    {
      header: 'Autor',
      accessor: 'author',
      render: (item: CommissionItem) => getAuthorName(item)
    },
    {
      header: 'Tipo',
      accessor: 'type',
      render: (item: CommissionItem) => renderCommissionType(item)
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
      {/* Tabela customizada para suportar linhas expandidas */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {commissions.map((item) => (
              <React.Fragment key={item._id}>
                <tr className="hover:bg-gray-50">
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {column.render ? column.render(item) : String(item[column.accessor as keyof CommissionItem] || '')}
                    </td>
                  ))}
                </tr>
                {renderExpandedDetails(item)}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

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
