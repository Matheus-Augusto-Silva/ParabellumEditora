import React, { useState, useEffect } from 'react';
import { getAuthors } from '@/services/authorService';
import { processCommission } from '@/services/commissionService';
import CommissionDetails from './CommissionDetails';
import Button from '@/components/commons/Button';
import { IAuthor, ICommissionCalculation } from '@/types';

interface CommissionSummaryProps {
  onSaveSuccess: () => void;
  onCancel: () => void;
}

const CommissionSummary: React.FC<CommissionSummaryProps> = ({ onSaveSuccess, onCancel }) => {
  const [authors, setAuthors] = useState<IAuthor[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [calculation, setCalculation] = useState<ICommissionCalculation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);

    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    try {
      const data = await getAuthors();
      setAuthors(data);
    } catch (error) {
      console.error('Erro ao carregar autores:', error);
      setError('Falha ao carregar os autores. Por favor, tente novamente.');
    }
  };

  const handleCalculate = async () => {
    if (!selectedAuthor || !startDate || !endDate) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await processCommission(selectedAuthor, startDate, endDate);
      setCalculation(result);
    } catch (error: any) {
      console.error('Erro ao calcular comissão:', error);
      setError(error.message || 'Falha ao calcular a comissão. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCommission = () => {
    if (!calculation) return;
    onSaveSuccess();
  };

  return (
    <div className="p-4">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Calcular Comissão</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
              Autor <span className="text-red-500">*</span>
            </label>
            <select
              id="author"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              disabled={loading}
            >
              <option value="">Selecione um autor</option>
              {authors.map((author) => (
                <option key={author._id} value={author._id}>
                  {author.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Data Inicial <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="startDate"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              Data Final <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="endDate"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleCalculate}
          disabled={!selectedAuthor || !startDate || !endDate || loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
        >
          {loading ? 'Calculando...' : 'Calcular Comissão'}
        </button>
      </div>

      {calculation && (
        <>
          <CommissionDetails calculation={calculation} />

          <div className="mt-6 flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveCommission}
            >
              Salvar Comissão
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default CommissionSummary;