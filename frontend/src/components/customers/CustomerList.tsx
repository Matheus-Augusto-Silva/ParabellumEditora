import React from 'react';
import { ICustomer } from '@/types';
import Table from '@/components/commons/Table';
import Button from '@/components/commons/Button';

interface CustomerListProps {
  customers: ICustomer[];
  onEdit: (customer: ICustomer) => void;
  onDelete: (id: string) => void;
}

const CustomerList: React.FC<CustomerListProps> = ({ customers, onEdit, onDelete }) => {
  const columns = [
    {
      header: 'Nome',
      accessor: 'name',
    },
    {
      header: 'Email',
      accessor: 'email',
      render: (customer: ICustomer) => customer.email || '-'
    },
    {
      header: 'Telefone',
      accessor: 'phone',
      render: (customer: ICustomer) => customer.phone || '-'
    },
    {
      header: 'Data de Cadastro',
      accessor: 'createdAt',
      render: (customer: ICustomer) => customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('pt-BR') : '-'
    },
    {
      header: 'Ações',
      accessor: '_id',
      render: (customer: ICustomer) => (
        <div className="flex space-x-2">
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(customer);
            }}
          >
            Editar
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(customer._id);
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
        data={customers}
        keyExtractor={(customer) => customer._id}
        onRowClick={onEdit}
        emptyMessage="Nenhum customere encontrado"
      />
    </div>
  );
};

export default CustomerList;