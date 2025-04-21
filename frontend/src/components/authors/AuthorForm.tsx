import React, { useState, useEffect } from 'react';
import Input from '@/components/commons/Input';
import Button from '@/components/commons/Button';
import { IAuthor } from '@/types';
import { createAuthor, updateAuthor } from '@/services/authorService';
import InputMask from 'react-input-mask';

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
      setCommissionRate(author.commissionRate?.toString() || '10');
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
      console.error('Erro ao salvar organizador:', error);
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
        placeholder="Digite o nome do organizador"
        error={errors.name}
        required
      />

      <Input
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Digite o email do organizador (opcional)"
        error={errors.email}
      />

      <div className="mb-4">
        <label htmlFor="commissionRate" className="block text-sm font-medium text-gray-700 mb-1">
          Taxa de Comissão (%) <span className="text-red-500">*</span>
        </label>
        <InputMask
          value={commissionRate}
          onChange={(e) => setCommissionRate(e.target.value.replace(/[^\d.]/g, ''))}
        >
          {(inputProps: any) => (
            <input
              {...inputProps}
              id="commissionRate"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.commissionRate ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="Digite a taxa de comissão"
              required
            />
          )}
        </InputMask>
        {errors.commissionRate && <p className="mt-1 text-sm text-red-600">{errors.commissionRate}</p>}
      </div>

      <div className="mb-4">
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
          Biografia
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Digite a biografia do organizador (opcional)"
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