import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/commons/Button';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-2xl text-gray-600 mb-8">Página não encontrada</p>
      <p className="text-gray-500 mb-8">
        A página que você está procurando não existe ou foi movida.
      </p>
      <Link to="/dashboard">
        <Button variant="primary" size="lg">
          Voltar ao Dashboard
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;