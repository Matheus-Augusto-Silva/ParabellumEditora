import React from 'react';
import DateFilter from './DateFilter';

interface SearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  dateFilter: {
    startDate: string;
    endDate: string;
  };
  onDateFilterChange: (startDate: string, endDate: string) => void;
  showDateFilter?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  dateFilter,
  onDateFilterChange,
  showDateFilter = true,
  children,
  className = ''
}) => {
  const handleStartDateChange = (startDate: string) => {
    onDateFilterChange(startDate, dateFilter.endDate);
  };

  const handleEndDateChange = (endDate: string) => {
    onDateFilterChange(dateFilter.startDate, endDate);
  };

  return (
    <div className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className={`grid grid-cols-1 ${showDateFilter ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-4`}>
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              id="search"
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"

              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {showDateFilter && (
          <div className="md:col-span-2">
            <DateFilter
              startDate={dateFilter.startDate}
              endDate={dateFilter.endDate}
              onChangeStartDate={handleStartDateChange}
              onChangeEndDate={handleEndDateChange}
            />
          </div>
        )}
      </div>

      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
};

export default SearchFilter;