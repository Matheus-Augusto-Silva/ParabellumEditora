import React from 'react';
import { formatCurrency } from '@/utils/formatters';

interface CommissionDetailProps {
  calculation: {
    totalSales: number;
    totalQuantity: number;
    authorCommission: number;
    publisherRevenue: number;
    partnerRevenue: number;
    detail: {
      parceira: {
        sales: number;
        quantity: number;
        total: number;
        authorCommission: number;
        publisherRevenue: number;
        partnerRevenue: number;
      };
      editora: {
        sales: number;
        quantity: number;
        total: number;
        authorCommission: number;
        publisherRevenue: number;
      };
    };
  };
}

const CommissionDetails: React.FC<CommissionDetailProps> = ({ calculation }) => {
  const totalAuthorPercentage = (calculation.authorCommission / calculation.totalSales) * 100;

  const parceiraAuthorPercentage = calculation.detail.parceira.total > 0
    ? (calculation.detail.parceira.authorCommission / calculation.detail.parceira.total) * 100
    : 0;

  const editoraAuthorPercentage = calculation.detail.editora.total > 0
    ? (calculation.detail.editora.authorCommission / calculation.detail.editora.total) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1">Total de Vendas</div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(calculation.totalSales)}</div>
          <div className="text-sm text-gray-500 mt-1">
            {calculation.totalQuantity} unidades vendidas
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
          <div className="text-sm font-medium text-green-600 mb-1">Comissão do Autor</div>
          <div className="text-2xl font-bold text-green-700">{formatCurrency(calculation.authorCommission)}</div>
          <div className="text-sm text-green-600 mt-1">
            {totalAuthorPercentage.toFixed(2)}% do total de vendas
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
          <div className="text-sm font-medium text-blue-600 mb-1">Receita da Editora</div>
          <div className="text-2xl font-bold text-blue-700">{formatCurrency(calculation.publisherRevenue)}</div>
          <div className="text-sm text-blue-600 mt-1">
            {((calculation.publisherRevenue / calculation.totalSales) * 100).toFixed(2)}% do total de vendas
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Comparativo por Origem de Venda</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Detalhamento das comissões por tipo de venda (parceira vs editora).
          </p>
        </div>

        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Métrica
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parceira
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Editora/Site
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Quantidade de vendas
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {calculation.detail.parceira.sales} vendas
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {calculation.detail.editora.sales} vendas
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {calculation.detail.parceira.sales + calculation.detail.editora.sales} vendas
                  </td>
                </tr>

                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Unidades vendidas
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {calculation.detail.parceira.quantity} unidades
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {calculation.detail.editora.quantity} unidades
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {calculation.totalQuantity} unidades
                  </td>
                </tr>

                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Valor total
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(calculation.detail.parceira.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(calculation.detail.editora.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(calculation.totalSales)}
                  </td>
                </tr>

                <tr className="bg-green-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-800">
                    Comissão do autor
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700">
                    {formatCurrency(calculation.detail.parceira.authorCommission)}
                    <span className="block text-xs text-green-600">
                      ({parceiraAuthorPercentage.toFixed(2)}% das vendas - 10% dos 30%)
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700">
                    {formatCurrency(calculation.detail.editora.authorCommission)}
                    <span className="block text-xs text-green-600">
                      ({editoraAuthorPercentage.toFixed(2)}% das vendas - 10% dos 90%)
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-800">
                    {formatCurrency(calculation.authorCommission)}
                  </td>
                </tr>

                <tr className="bg-blue-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-800">
                    Receita da editora
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700">
                    {formatCurrency(calculation.detail.parceira.publisherRevenue)}
                    <span className="block text-xs text-blue-600">
                      ({((calculation.detail.parceira.publisherRevenue / calculation.detail.parceira.total) * 100).toFixed(2)}% - 90% dos 30%)
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700">
                    {formatCurrency(calculation.detail.editora.publisherRevenue)}
                    <span className="block text-xs text-blue-600">
                      ({((calculation.detail.editora.publisherRevenue / calculation.detail.editora.total) * 100).toFixed(2)}% - 90% dos 90%)
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-800">
                    {formatCurrency(calculation.publisherRevenue)}
                  </td>
                </tr>

                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Parceiro/Outros
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(calculation.detail.parceira.partnerRevenue)}
                    <span className="block text-xs text-gray-500">
                      (70% das vendas via parceira)
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(calculation.detail.editora.total * 0.1)}
                    <span className="block text-xs text-gray-500">
                      (10% para custos/taxas)
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(calculation.partnerRevenue)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200">
          <div className="flex space-x-1 text-sm text-gray-500">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <p>
              Para vendas via parceira, a comissão do autor é 3% do valor total da venda (10% dos 30%). Para vendas via site/editora,
              a comissão do autor é 9% do valor total (10% dos 90%).
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Distribuição de Receita</h3>
        </div>

        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Vendas via Parceira</h4>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-green-200 text-green-800">
                      Autor (3%)
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-blue-200 text-blue-800">
                      Editora (27%)
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-gray-200 text-gray-800">
                      Parceira (70%)
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-6 mb-4 text-xs flex rounded bg-gray-200">
                  <div style={{ width: "3%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                  <div style={{ width: "27%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                  <div style={{ width: "70%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gray-500"></div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Vendas via Site/Editora</h4>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-green-200 text-green-800">
                      Autor (9%)
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-blue-200 text-blue-800">
                      Editora (81%)
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-gray-200 text-gray-800">
                      Outros (10%)
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-6 mb-4 text-xs flex rounded bg-gray-200">
                  <div style={{ width: "9%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                  <div style={{ width: "81%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                  <div style={{ width: "10%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gray-500"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommissionDetails;