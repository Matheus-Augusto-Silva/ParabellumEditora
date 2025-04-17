import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import csv from 'csv-parser';
import * as XLSX from 'xlsx';
import Client from '../models/Client';
import Sale from '../models/Sale';

const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const getClients = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const clients = await Client.find({}).sort({ name: 1 });
  res.json(clients);
});

export const getClientById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const client = await Client.findById(req.params.id);

  if (client) {
    res.json(client);
  } else {
    res.status(404);
    throw new Error('Cliente não encontrado');
  }
});

export const createClient = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, email, phone, address, city, state, postalCode, notes } = req.body;

  if (email) {
    const existingClient = await Client.findOne({ email });
    if (existingClient) {
      res.status(400);
      throw new Error('Já existe um cliente com este email');
    }
  }

  const client = await Client.create({
    name,
    email,
    phone,
    address,
    city,
    state,
    postalCode,
    notes
  });

  res.status(201).json(client);
});

export const updateClient = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, email, phone, address, city, state, postalCode, notes } = req.body;

  const client = await Client.findById(req.params.id);

  if (client) {
    if (email && email !== client.email) {
      const existingClient = await Client.findOne({ email });
      if (existingClient && existingClient._id.toString() !== req.params.id) {
        res.status(400);
        throw new Error('Este email já está sendo usado por outro cliente');
      }
    }

    client.name = name || client.name;
    client.email = email !== undefined ? email : client.email;
    client.phone = phone !== undefined ? phone : client.phone;
    client.address = address !== undefined ? address : client.address;
    client.city = city !== undefined ? city : client.city;
    client.state = state !== undefined ? state : client.state;
    client.postalCode = postalCode !== undefined ? postalCode : client.postalCode;
    client.notes = notes !== undefined ? notes : client.notes;

    const updatedClient = await client.save();
    res.json(updatedClient);
  } else {
    res.status(404);
    throw new Error('Cliente não encontrado');
  }
});

export const deleteClient = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const client = await Client.findById(req.params.id);

  if (client) {
    const sales = await Sale.find({ client: req.params.id });

    if (sales.length > 0) {
      res.status(400);
      throw new Error('Não é possível excluir um cliente que possui vendas associadas');
    }

    await client.remove();
    res.json({ message: 'Cliente removido com sucesso' });
  } else {
    res.status(404);
    throw new Error('Cliente não encontrado');
  }
});

export const importClients = asyncHandler(async (req: Request & { file?: Express.Multer.File }, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400);
    throw new Error('Por favor, envie um arquivo CSV ou XLSX.');
  }

  const results: any[] = [];
  const errors: string[] = [];
  const duplicateClientsMap: Map<string, number> = new Map();

  const isExcel = req.file.originalname.endsWith('.xlsx') || req.file.originalname.endsWith('.xls');

  if (isExcel) {
    try {
      const workbook = XLSX.read(req.file.buffer, {
        type: 'buffer',
        cellDates: true
      });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const data = XLSX.utils.sheet_to_json(worksheet);

      for (const row of data) {
        try {
          const normalizedData: { [key: string]: any } = {};
          Object.keys(row as object).forEach(key => {
            normalizedData[key.toLowerCase().trim()] = (row as Record<string, any>)[key];
          });

          const name = normalizedData['nome'] || 
                       normalizedData['cliente'] || 
                       normalizedData['billing first name'] || 
                       '';
          
          const lastName = normalizedData['sobrenome'] || 
                          normalizedData['billing last name'] || 
                          '';
          
          const fullName = name + (lastName ? ` ${lastName}` : '');
          
          const email = normalizedData['email'] || 
                        normalizedData['email para faturamento'] || 
                        normalizedData['email da conta do cliente'] || 
                        '';
          
          const phone = normalizedData['telefone'] || 
                        normalizedData['billing phone'] || 
                        '';
          
          const address = normalizedData['endereço'] || 
                          normalizedData['billing address 1'] || 
                          '';
          
          const city = normalizedData['cidade'] || 
                       normalizedData['billing city'] || 
                       '';
          
          const state = normalizedData['estado'] || 
                        normalizedData['billing state'] || 
                        '';
          
          const postalCode = normalizedData['cep'] || 
                            normalizedData['billing postcode'] || 
                            '';

          if (!fullName || fullName.trim() === '') {
            errors.push(`Dados inválidos: Nome do cliente não encontrado`);
            continue;
          }

          if (email) {
            const existingClient = await Client.findOne({ email });
            if (existingClient) {
              const clientKey = email;
              duplicateClientsMap.set(clientKey, (duplicateClientsMap.get(clientKey) || 0) + 1);
              continue;
            }
          }

          const client = new Client({
            name: fullName,
            email: email || undefined,
            phone: phone || undefined,
            address: address || undefined,
            city: city || undefined,
            state: state || undefined,
            postalCode: postalCode || undefined
          });

          await client.save();
          results.push(client);
        } catch (error) {
          errors.push(`Erro ao processar linha: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } catch (error) {
      res.status(500);
      throw new Error(`Erro ao importar clientes do Excel: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    const tmpDir = path.join(__dirname, '../../tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir);
    }

    const filePath = path.join(tmpDir, req.file.originalname);
    fs.writeFileSync(filePath, req.file.buffer);

    const processFile = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', async (data: any) => {
            try {
              const normalizedData: { [key: string]: string } = {};
              Object.keys(data).forEach(key => {
                const normalizedKey = key.trim().toLowerCase();
                normalizedData[normalizedKey] = data[key];
              });

              const name = normalizedData['nome'] || 
                          normalizedData['cliente'] || 
                          normalizedData['billing first name'] || 
                          '';
              
              const lastName = normalizedData['sobrenome'] || 
                              normalizedData['billing last name'] || 
                              '';
              
              const fullName = name + (lastName ? ` ${lastName}` : '');
              
              const email = normalizedData['email'] || 
                            normalizedData['email para faturamento'] || 
                            normalizedData['email da conta do cliente'] || 
                            '';
              
              const phone = normalizedData['telefone'] || 
                            normalizedData['billing phone'] || 
                            '';
              
              const address = normalizedData['endereço'] || 
                              normalizedData['billing address 1'] || 
                              '';
              
              const city = normalizedData['cidade'] || 
                          normalizedData['billing city'] || 
                          '';
              
              const state = normalizedData['estado'] || 
                            normalizedData['billing state'] || 
                            '';
              
              const postalCode = normalizedData['cep'] || 
                                normalizedData['billing postcode'] || 
                                '';

              if (!fullName || fullName.trim() === '') {
                errors.push(`Dados inválidos: Nome do cliente não encontrado`);
                return;
              }

              if (email) {
                const existingClient = await Client.findOne({ email });
                if (existingClient) {
                  const clientKey = email;
                  duplicateClientsMap.set(clientKey, (duplicateClientsMap.get(clientKey) || 0) + 1);
                  return;
                }
              }

              const client = new Client({
                name: fullName,
                email: email || undefined,
                phone: phone || undefined,
                address: address || undefined,
                city: city || undefined,
                state: state || undefined,
                postalCode: postalCode || undefined
              });

              await client.save();
              results.push(client);
            } catch (error) {
              errors.push(`Erro ao processar linha: ${error instanceof Error ? error.message : String(error)}`);
            }
          })
          .on('end', () => {
            fs.unlinkSync(filePath);
            resolve();
          })
          .on('error', (error) => {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
            reject(error);
          });
      });
    };

    try {
      await processFile();
    } catch (error) {
      res.status(500);
      throw new Error(`Erro ao importar clientes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const duplicateClients = Array.from(duplicateClientsMap.entries()).map(
    ([client, count]) => count > 1 ? `${client} (${count} ocorrências)` : client
  );

  res.status(201).json({
    message: `${results.length} clientes importados com sucesso${errors.length > 0 || duplicateClients.length > 0 ? ' (com alguns problemas)' : ''}`,
    clientsCreated: results,
    errors: errors.length > 0 ? errors : undefined,
    duplicateClients: duplicateClients.length > 0 ? duplicateClients : undefined
  });
});

export const importClientsFromSales = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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

    const clientsCreated: any[] = [];
    const duplicateClientEmails: string[] = [];

    const clientsByEmail: { [key: string]: any } = {};
    const clientsWithoutEmail: any[] = [];

    for (const sale of sales) {
      const clientData: any = {
        name: sale.customerName || 'Cliente sem nome',
        email: sale.customerEmail,
        phone: sale.customerPhone,
        address: sale.customerAddress,
        city: sale.customerCity,
        state: sale.customerState,
        postalCode: sale.customerPostalCode
      };

      if (clientData.email) {
        if (!clientsByEmail[clientData.email]) {
          clientsByEmail[clientData.email] = clientData;
        }
      } else if (clientData.name && clientData.name !== 'Cliente sem nome') {
        clientsWithoutEmail.push(clientData);
      }
    }

    for (const email in clientsByEmail) {
      const clientData = clientsByEmail[email];
      
      const existingClient = await Client.findOne({ email });
      
      if (existingClient) {
        duplicateClientEmails.push(email);
        continue;
      }

      const client = new Client(clientData);
      await client.save();
      clientsCreated.push(client);
    }

    for (const clientData of clientsWithoutEmail) {
      const existingClientsWithSameName = await Client.find({ 
        name: clientData.name,
        email: { $exists: false }
      });

      if (existingClientsWithSameName.length > 0) {
        continue;
      }

      const client = new Client(clientData);
      await client.save();
      clientsCreated.push(client);
    }

    res.status(201).json({
      message: `${clientsCreated.length} clientes importados com sucesso`,
      clientsCreated,
      duplicateClients: duplicateClientEmails.length > 0 ? duplicateClientEmails : undefined
    });
  } catch (error) {
    console.error('Erro ao importar clientes das vendas:', error);
    res.status(500);
    throw new Error(`Erro ao importar clientes das vendas: ${error instanceof Error ? error.message : String(error)}`);
  }
});
