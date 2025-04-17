import React from 'react';
import { IClient } from '@/types';
import Table from '@/components/commons/Table';
import Button from '@/components/commons/Button';

interface ClientListProps {
  clients: IClient[];
  onEdit: (client: IClient) => void;
  onDelete: (id: string) => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, onEdit, onDelete }) => {
  const columns = [
    {
      header: 'Nome',
      accessor: 'name',
    },
    {
      header: 'Email',
      accessor: 'email',
      render: (client: IClient) => client.email || '-'
    },
    {
      header: 'Telefone',
      accessor: 'phone',
      render: (client: IClient) => client.phone || '-'
    },
    {
      header: 'Data de Cadastro',
      accessor: 'createdAt',
      render: (client: IClient) => client.createdAt ? new Date(client.createdAt).toLocaleDateString('pt-BR') : '-'
    },
    {
      header: 'Ações',
      accessor: '_id',
      render: (client: IClient) => (
        <div className="flex space-x-2">
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(client);
            }}
          >
            Editar
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(client._id);
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
        data={clients}
        keyExtractor={(client) => client._id}
        onRowClick={onEdit}
        emptyMessage="Nenhum cliente encontrado"
      />
    </div>
  );
};

export default ClientList;