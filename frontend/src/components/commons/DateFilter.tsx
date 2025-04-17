import React from 'react';

interface DateFilterProps {
  startDate: string;
  endDate: string;
  onChangeStartDate: (date: string) => void;
  onChangeEndDate: (date: string) => void;
  className?: string;
}

const DateFilter: React.FC<DateFilterProps> = ({
  startDate,
  endDate,
  onChangeStartDate,
  onChangeEndDate,
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      <div>
        <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
        <input
          id="start-date"
          type="date"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={startDate}
          onChange={(e) => onChangeStartDate(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
        <input
          id="end-date"
          type="date"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={endDate}
          onChange={(e) => onChangeEndDate(e.target.value)}
        />
      </div>
    </div>
  );
};

export default DateFilter;