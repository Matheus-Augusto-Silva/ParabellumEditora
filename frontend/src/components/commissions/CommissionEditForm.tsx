import React, { useState, useEffect } from 'react';
import Input from '@/components/commons/Input';
import Button from '@/components/commons/Button';
import Alert from '@/components/commons/Alert';
import { getCommissionById, updateCommission } from '@/services/commissionService';
import { formatCurrency } from '@/utils/formatters';
import DataFetchWrapper from '@/components/commons/DataFetching';
import { isPositiveNumber } from '@/utils/validators';

interface CommissionEditFormProps {
  commissionId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const CommissionEditForm: React.FC<CommissionEditFormProps> = ({
  commissionId,
  onSuccess,
  onCancel
}) => {
  const [commission, setCommission] = useState<any>(null);
  const [commissionAmount, setCommissionAmount] = useState<string>('');
  const [commissionRate, setCommissionRate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommission = async () => {
      try {
        const data = await getCommissionById(commissionId);
        console.log("Commission loaded:", data);
        setCommission(data);
        setCommissionAmount(data.commissionAmount.toString());
        setCommissionRate(data.commissionRate ? data.commissionRate.toString() : '10');
        setNotes(data.notes || '');
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar comissão:', error);
        setError('Erro ao carregar dados da comissão');
        setLoading(false);
      }
    };

    fetchCommission();
  }, [commissionId]);

  const validate = (): boolean => {
    if (!isPositiveNumber(commissionAmount)) {
      setError('O valor da comissão deve ser um número positivo');
      return false;
    }

    if (!isPositiveNumber(commissionRate) || parseFloat(commissionRate) > 100) {
      setError('A taxa de comissão deve ser um número positivo de até 100%');
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updateCommission(commissionId, {
        commissionAmount: parseFloat(commissionAmount),
        commissionRate: parseFloat(commissionRate),
        notes
      });

      setSuccess('Comissão atualizada com sucesso!');
      setSaving(false);

      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error) {
      console.error('Erro ao atualizar comissão:', error);
      setError('Erro ao atualizar comissão. Tente novamente.');
      setSaving(false);
    }
  };

  return (
    <DataFetchWrapper loading={loading} error={error}>
      <form onSubmit={handleSubmit} className="p-6">
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
            message={success}
            className="mb-4"
          />
        )}

        {commission && (
          <div className="mb-4">
            <p className="mb-2">
              <strong>Autor:</strong> {commission.author?.name}
            </p>
            <p className="mb-2">
              <strong>Total de Vendas:</strong> {formatCurrency(commission.totalSales || 0)}
            </p>
            <p className="mb-2">
              <strong>Quantidade de Vendas:</strong> {commission.sales?.length || 0}
            </p>
          </div>
        )}

        <Input
          id="commissionRate"
          label="Taxa de Comissão (%)"
          type="number"
          value={commissionRate}
          onChange={(e) => setCommissionRate(e.target.value)}
          required
          min="0"
          max="100"
          step="0.1"
          disabled={saving}
        />

        <Input
          id="commissionAmount"
          label="Valor da Comissão"
          type="number"
          value={commissionAmount}
          onChange={(e) => setCommissionAmount(e.target.value)}
          required
          min="0"
          step="0.01"
          disabled={saving}
        />

        <Input
          id="notes"
          label="Observações"
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={saving}
        />

        <div className="flex justify-end space-x-2 mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </DataFetchWrapper>
  );
};

export default CommissionEditForm;