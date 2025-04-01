import React, { useState, useEffect } from 'react';
import Input from '@/components/commons/Input';
import Button from '@/components/commons/Button';
import { IAuthor } from '@/types';
import { createAuthor, updateAuthor } from '@/services/authorService';

interface AuthorFormProps {
  author: IAuthor | null;
  onCancel: () => void;
  onSave: () => void;
}

const AuthorForm: React.FC<AuthorFormProps> = ({ author, onCancel, onSave }) => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [commissionRate, setCommissionRate] = useState<string>('10');
  const [bio, setBio] = useState<string>('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (author) {
      setName(author.name);
      setEmail(author.email || '');
      setCommissionRate(author.commissionRate.toString());
      setBio(author.bio || '');
    }
  }, [author]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'O nome é obrigatório';
    }

    if (email && !isValidEmail(email)) {
      newErrors.email = 'Email inválido';
    }

    if (!commissionRate.trim()) {
      newErrors.commissionRate = 'A taxa de comissão é obrigatória';
    } else if (isNaN(Number(commissionRate)) || Number(commissionRate) < 0 || Number(commissionRate) > 100) {
      newErrors.commissionRate = 'A taxa de comissão deve ser um número entre 0 e 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const authorData = {
        name,
        email: email || undefined,
        commissionRate: Number(commissionRate),
        bio: bio || undefined
      };

      if (author) {
        await updateAuthor(author._id, authorData);
      } else {
        await createAuthor(authorData);
      }

      setLoading(false);
      onSave();
    } catch (error) {
      console.error('Erro ao salvar autor:', error);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        id="name"
        label="Nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Digite o nome do autor"
        error={errors.name}
        required
      />

      <Input
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Digite o email do autor (opcional)"
        error={errors.email}
      />

      <Input
        id="commissionRate"
        label="Taxa de Comissão (%)"
        type="number"
        step="0.1"
        min="0"
        max="100"
        value={commissionRate}
        onChange={(e) => setCommissionRate(e.target.value)}
        placeholder="Digite a taxa de comissão"
        error={errors.commissionRate}
        required
      />

      <div className="mb-4">
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
          Biografia
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Digite a biografia do autor (opcional)"
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
          rows={4}
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
          type="submit"
          variant="primary"
          disabled={loading}
        >
          {loading ? 'Salvando...' : author ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
};

export default AuthorForm;