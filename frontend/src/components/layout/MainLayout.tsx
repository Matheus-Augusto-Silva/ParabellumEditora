import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';

const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 md:ml-64 pt-16 pb-10 px-4 md:px-8 bg-gray-50">
          <div style={{ maxWidth: '1700px', margin: 'auto' }}>
            <Outlet />
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default MainLayout;