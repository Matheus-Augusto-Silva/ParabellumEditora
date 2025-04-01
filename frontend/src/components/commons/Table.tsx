import React, { ReactNode } from 'react';

interface Column {
  header: string;
  accessor: string;
  render?: (item: any, index: number) => ReactNode;
}

interface TableProps {
  columns: Column[];
  data: any[];
  keyExtractor: (item: any, index: number) => string;
  className?: string;
  onRowClick?: (item: any) => void;
}

const Table: React.FC<TableProps> = ({
  columns,
  data,
  keyExtractor,
  className = '',
  onRowClick
}) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
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
          {data.map((item, rowIndex) => (
            <tr
              key={keyExtractor(item, rowIndex)}
              className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
              onClick={() => onRowClick && onRowClick(item)}
            >
              {columns.map((column, colIndex) => (
                <td
                  key={`${keyExtractor(item, rowIndex)}-${colIndex}`}
                  className="px-6 py-4 whitespace-nowrap"
                >
                  {column.render ? column.render(item, rowIndex) : item[column.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {data.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          Nenhum dado encontrado
        </div>
      )}
    </div>
  );
};

export default Table;