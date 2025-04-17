import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import Dashboard from '@/pages/Dashboard';
import BooksPage from '@/pages/BooksPage';
import AuthorsPage from '@/pages/AuthorsPage';
import ClientsPage from '@/pages/ClientsPage';
import SalesPage from '@/pages/SalesPage';
import CommissionsPage from '@/pages/CommissionsPage';
import NotFound from '@/pages/NotFoundPage';
import ErrorBoundary from '@/components/ErrorBoundary/ErrorBoundary';

const AppRoutes: React.FC = () => {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Navigate to="/" replace />} />
          <Route path="books" element={<BooksPage />} />
          <Route path="authors" element={<AuthorsPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="commissions" element={<CommissionsPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
};

export default AppRoutes;