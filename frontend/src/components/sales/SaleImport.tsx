import React, { useState } from 'react';
import Button from '@/components/commons/Button';
import { importSales } from '@/services/saleService';
import { toast } from 'react-toastify';
import Alert from '@/components/commons/Alert';
import BookForm from '@/components/books/BookForm';
import Modal from '@/components/commons/Modal';

const SaleImport: React.FC<{
  onCancel: () => void;
  onSuccess: () => void;
}> = ({ onCancel, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<'parceira' | 'editora'>('editora');
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    notFoundBooks?: string[];
    duplicateSales?: string[];
    errors?: string[];
  } | null>(null);
  const [showBookForm, setShowBookForm] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['csv', 'xlsx', 'xls'];

    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      toast.error('Formato de arquivo inválido. Por favor, envie um arquivo CSV ou Excel (XLSX/XLS).');
      return;
    }

    setLoading(true);
    setImportResult(null);

    try {
      const result = await importSales(file, source);
      setImportResult({
        success: true,
        message: result.message,
        notFoundBooks: result.notFoundBooks,
        duplicateSales: result.duplicateSales,
        errors: result.errors
      });

      if (!result.notFoundBooks && !result.duplicateSales && !result.errors) {
        toast.success(result.message);
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao importar vendas:', error);
      setImportResult({
        success: false,
        message: 'Erro ao importar vendas. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (importResult?.success &&
      (!importResult.notFoundBooks || importResult.notFoundBooks.length === 0) &&
      (!importResult.duplicateSales || importResult.duplicateSales.length === 0) &&
      (!importResult.errors || importResult.errors.length === 0)) {
      onSuccess();
    } else {
      onCancel();
    }
  };

  const extractUniqueISBNs = () => {
    if (!importResult?.notFoundBooks) return [];

    const isbnPattern = /ISBN: ([0-9]{13})/;
    const isbns = new Set();

    importResult.notFoundBooks.forEach(book => {
      const match = book.match(isbnPattern);
      if (match && match[1]) {
        isbns.add(match[1]);
      }
    });

    return Array.from(isbns);
  };

  const countUniqueBooks = () => {
    if (!importResult?.notFoundBooks) return 0;
    return new Set(importResult.notFoundBooks.map(book => {
      const titlePart = book.split(" (ISBN:")[0];
      return titlePart;
    })).size;
  };

  return (
    <div>
      {importResult ? (
        <div>
          <Alert
            type={importResult.success ? "success" : "error"}
            message={importResult.message}
            className="mb-4"
          />

          {importResult.notFoundBooks && importResult.notFoundBooks.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Livros não encontrados ({countUniqueBooks()} livros únicos):
              </h3>
              <div className="bg-yellow-50 p-3 rounded border border-yellow-200 max-h-48 overflow-y-auto">
                <ul className="list-disc pl-5 text-xs text-gray-600">
                  {importResult.notFoundBooks.map((book, index) => (
                    <li key={index}>{book}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-2 flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  Estes livros não puderam ser importados porque não foram encontrados no sistema.
                </p>
                <div className="flex space-x-2">
                  <button
                    className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 border border-indigo-300 rounded"
                    onClick={() => {
                      const isbns = extractUniqueISBNs();
                      navigator.clipboard.writeText(isbns.join('\n'));
                      toast.success('ISBNs copiados para a área de transferência!');
                    }}
                  >
                    Copiar ISBNs
                  </button>
                  <button
                    className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded"
                    onClick={() => setShowBookForm(true)}
                  >
                    Cadastrar Livros
                  </button>
                </div>
              </div>
            </div>
          )}

          {importResult.duplicateSales && importResult.duplicateSales.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Vendas já cadastradas ({importResult.duplicateSales.length}):
              </h3>
              <div className="bg-blue-50 p-3 rounded border border-blue-200 max-h-40 overflow-y-auto">
                <ul className="list-disc pl-5 text-xs text-gray-600">
                  {importResult.duplicateSales.map((sale, index) => (
                    <li key={index}>{sale}</li>
                  ))}
                </ul>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Estas vendas foram ignoradas porque já estão cadastradas no sistema.
              </p>
            </div>
          )}

          {importResult.errors && importResult.errors.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Erros durante a importação ({importResult.errors.length}):
              </h3>
              <div className="bg-red-50 p-3 rounded border border-red-200 max-h-40 overflow-y-auto">
                <ul className="list-disc pl-5 text-xs text-gray-600">
                  {importResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Ocorreram erros durante o processamento destas linhas.
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="primary" onClick={handleClose}>
              Fechar
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Origem das Vendas
            </label>
            <div className="flex space-x-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="editora"
                  name="source"
                  value="editora"
                  checked={source === 'editora'}
                  onChange={() => setSource('editora')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="editora" className="ml-2 block text-sm text-gray-700">
                  Vendas da Editora
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="parceira"
                  name="source"
                  value="parceira"
                  checked={source === 'parceira'}
                  onChange={() => setSource('parceira')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="parceira" className="ml-2 block text-sm text-gray-700">
                  Parceiros (Amazon, Mercado Livre, etc.)
                </label>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arquivo de Importação (CSV ou Excel)
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100"
              required
            />
            <p className="mt-2 text-xs text-gray-500">
              Formatos suportados: CSV, Excel (XLSX, XLS)
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={!file || loading}
              className="flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Importando...
                </>
              ) : (
                'Importar'
              )}
            </Button>
          </div>
        </form>
      )}

      <Modal
        isOpen={showBookForm}
        onClose={() => setShowBookForm(false)}
        title="Cadastrar Novo Livro"
      >
        {showBookForm && (
          <BookForm
            book={null}
            onCancel={() => setShowBookForm(false)}
            onSave={() => {
              setShowBookForm(false);
              toast.success('Livro cadastrado com sucesso! Agora você pode importar a planilha novamente.');
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default SaleImport;