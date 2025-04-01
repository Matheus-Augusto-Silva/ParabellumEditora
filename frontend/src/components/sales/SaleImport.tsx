import React, { useState, useRef } from 'react';
import Button from '@/components/commons/Button';
import { importSales } from '@/services/saleService';

interface SaleImportProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const SaleImport: React.FC<SaleImportProps> = ({ onCancel, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState<'parceira' | 'editora'>('editora');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];

      if (!selectedFile.name.endsWith('.csv') &&
        !selectedFile.name.endsWith('.xlsx') &&
        !selectedFile.name.endsWith('.xls')) {
        setError('Por favor, selecione um arquivo CSV ou Excel.');
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Por favor, selecione um arquivo para importar.');
      return;
    }

    try {
      setLoading(true);
      await importSales(file, source);
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao importar vendas:', error);
      setError('Falha ao importar as vendas. Por favor, verifique o formato do arquivo e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para manipular o clique no botão de selecionar arquivo
  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
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

      <div className="space-y-4">
        <div>
          <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
            Origem das Vendas <span className="text-red-500">*</span>
          </label>
          <select
            id="source"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={source}
            onChange={(e) => setSource(e.target.value as 'parceira' | 'editora')}
            required
          >
            <option value="editora">Site/Editora (90% editora, 10% autor)</option>
            <option value="parceira">Parceira (30% editora, 70% parceira)</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Todas as vendas neste arquivo serão importadas com a mesma origem.
          </p>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
            ref={fileInputRef}
          />

          <div className="space-y-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>

            <div className="text-sm text-gray-600">
              <button
                type="button"
                className="text-indigo-600 hover:text-indigo-500 font-medium"
                onClick={handleBrowseClick}
              >
                Clique para selecionar
              </button>
              {' ou arraste e solte'}
            </div>

            <p className="text-xs text-gray-500">
              Arquivos CSV ou Excel (até 10MB)
            </p>
          </div>

          {file && (
            <div className="mt-4 flex items-center justify-center text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-600 font-medium">{file.name}</span>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                O arquivo CSV deve conter as colunas: <span className="font-mono">book_id, platform, quantity, sale_price, sale_date</span>
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={!file || loading}
          >
            {loading ? 'Importando...' : 'Importar Vendas'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default SaleImport;