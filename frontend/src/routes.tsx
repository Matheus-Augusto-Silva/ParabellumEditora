import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';

import Dashboard from '@/pages/Dashboard';
import BooksPage from '@/pages/BooksPage';
import AuthorsPage from '@/pages/AuthorsPage';
import SalesPage from '@/pages/SalesPage';
import CommissionsPage from '@/pages/CommissionsPage';
import NotFound from '@/pages/NotFoundPage';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="books" element={<BooksPage />} />
        <Route path="authors" element={<AuthorsPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="commissions" element={<CommissionsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;