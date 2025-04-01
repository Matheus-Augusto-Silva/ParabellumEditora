import React, { useEffect, useState } from 'react';
/* import PageHeader from '@/components/layout/PageHeader'; */
import Card from '@/components/commons/Card';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/utils/formatters';
import { getSalesStats } from '@/services/statsService';
import { getPendingCommissions } from '@/services/commissionService';
import { getAuthors } from '@/services/authorService';
import { getBooks } from '@/services/bookService';
import { getSales } from '@/services/saleService';
import { ISaleStats, IAuthor, IBook, ISale, IPendingCommissions } from '@/types';
import DataFetchWrapper from '@/components/commons/DataFetching';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ISaleStats | null>(null);
  const [pendingCommissions, setPendingCommissions] = useState<IPendingCommissions | null>(null);
  const [recentSales, setRecentSales] = useState<ISale[]>([]);
  const [authorsCount, setAuthorsCount] = useState<number>(0);
  const [booksCount, setBooksCount] = useState<number>(0);
  const [topBooks, setTopBooks] = useState<Array<{ id: string; title: string; quantity: number; total: number }>>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [
          salesStatsData,
          pendingCommissionsData,
          authorsData,
          booksData,
          salesData
        ] = await Promise.all([
          getSalesStats(),
          getPendingCommissions(),
          getAuthors(),
          getBooks(),
          getSales()
        ]);

        setStats(salesStatsData);
        setPendingCommissions(pendingCommissionsData);
        setAuthorsCount(authorsData.length);
        setBooksCount(booksData.length);

        setTopBooks(salesStatsData.salesByBook.slice(0, 5));

        const sortedSales = [...salesData];
        sortedSales.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
        setRecentSales(sortedSales.slice(0, 5));

        setLoading(false);
      } catch (error: any) {
        setError('Falha ao carregar os dados do dashboard. Por favor, tente novamente.');
        setLoading(false);
        console.error('Erro ao carregar dados do dashboard:', error);
      }
    };

    fetchDashboardData();
  }, []);

  const calculatePercentage = (value: number, max: number) => {
    return (value / max) * 100;
  };

  const maxBookTotal = topBooks.length > 0 ? Math.max(...topBooks.map(book => book.total)) : 0;
  const maxPlatformTotal = stats && Object.values(stats.salesByPlatform).length > 0 ?
    Math.max(...Object.values(stats.salesByPlatform).map(platform => platform.total)) : 0;

  return (
    <div>
      {/*   <PageHeader
        title="Dashboard"
        subtitle="Visão geral do sistema de vendas de livros"
      /> */}

      <DataFetchWrapper
        loading={loading}
        error={error}
        isEmpty={false}
      >
        {stats && pendingCommissions && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm font-medium mb-1">Total de Vendas</p>
                    <p className="text-2xl font-bold tracking-tight">
                      {formatCurrency(stats.totalSales)}
                    </p>
                    <p className="text-indigo-100 text-xs mt-2">
                      Últimos 180 dias
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-full p-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium mb-1">Livros Vendidos</p>
                    <p className="text-2xl font-bold tracking-tight">
                      {stats.totalQuantity} unidades
                    </p>
                    <p className="text-emerald-100 text-xs mt-2">
                      {(stats.totalQuantity / 180).toFixed(1)} livros/dia
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-full p-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm font-medium mb-1">Comissões Pendentes</p>
                    <p className="text-2xl font-bold tracking-tight">
                      {formatCurrency(pendingCommissions.totalPending)}
                    </p>
                    <p className="text-amber-100 text-xs mt-2">
                      {pendingCommissions.pendingCommissions.length} pagamentos
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-full p-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium mb-1">Autores Ativos</p>
                    <p className="text-2xl font-bold tracking-tight">
                      {authorsCount}
                    </p>
                    <p className="text-purple-100 text-xs mt-2">
                      {booksCount} livros publicados
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-full p-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card title="Vendas por Plataforma" titleClass="text-lg font-semibold text-gray-800 mb-4" className="hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  {Object.entries(stats.salesByPlatform)
                    .sort((a, b) => b[1].total - a[1].total)
                    .map(([platform, data]) => (
                      <div key={platform}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700">{platform}</span>
                          <span className="text-sm font-semibold">{formatCurrency(data.total)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-indigo-600 h-2.5 rounded-full"
                            style={{ width: `${calculatePercentage(data.total, maxPlatformTotal)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{data.quantity} unidades vendidas</p>
                      </div>
                    ))
                  }
                </div>
              </Card>

              <Card title="Livros Mais Vendidos" titleClass="text-lg font-semibold text-gray-800 mb-4" className="hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  {topBooks.map((book) => (
                    <div key={book.id}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700 truncate w-48" title={book.title}>{book.title}</span>
                        <span className="text-sm font-semibold">{formatCurrency(book.total)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-emerald-500 h-2.5 rounded-full"
                          style={{ width: `${calculatePercentage(book.total, maxBookTotal)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{book.quantity} unidades vendidas</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-right">
                  <Link
                    to="/books"
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center justify-end"
                  >
                    Ver todos os livros
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <Card title="Vendas Recentes" titleClass="text-lg font-semibold text-gray-800 mb-4" className="hover:shadow-md transition-shadow">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Livro
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Autor
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plataforma
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantidade
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentSales.map((sale) => (
                        <tr key={sale._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {typeof sale.book === 'object' ? sale.book.title : 'Indisponível'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {typeof sale.book === 'object' && typeof sale.book.author === 'object' ? sale.book.author.name : 'Indisponível'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {sale.platform}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(sale.saleDate).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {sale.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(sale.salePrice * sale.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-right">
                  <Link
                    to="/sales"
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center justify-end"
                  >
                    Ver todas as vendas
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </Card>
            </div>
          </>
        )}
      </DataFetchWrapper>
    </div>
  );
};

export default Dashboard;