import React from 'react';
import { IAuthor } from '@/types';
import Table from '@/components/commons/Table';
import Button from '@/components/commons/Button';

interface AuthorListProps {
  authors: IAuthor[];
  onEdit: (author: IAuthor) => void;
  onDelete: (id: string) => void;
  onViewStats: (id: string) => void;
}

const AuthorList: React.FC<AuthorListProps> = ({ authors, onEdit, onDelete, onViewStats }) => {
  const columns = [
    {
      header: 'Nome',
      accessor: 'name',
    },
    {
      header: 'Email',
      accessor: 'email',
      render: (author: IAuthor) => author.email || '-'
    },
    {
      header: 'Taxa de Comissão',
      accessor: 'commissionRate',
      render: (author: IAuthor) => `${author.commissionRate}%`
    },
    {
      header: 'Ações',
      accessor: '_id',
      render: (author: IAuthor) => (
        <div className="flex space-x-2">
          <Button
            variant="success"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewStats(author._id);
            }}
          >
            Estatísticas
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(author);
            }}
          >
            Editar
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(author._id);
            }}
          >
            Excluir
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={authors}
      keyExtractor={(author) => author._id}
      onRowClick={onEdit}
      emptyMessage="Nenhum autor encontrado"
    />
  );
};

export default AuthorList;