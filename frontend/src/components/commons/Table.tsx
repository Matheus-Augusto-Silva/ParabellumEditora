import React from 'react';

interface TableColumn<T> {
  header: string;
  accessor: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  rowClassName?: (item: T) => string;
  emptyMessage?: string;
  responsive?: boolean;
}

const Table = <T extends {}>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  rowClassName,
  emptyMessage = 'Nenhum registro encontrado',
  responsive = true
}: TableProps<T>) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className={responsive ? "overflow-x-auto" : ""}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className={`px-6 py-3 text-${column.align || 'left'} text-xs font-medium text-gray-500 uppercase tracking-wider ${column.width ? `w-${column.width}` : ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item) => {
            const rowKey = keyExtractor(item);
            const customClassName = rowClassName ? rowClassName(item) : '';

            return (
              <tr
                key={rowKey}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
                className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''} ${customClassName}`}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={`${rowKey}-${colIndex}`}
                    className={`px-6 py-4 whitespace-nowrap text-${column.align || 'left'}`}
                  >
                    {column.render
                      ? column.render(item)
                      : (item as any)[column.accessor]
                    }
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Table;