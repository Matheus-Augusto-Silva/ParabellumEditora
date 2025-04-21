import React, { useState, useEffect } from 'react';
import Input from '@/components/commons/Input';
import Button from '@/components/commons/Button';
import { ICustomer } from '@/types';
import { createCustomer, updateCustomer } from '@/services/customerService';
import InputMask from 'react-input-mask';

interface CustomerFormProps {
  customer: ICustomer | null;
  onCancel: () => void;
  onSave: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onCancel, onSave }) => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setEmail(customer.email || '');
      setPhone(customer.phone || '');
    }
  }, [customer]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'O nome é obrigatório';
    }

    if (email && !isValidEmail(email)) {
      newErrors.email = 'Email inválido';
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
      const customerData = {
        name,
        email: email || undefined,
        phone: phone || undefined
      };

      if (customer) {
        await updateCustomer(customer._id, customerData);
      } else {
        await createCustomer(customerData);
      }

      setLoading(false);
      onSave();
    } catch (error) {
      console.error('Erro ao salvar customere:', error);
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
        placeholder="Digite o nome do customere"
        error={errors.name}
        required
      />

      <Input
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Digite o email do customere (opcional)"
        error={errors.email}
      />

      <div className="mb-4">
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Telefone
        </label>
        <InputMask
          mask="(99) 99999-9999"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        >
          {(inputProps: any) => (
            <input
              {...inputProps}
              id="phone"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#3F90C2] border-gray-300"
              placeholder="(00) 00000-0000 (opcional)"
            />
          )}
        </InputMask>
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
          {loading ? 'Salvando...' : customer ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
};

export default CustomerForm;