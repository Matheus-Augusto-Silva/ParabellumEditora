import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/commons/Button';

import { ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Error caught in ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Ops! Algo deu errado.</h1>
          <p className="text-gray-600 mb-8">
            Não foi possível carregar esta página.
          </p>
          <Link to="/dashboard">
            <Button variant="primary" size="lg">
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;