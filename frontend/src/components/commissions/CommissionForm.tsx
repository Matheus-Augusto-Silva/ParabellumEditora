import React, { useState, useEffect } from 'react';
import Input from '@/components/commons/Input';
import Select from '@/components/commons/Select';
import Button from '@/components/commons/Button';
import Alert from '@/components/commons/Alert';
import { getAuthors } from '@/services/authorService';
import { processCommission } from '@/services/commissionService';
import { IAuthor } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { formatDateToISO } from '@/utils/dateUils';

interface CommissionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CommissionForm: React.FC<CommissionFormProps> = ({ onSuccess, onCancel }) => {
  const [authorId, setAuthorId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [authors, setAuthors] = useState<IAuthor[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ message: string; salesCount: number; amount: number } | null>(null);
  const [fetchingAuthors, setFetchingAuthors] = useState<boolean>(true);

  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const data = await getAuthors();
        setAuthors(data);
        setFetchingAuthors(false);
      } catch (error) {
        console.error('Erro ao carregar autores:', error);
        setFetchingAuthors(false);
      }
    };

    fetchAuthors();
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const formatDate = (date: Date) => {
      if (typeof formatDateToISO === 'function') {
        return formatDateToISO(date);
      }
      return date.toISOString().split('T')[0];
    };

    setStartDate(formatDate(firstDay));
    setEndDate(formatDate(lastDay));
  }, []);

  const validate = (): boolean => {
    if (!authorId) {
      setError('Selecione um autor');
      return false;
    }

    if (!startDate) {
      setError('Defina a data inicial');
      return false;
    }

    if (!endDate) {
      setError('Defina a data final');
      return false;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('A data inicial não pode ser posterior à data final');
      return false;
    }

    setError(null);
    return true;
  };

  const handleCalculate = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const result = await processCommission(
        authorId,
        startDate,
        endDate
      );

      setSuccess({
        message: 'Comissão calculada com sucesso!',
        salesCount: result.salesCount,
        amount: result.authorCommission
      });

      setLoading(false);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        setError('Não há vendas pendentes para o período selecionado.');
      } else if (error.message === 'Nenhuma venda encontrada para o período selecionado.') {
        setError('Não há vendas pendentes para o período selecionado.');
      } else {
        console.error('Erro ao calcular comissão:', error);
        setError('Ocorreu um erro ao calcular a comissão. Tente novamente.');
      }
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <Alert
          type="error"
          message={error}
          className="mb-4"
          onClose={() => setError(null)}
        />
      )}

      {success && (
        <Alert
          type="success"
          message={success.message}
          className="mb-4"
        >
          <div className="mt-2">
            <p><strong>Vendas processadas:</strong> {success.salesCount}</p>
            <p><strong>Valor da comissão:</strong> {formatCurrency(success.amount)}</p>
          </div>
        </Alert>
      )}

      <Select
        id="author"
        label="Autor"
        value={authorId}
        onChange={(e) => setAuthorId(e.target.value)}
        options={authors.map((author) => ({ value: author._id, label: author.name }))}
        disabled={fetchingAuthors || loading}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id="startDate"
          label="Data Inicial"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          disabled={loading}
          required
        />

        <Input
          id="endDate"
          label="Data Final"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div className="flex justify-end space-x-2 mt-6">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleCalculate}
          disabled={loading || fetchingAuthors}
        >
          {loading ? 'Calculando...' : 'Calcular Comissão'}
        </Button>
      </div>
    </div>
  );
};

export default CommissionForm;