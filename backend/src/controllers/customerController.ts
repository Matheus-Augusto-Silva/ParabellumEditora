import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Customer from '../models/Customer';
import Sale from '../models/Sale';

export const getCustomers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const customers = await Customer.find({}).sort({ name: 1 });
  res.json(customers);
});

export const getCustomerById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const customer = await Customer.findById(req.params.id);

  if (customer) {
    res.json(customer);
  } else {
    res.status(404);
    throw new Error('Cliente não encontrado');
  }
});

export const createCustomer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, email, phone } = req.body;

  if (email) {
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      res.status(400);
      throw new Error('Já existe um cliente com este email');
    }
  }

  const customer = await Customer.create({
    name,
    email,
    phone
  });

  res.status(201).json(customer);
});

export const updateCustomer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, email, phone } = req.body;

  const customer = await Customer.findById(req.params.id);

  if (customer) {
    if (email && email !== customer.email) {
      const existingCustomer = await Customer.findOne({ email });
      if (existingCustomer && existingCustomer._id.toString() !== req.params.id) {
        res.status(400);
        throw new Error('Este email já está sendo usado por outro cliente');
      }
    }

    customer.name = name || customer.name;
    customer.email = email !== undefined ? email : customer.email;
    customer.phone = phone !== undefined ? phone : customer.phone;

    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
  } else {
    res.status(404);
    throw new Error('Cliente não encontrado');
  }
});

export const deleteCustomer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const customer = await Customer.findById(req.params.id);

  if (customer) {
    const sales = await Sale.find({ customer: req.params.id });

    if (sales.length > 0) {
      res.status(400);
      throw new Error('Não é possível excluir um cliente que possui vendas associadas');
    }

    await customer.remove();
    res.json({ message: 'Cliente removido com sucesso' });
  } else {
    res.status(404);
    throw new Error('Cliente não encontrado');
  }
});

export const importCustomersFromSales = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const sales = await Sale.find({
      $or: [
        { 'customerName': { $exists: true, $ne: '' } },
        { 'customerEmail': { $exists: true, $ne: '' } }
      ]
    });

    if (sales.length === 0) {
      res.status(404);
      throw new Error('Não foram encontradas vendas com informações de clientes');
    }

    const customersCreated: any[] = [];
    const duplicateCustomerEmails: string[] = [];

    const customersByEmail: { [key: string]: any } = {};
    const customersWithoutEmail: any[] = [];

    for (const sale of sales) {
      const customerData: any = {
        name: sale.customerName || 'Cliente sem nome',
        email: sale.customerEmail,
        phone: sale.customerPhone
      };

      if (customerData.email) {
        if (!customersByEmail[customerData.email]) {
          customersByEmail[customerData.email] = customerData;
        }
      } else if (customerData.name && customerData.name !== 'Cliente sem nome') {
        customersWithoutEmail.push(customerData);
      }
    }

    for (const email in customersByEmail) {
      const customerData = customersByEmail[email];

      const existingCustomer = await Customer.findOne({ email });

      if (existingCustomer) {
        duplicateCustomerEmails.push(email);
        continue;
      }

      const customer = new Customer(customerData);
      await customer.save();
      customersCreated.push(customer);
    }

    for (const customerData of customersWithoutEmail) {
      const existingCustomersWithSameName = await Customer.find({
        name: customerData.name,
        email: { $exists: false }
      });

      if (existingCustomersWithSameName.length > 0) {
        continue;
      }

      const customer = new Customer(customerData);
      await customer.save();
      customersCreated.push(customer);
    }

    res.status(201).json({
      message: `${customersCreated.length} clientes importados com sucesso`,
      customersCreated,
      duplicateCustomers: duplicateCustomerEmails.length > 0 ? duplicateCustomerEmails : undefined
    });
  } catch (error) {
    console.error('Erro ao importar clientes das vendas:', error);
    res.status(500);
    throw new Error(`Erro ao importar clientes das vendas: ${error instanceof Error ? error.message : String(error)}`);
  }
});