import React, { useState, useEffect } from 'react';
import Pagination from '@/components/commons/Pagination';

interface TableColumn<T> {
  header: string;
  accessor: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  hideOnMobile?: boolean;
  priority?: number;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  rowClassName?: (item: T) => string;
  emptyMessage?: string;
  responsive?: boolean;
  pageSize?: number;
  paginated?: boolean;
}

const Table = <T extends {}>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  rowClassName,
  emptyMessage = 'Nenhum registro encontrado',
  responsive = true,
  pageSize = 10,
  paginated = true
}: TableProps<T>) => {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedData, setPaginatedData] = useState<T[]>([]);

  const totalPages = Math.ceil(data.length / pageSize);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (paginated) {
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;
      setPaginatedData(data.slice(start, end));
    } else {
      setPaginatedData(data);
    }
    if (currentPage > 1 && data.length <= pageSize) {
      setCurrentPage(1);
    }
  }, [data, currentPage, pageSize, paginated]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const sortedColumns = [...columns].sort((a, b) => {
    const priorityA = a.priority !== undefined ? a.priority : 999;
    const priorityB = b.priority !== undefined ? b.priority : 999;
    return priorityA - priorityB;
  });

  const visibleColumns = isMobile
    ? sortedColumns.filter(col => !col.hideOnMobile).slice(0, 3) // Limite para mobile
    : isTablet
      ? sortedColumns.filter(col => !col.hideOnMobile).slice(0, 5) // Limite para tablet
      : sortedColumns;

  const displayData = paginatedData;

  if (isMobile && responsive) {
    return (
      <div>
        <div className="space-y-4">
          {displayData.map((item) => {
            const rowKey = keyExtractor(item);
            const customClassName = rowClassName ? rowClassName(item) : '';

            return (
              <div
                key={rowKey}
                className={`bg-white border rounded-lg shadow-sm overflow-hidden ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''
                  } ${customClassName}`}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                <div className="p-4 space-y-3">
                  {visibleColumns.map((column, colIndex) => (
                    <div key={`${rowKey}-${colIndex}`} className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        {column.header}
                      </span>
                      <div className="mt-1">
                        {column.render
                          ? column.render(item)
                          : (item as any)[column.accessor] || '-'
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {paginated && totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md text-sm ${currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                &lt;
              </button>
              <span className="px-3 py-1 text-sm">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md text-sm ${currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className={responsive ? "overflow-x-auto" : ""}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {visibleColumns.map((column, index) => (
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
            {displayData.map((item) => {
              const rowKey = keyExtractor(item);
              const customClassName = rowClassName ? rowClassName(item) : '';

              return (
                <tr
                  key={rowKey}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                  className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''} ${customClassName}`}
                >
                  {visibleColumns.map((column, colIndex) => (
                    <td
                      key={`${rowKey}-${colIndex}`}
                      className={`px-6 py-4 whitespace-nowrap text-${column.align || 'left'}`}
                    >
                      {column.render
                        ? column.render(item)
                        : (item as any)[column.accessor] || '-'
                      }
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {paginated && totalPages > 1 && (
        <div className="py-3 flex items-center justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {paginated && data.length > 0 && (
        <div className="text-xs text-gray-500 text-center">
          Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, data.length)} de {data.length} registros
        </div>
      )}
    </div>
  );
};

export default Table;