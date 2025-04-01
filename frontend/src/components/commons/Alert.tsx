import React, { ReactNode } from 'react';

interface AlertProps {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  className?: string;
  onClose?: () => void;
  children?: ReactNode;
}

const Alert: React.FC<AlertProps> = ({
  type,
  message,
  className = '',
  onClose,
  children
}) => {
  const alertStyles = {
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <div className={`rounded-md border p-4 ${alertStyles[type]} ${className}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="font-medium">{message}</p>
          {children && <div className="mt-2">{children}</div>}
        </div>

        {onClose && (
          <button
            className="ml-4 text-gray-500 hover:text-gray-700"
            onClick={onClose}
            aria-label="Fechar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;