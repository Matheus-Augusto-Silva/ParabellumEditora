import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from '@/routes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ErrorBoundary from '@/components/ErrorBoundary/ErrorBoundary';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        // Limitar o tamanho do toast
        style={{ maxWidth: '350px' }}
        toastStyle={{
          maxHeight: '150px',
          overflow: 'auto',
          fontSize: '14px'
        }}
        limit={3} // Limita o número de toasts visíveis simultaneamente
      />
    </BrowserRouter>
  );
};

export default App;