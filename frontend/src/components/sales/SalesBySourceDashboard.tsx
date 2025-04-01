import React, { useState, useEffect } from 'react';
import Card from '@/components/commons/Card';
import { formatCurrency } from '@/utils/formatters';
import { getSalesStatsBySource } from '@/services/saleService';
import { ISaleStats } from '@/types';
import DataFetchWrapper from '@/components/commons/DataFetching';

const SalesBySourceDashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    parceira: ISaleStats;
    editora: ISaleStats;
    total: ISaleStats;
  } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getSalesStatsBySource();
        setStats(data);
      } catch (error: any) {
        setError('Falha ao carregar as estatísticas. Por favor, tente novamente.');
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return (value / total) * 100;
  };

  return (
    <DataFetchWrapper
      loading={loading}
      error={error}
      isEmpty={!stats}
      emptyMessage="Nenhuma estatística encontrada."
      onRetry={() => window.location.reload()}
    >
      {stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium mb-1">Total de Vendas</p>
                  <p className="text-2xl font-bold tracking-tight">
                    {formatCurrency(stats.total.totalSales)}
                  </p>
                  <p className="text-indigo-100 text-xs mt-2">
                    {stats.total.totalQuantity} unidades vendidas
                  </p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium mb-1">Vendas via Parceiras</p>
                  <p className="text-2xl font-bold tracking-tight">
                    {formatCurrency(stats.parceira.totalSales)}
                  </p>
                  <p className="text-amber-100 text-xs mt-2">
                    {stats.parceira.totalQuantity} unidades vendidas
                  </p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium mb-1">Vendas Site/Editora</p>
                  <p className="text-2xl font-bold tracking-tight">
                    {formatCurrency(stats.editora.totalSales)}
                  </p>
                  <p className="text-emerald-100 text-xs mt-2">
                    {stats.editora.totalQuantity} unidades vendidas
                  </p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Distribuição de Vendas" titleClass="text-lg font-semibold text-gray-800 mb-4" className="hover:shadow-md transition-shadow">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-amber-200 text-amber-800">
                      Parceiras ({calculatePercentage(stats.parceira.totalSales, stats.total.totalSales).toFixed(0)}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-emerald-200 text-emerald-800">
                      Site/Editora ({calculatePercentage(stats.editora.totalSales, stats.total.totalSales).toFixed(0)}%)
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-6 mb-4 text-xs flex rounded bg-gray-200">
                  <div
                    style={{ width: `${calculatePercentage(stats.parceira.totalSales, stats.total.totalSales)}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-amber-500"
                  >
                  </div>
                  <div
                    style={{ width: `${calculatePercentage(stats.editora.totalSales, stats.total.totalSales)}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500"
                  >
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Distribuição de Receita</h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-2">Vendas via Parceira (30% editora, 70% parceira)</h4>
                    <div className="relative pt-1">
                      <div className="overflow-hidden h-4 mb-1 text-xs flex rounded bg-gray-200">
                        <div style={{ width: "3%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 relative">
                          <span className="absolute left-0 right-0 text-xs font-semibold">3%</span>
                        </div>
                        <div style={{ width: "27%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 relative">
                          <span className="absolute left-0 right-0 text-xs font-semibold">27%</span>
                        </div>
                        <div style={{ width: "70%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gray-500 relative">
                          <span className="absolute left-0 right-0 text-xs font-semibold">70%</span>
                        </div>
                      </div>
                      <div className="flex text-xs justify-between">
                        <span>Autor (3%)</span>
                        <span>Editora (27%)</span>
                        <span>Parceira (70%)</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-2">Vendas via Site/Editora (90% editora, 10% outros)</h4>
                    <div className="relative pt-1">
                      <div className="overflow-hidden h-4 mb-1 text-xs flex rounded bg-gray-200">
                        <div style={{ width: "9%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 relative">
                          <span className="absolute left-0 right-0 text-xs font-semibold">9%</span>
                        </div>
                        <div style={{ width: "81%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 relative">
                          <span className="absolute left-0 right-0 text-xs font-semibold">81%</span>
                        </div>
                        <div style={{ width: "10%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gray-500 relative">
                          <span className="absolute left-0 right-0 text-xs font-semibold">10%</span>
                        </div>
                      </div>
                      <div className="flex text-xs justify-between">
                        <span>Autor (9%)</span>
                        <span>Editora (81%)</span>
                        <span>Outros (10%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Receita por Origem" titleClass="text-lg font-semibold text-gray-800 mb-4" className="hover:shadow-md transition-shadow">
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">Parceiras</span>
                    <span className="text-sm font-semibold">{formatCurrency(stats.parceira.totalSales)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-amber-500 h-2.5 rounded-full"
                      style={{ width: `${calculatePercentage(stats.parceira.totalSales, stats.total.totalSales)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Receita Autor: {formatCurrency(stats.parceira.totalSales * 0.03)}</span>
                    <span>Receita Editora: {formatCurrency(stats.parceira.totalSales * 0.27)}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">Site/Editora</span>
                    <span className="text-sm font-semibold">{formatCurrency(stats.editora.totalSales)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-emerald-500 h-2.5 rounded-full"
                      style={{ width: `${calculatePercentage(stats.editora.totalSales, stats.total.totalSales)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Receita Autor: {formatCurrency(stats.editora.totalSales * 0.09)}</span>
                    <span>Receita Editora: {formatCurrency(stats.editora.totalSales * 0.81)}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Receita Total</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-blue-600 mb-1">Receita Total da Editora</p>
                      <p className="text-lg font-bold text-blue-800">
                        {formatCurrency(
                          (stats.parceira.totalSales * 0.27) + (stats.editora.totalSales * 0.81)
                        )}
                      </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-xs text-green-600 mb-1">Comissões dos Autores</p>
                      <p className="text-lg font-bold text-green-800">
                        {formatCurrency(
                          (stats.parceira.totalSales * 0.03) + (stats.editora.totalSales * 0.09)
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </DataFetchWrapper>
  );
};

export default SalesBySourceDashboard;