import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Sale from '../models/Sale';
import Book from '../models/Book';
import Customer from '../models/Customer';
import Commission from '../models/Commission';
import csv from 'csv-parser';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';


const mapPlatform = (platformInput: string): string => {
  const platform = platformInput.trim().toUpperCase();

  const platformMap: { [key: string]: string } = {
    'AMAZON': 'Amazon',
    'AMAZON 2': 'Amazon',
    'MERCADO LIVRE': 'Mercado Livre',
    'ESTANTE VIRTUAL': 'Estante Virtual',
    'UMLIVRO': 'umLivro',
    'LOJA UMLIVRO': 'umLivro',
    'CARREFOUR': 'Carrefour',
    'AMERICANAS': 'Americanas',
    'SITE DA EDITORA': 'Site da Editora',
    'LIVRARIAS': 'Outra plataforma'
  };

  return platformMap[platform] || 'Outra plataforma';
};

const parseDate = (dateStr: any): Date => {
  if (dateStr instanceof Date) {
    return new Date(dateStr);
  }

  if (!dateStr || typeof dateStr !== 'string') {
    return new Date();
  }

  let date;

  if (dateStr.includes('/') && dateStr.includes(':')) {
    const parts = dateStr.split(' ');
    const datePart = parts[0].split('/');

    if (datePart.length === 3) {
      const day = parseInt(datePart[0], 10);
      const month = parseInt(datePart[1], 10) - 1;
      const year = parseInt(datePart[2], 10);

      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        if (parts.length > 1) {
          const timePart = parts[1].split(':');
          if (timePart.length >= 2) {
            const hour = parseInt(timePart[0], 10);
            const minute = parseInt(timePart[1], 10);
            const second = timePart.length > 2 ? parseInt(timePart[2], 10) : 0;

            if (!isNaN(hour) && !isNaN(minute) && !isNaN(second)) {
              date = new Date(year, month, day, hour, minute, second);
            }
          }
        } else {
          date = new Date(year, month, day);
        }
      }
    }
  }
  else if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);

      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        date = new Date(year, month, day);
      }
    }
  }

  if (!date || isNaN(date.getTime())) {
    date = new Date(dateStr);
  }

  if (isNaN(date.getTime())) {
    return new Date();
  }

  return date;
};

export const getSales = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const sales = await Sale.find({})
    .populate({
      path: 'book',
      populate: {
        path: 'author',
        select: 'name commissionRate'
      }
    })
    .populate('commission')
    .sort({ saleDate: -1 });

  res.json(sales);
});

export const getSaleById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const sale = await Sale.findById(req.params.id)
    .populate({
      path: 'book',
      populate: {
        path: 'author',
        select: 'name commissionRate'
      }
    })
    .populate('commission');

  if (sale) {
    res.json(sale);
  } else {
    res.status(404);
    throw new Error('Venda não encontrada');
  }
});

export const createSale = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { book, platform, saleDate, quantity, salePrice } = req.body;

  const bookExists = await Book.findById(book);
  if (!bookExists) {
    res.status(400);
    throw new Error('Livro não encontrado');
  }

  const sale = await Sale.create({
    book,
    platform,
    saleDate,
    quantity,
    salePrice,
    isProcessed: false
  });

  const populatedSale = await Sale.findById(sale._id)
    .populate({
      path: 'book',
      populate: {
        path: 'author',
        select: 'name commissionRate'
      }
    });

  res.status(201).json(populatedSale);
});

export const updateSale = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const sale = await Sale.findById(req.params.id).populate('commission');

  if (!sale) {
    res.status(404);
    throw new Error('Venda não encontrada');
  }

  if (sale.commission && typeof sale.commission === 'object' && sale.commission.isPaid) {
    res.status(400);
    throw new Error('Não é possível editar uma venda cuja comissão já foi paga');
  }

  const {
    book,
    platform,
    saleDate,
    quantity,
    salePrice,
    orderNumber,
    customerName,
    customerEmail,
    customerPhone,
    source,
    status,
    paymentStatus
  } = req.body;

  if (sale.commission && typeof sale.commission === 'object' && !sale.commission.isPaid) {
    const commissionId = typeof sale.commission === 'object' ? sale.commission._id : sale.commission;

    await Commission.findByIdAndUpdate(
      commissionId,
      { $pull: { sales: sale._id } }
    );

    sale.commission = undefined;
    sale.isProcessed = false;
  }

  if (book) sale.book = book;
  if (platform) sale.platform = platform;
  if (saleDate) sale.saleDate = saleDate;
  if (quantity) sale.quantity = quantity;
  if (salePrice) sale.salePrice = salePrice;
  if (orderNumber !== undefined) sale.orderNumber = orderNumber;
  if (customerName !== undefined) sale.customerName = customerName;
  if (customerEmail !== undefined) sale.customerEmail = customerEmail;
  if (customerPhone !== undefined) sale.customerPhone = customerPhone;
  if (source) sale.source = source;
  if (status) sale.status = status;
  if (paymentStatus) sale.paymentStatus = paymentStatus;

  const updatedSale = await sale.save();

  await updatedSale.populate([
    {
      path: 'book',
      populate: {
        path: 'author',
        select: 'name'
      }
    },
    {
      path: 'customer',
      select: 'name email phone'
    }
  ]);

  res.json(updatedSale);
});

export const getSalesStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {

  const totalSalesData = await Sale.aggregate([
    {
      $group: {
        _id: null,
        totalSales: { $sum: { $multiply: ["$salePrice", "$quantity"] } },
        totalQuantity: { $sum: "$quantity" }
      }
    }
  ]);

  const totalSales = totalSalesData.length > 0 ? totalSalesData[0].totalSales : 0;
  const totalQuantity = totalSalesData.length > 0 ? totalSalesData[0].totalQuantity : 0;

  const salesByPlatform = await Sale.aggregate([
    {
      $group: {
        _id: "$platform",
        quantity: { $sum: "$quantity" },
        total: { $sum: { $multiply: ["$salePrice", "$quantity"] } }
      }
    },
    {
      $project: {
        _id: 0,
        platform: "$_id",
        quantity: 1,
        total: 1
      }
    }
  ]);

  const salesByPlatformFormatted: {
    [key: string]: {
      quantity: number;
      total: number;
    }
  } = {};

  salesByPlatform.forEach(item => {
    salesByPlatformFormatted[item.platform] = {
      quantity: item.quantity,
      total: item.total
    };
  });

  const salesByBook = await Sale.aggregate([
    {
      $group: {
        _id: "$book",
        quantity: { $sum: "$quantity" },
        total: { $sum: { $multiply: ["$salePrice", "$quantity"] } }
      }
    },
    {
      $sort: { total: -1 }
    },
    {
      $lookup: {
        from: 'books',
        localField: '_id',
        foreignField: '_id',
        as: 'bookDetails'
      }
    },
    {
      $unwind: '$bookDetails'
    },
    {
      $project: {
        _id: 0,
        id: "$_id",
        title: "$bookDetails.title",
        quantity: 1,
        total: 1
      }
    }
  ]);

  const salesByMonth = await Sale.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$saleDate" },
          month: { $month: "$saleDate" }
        },
        quantity: { $sum: "$quantity" },
        total: { $sum: { $multiply: ["$salePrice", "$quantity"] } }
      }
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1
      }
    },
    {
      $project: {
        _id: 0,
        month: {
          $concat: [
            { $toString: "$_id.year" },
            "-",
            {
              $cond: {
                if: { $lt: ["$_id.month", 10] },
                then: { $concat: ["0", { $toString: "$_id.month" }] },
                else: { $toString: "$_id.month" }
              }
            }
          ]
        },
        quantity: 1,
        total: 1
      }
    }
  ]);

  const stats: ISaleStats = {
    totalSales,
    totalQuantity,
    salesByPlatform: salesByPlatformFormatted,
    salesByBook,
    salesByMonth
  };

  res.json(stats);
});

export const importSales = asyncHandler(async (req: Request & { file?: Express.Multer.File }, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400);
    throw new Error('Por favor, envie um arquivo XLSX.');
  }

  const results: any[] = [];
  const customersCreated: any[] = [];
  const errors: string[] = [];
  const notFoundBooksMap: Map<string, number> = new Map();
  const duplicateSalesMap: Map<string, number> = new Map();
  const canceledSalesMap: Map<string, number> = new Map();

  const source = req.body.source
  const importCustomers = req.body.importCustomers !== 'false';
  const allowZeroPrices = req.body.allowZeroPrices === 'true';
  const autoDetectSource = req.body.autoDetectSource === 'true';

  const isExcel = req.file.originalname.endsWith('.xlsx') || req.file.originalname.endsWith('.xls');

  const normalizePrice = (priceValue: any): number => {
    if (priceValue === undefined || priceValue === null || priceValue === '') {
      return 0;
    }

    if (typeof priceValue === 'number') {
      return priceValue;
    }

    let priceStr = String(priceValue);
    priceStr = priceStr.replace(/[R$€$£\s]/g, '');
    priceStr = priceStr.replace(',', '.');

    const price = parseFloat(priceStr);
    return isNaN(price) ? 0 : price;
  };

  try {
    let data: any[] = [];

    if (isExcel) {
      const workbook = XLSX.read(req.file.buffer, {
        type: 'buffer',
        cellDates: true,
        dateNF: 'yyyy-mm-dd',
        cellNF: true,
        raw: false
      });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet);
    } else {
      const csvString = req.file.buffer.toString('utf8');
      const results = await new Promise<any[]>((resolve) => {
        const rows: any[] = [];
        csv({ headers: true })
          .on('data', (row) => rows.push(row))
          .on('end', () => resolve(rows))
          .write(csvString);
      });

      data = results;
    }

    const detectSourceFromData = (data: any[]): string => {
      if (!data || data.length === 0) return 'editora';
      const firstRow = data[0];
      const keys = Object.keys(firstRow).map(k => k.toLowerCase().trim());

      const editoraIndicators = [
        'data do pedido',
        'número do pedido',
        'status do pedido',
        'nome do item',
        'quantidade',
        'custo do item',
        'valor total do pedido',
        'primeiro nome (cobrança)',
        'sobrenome (cobrança)',
        'e-mail (cobrança)',
        'telefone (cobrança)'
      ];

      const parceiraIndicators = [
        'canal',
        'pedido',
        'pedido canal',
        'título',
        'sku',
        'quantidade',
        'valor total capa',
        'data venda',
        'status do item'
      ];

      let editoraCount = 0;
      let parceiraCount = 0;

      for (const key of keys) {
        if (editoraIndicators.some(indicator => key.includes(indicator))) {
          editoraCount++;
        }
        if (parceiraIndicators.some(indicator => key.includes(indicator))) {
          parceiraCount++;
        }
      }

      if (editoraCount > parceiraCount) {
        return 'editora';
      }

      if (parceiraCount > editoraCount) {
        return 'parceira';
      }

      return 'editora';
    }

    const detectedSource = autoDetectSource ? detectSourceFromData(data) : source;

    for (const row of data) {
      try {
        const normalizedData: { [key: string]: any } = {};
        Object.keys(row as object).forEach(key => {
          normalizedData[key.toLowerCase().trim()] = (row as Record<string, any>)[key];
        });

        let bookTitle = '';
        let quantity = 0;
        let salePrice = 0;
        let orderNumber = '';
        let saleDateStr = '';
        let platform = '';
        let status = 'completed';

        let customerName = '';
        let customerEmail = '';
        let customerPhone = '';

        if (detectedSource === 'editora') {
          orderNumber = normalizedData['número do pedido'] || '';
          saleDateStr = normalizedData['data do pedido'] || '';

          const statusValue = normalizedData['status do pedido'] || '';
          status = /(cancelado|devolvido)/i.test(statusValue) ? 'canceled' : 'completed';

          bookTitle = normalizedData['nome do item'] || '';
          quantity = parseInt(normalizedData['quantidade'] || '1', 10);
          salePrice = normalizePrice(normalizedData['custo do item'] || 0);

          const firstName = normalizedData['primeiro nome (cobrança)'] || '';
          const lastName = normalizedData['sobrenome (cobrança)'] || '';
          customerName = `${firstName} ${lastName}`.trim();

          customerEmail = normalizedData['e-mail (cobrança)'] || '';
          customerPhone = normalizedData['telefone (cobrança)'] || '';

          platform = 'Site da Editora';
        } else {
          bookTitle =
            normalizedData['título'] ||
            normalizedData['nome do produto'] ||
            normalizedData['livro'] ||
            normalizedData['produto'] ||
            normalizedData['título do produto'] ||
            normalizedData['nome'] ||
            normalizedData['descrição'] ||
            '';

          quantity = parseInt(
            normalizedData['quantidade'] ||
            normalizedData['qtd'] ||
            normalizedData['qtde'] ||
            normalizedData['quantidade vendida'] ||
            '1', 10);

          salePrice = normalizePrice(
            normalizedData['valor unitário'] ||
            normalizedData['preço'] ||
            normalizedData['valor'] ||
            normalizedData['preço unitário'] ||
            normalizedData['preço de venda'] ||
            normalizedData['valor unitário cliente'] ||
            normalizedData['preço final'] ||
            normalizedData['valor total capa'] || 0
          );

          if (salePrice > 0 && quantity > 1 && normalizedData['valor total capa']) {
            const totalValue = normalizePrice(normalizedData['valor total capa']);
            if (totalValue > 0) {
              salePrice = totalValue / quantity;
            }
          }

          platform =
            normalizedData['canal'] ||
            normalizedData['plataforma'] ||
            normalizedData['marketplace'] ||
            normalizedData['loja'] ||
            'Outra plataforma';

          orderNumber =
            normalizedData['pedido'] ||
            normalizedData['id do pedido'] ||
            normalizedData['número do pedido'] ||
            normalizedData['nro pedido'] ||
            normalizedData['código'] ||
            normalizedData['pedido canal'] ||
            '';

          saleDateStr =
            normalizedData['data'] ||
            normalizedData['data venda'] ||
            normalizedData['data da venda'] ||
            normalizedData['data pedido'] ||
            '';

          const statusValue =
            normalizedData['status'] ||
            normalizedData['situação'] ||
            normalizedData['status do item'] ||
            '';

          status = /(cancelado|cancelled|canceled|devolvido|returned|item cancelado)/i.test(statusValue) ? 'canceled' : 'completed';

          customerName =
            normalizedData['cliente'] ||
            normalizedData['nome do cliente'] ||
            normalizedData['comprador'] ||
            '';

          customerEmail =
            normalizedData['email'] ||
            normalizedData['email do cliente'] ||
            normalizedData['e-mail'] ||
            '';

          customerPhone =
            normalizedData['telefone'] ||
            normalizedData['telefone do cliente'] ||
            normalizedData['contato'] ||
            normalizedData['celular'] ||
            '';
        }

        if (!bookTitle) {
          errors.push(`Linha ignorada: Título do livro não encontrado`);
          continue;
        }

        if (isNaN(quantity) || quantity <= 0) {
          quantity = 1;
        }

        const saleDate = parseDate(saleDateStr);

        platform = mapPlatform(platform);

        if (orderNumber) {
          const existingSale = await Sale.findOne({ orderNumber });
          if (existingSale) {
            const saleKey = `${bookTitle} - Pedido: ${orderNumber}`;
            duplicateSalesMap.set(saleKey, (duplicateSalesMap.get(saleKey) || 0) + 1);
            continue;
          }
        }

        if (status === 'canceled') {
          canceledSalesMap.set(bookTitle, (canceledSalesMap.get(bookTitle) || 0) + 1);
        }

        const isbn = normalizedData['sku'] || normalizedData['isbn'] || normalizedData['código'] || '';

        let book;
        if (isbn) {
          book = await Book.findOne({ isbn });
        }

        if (!book) {
          book = await Book.findOne({
            title: { $regex: new RegExp(bookTitle.toString(), 'i') }
          });

          if (!book) {
            const titleWords = bookTitle.split(' ').filter(word => word.length > 4);

            if (titleWords.length > 0) {
              const regexPatterns = titleWords.map(word =>
                new RegExp(word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i')
              );

              book = await Book.findOne({
                title: { $in: regexPatterns }
              });
            }
          }
        }

        if (!book) {
          const bookKey = `${bookTitle}${isbn ? ` (ISBN: ${isbn})` : ''}`;
          notFoundBooksMap.set(bookKey, (notFoundBooksMap.get(bookKey) || 0) + 1);
          continue;
        }

        if (isNaN(salePrice) || salePrice <= 0) {
          if (book && book.price > 0) {
            salePrice = book.price;
          } else if (!allowZeroPrices) {
            errors.push(`Linha ignorada: Preço inválido para o livro "${bookTitle}"`);
            continue;
          }
        }

        await book.populate('author');
        const authorId = book.author._id;

        let customerId = undefined;
        if (importCustomers && (customerEmail || (customerName && customerPhone))) {
          let customer;

          if (customerEmail) {
            customer = await Customer.findOne({ email: customerEmail });
          } else if (customerName && customerPhone) {
            customer = await Customer.findOne({
              name: customerName,
              phone: customerPhone
            });
          }

          if (!customer && (customerName || customerEmail)) {
            customer = new Customer({
              name: customerName || 'Cliente sem nome',
              email: customerEmail || undefined,
              phone: customerPhone || undefined
            });

            await customer.save();
            customersCreated.push(customer);
          }

          if (customer) {
            customerId = customer._id;
          }
        }

        const saleData: any = {
          book: book._id,
          author: authorId,
          platform,
          saleDate,
          quantity,
          salePrice,
          orderNumber,
          isProcessed: false,
          source: detectedSource,
          status: status
        };

        if (customerId) {
          saleData.customer = customerId;
        }

        if (customerName) saleData.customerName = customerName;
        if (customerEmail) saleData.customerEmail = customerEmail;
        if (customerPhone) saleData.customerPhone = customerPhone;

        const sale = new Sale(saleData);
        await sale.save();
        results.push(sale);

      } catch (error) {
        errors.push(`Erro ao processar linha: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const populatedSales = [];
    for (const sale of results) {
      const populatedSale = await Sale.findById(sale._id)
        .populate({
          path: 'book',
          populate: {
            path: 'author',
            select: 'name commissionRate'
          }
        });
      populatedSales.push(populatedSale);
    }

    const notFoundBooks = Array.from(notFoundBooksMap.entries()).map(
      ([book, count]) => count > 1 ? `${book} (${count} ocorrências)` : book
    );

    const duplicateSales = Array.from(duplicateSalesMap.entries()).map(
      ([sale, count]) => count > 1 ? `${sale} (${count} ocorrências)` : sale
    );

    const canceledSales = Array.from(canceledSalesMap.entries()).map(
      ([book, count]) => count > 1 ? `${book} (${count} ocorrências)` : book
    );

    res.status(201).json({
      message: `${results.length} vendas importadas com sucesso${errors.length > 0 || notFoundBooks.length > 0 || duplicateSales.length > 0 ? '' : ''}`,
      salesCreated: populatedSales,
      customersCreated: customersCreated.length,
      errors: errors.length > 0 ? errors : undefined,
      notFoundBooks: notFoundBooks.length > 0 ? notFoundBooks : undefined,
      duplicateSales: duplicateSales.length > 0 ? duplicateSales : undefined,
      canceledSales: canceledSales.length > 0 ? canceledSales : undefined
    });

  } catch (error) {
    res.status(500);
    throw new Error(`Erro ao importar vendas: ${error instanceof Error ? error.message : String(error)}`);
  }
});

export const deleteSale = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const sale = await Sale.findById(req.params.id).populate('commission');

  if (!sale) {
    res.status(404);
    throw new Error('Venda não encontrada');
  }

  if (sale.commission && typeof sale.commission === 'object' && sale.commission.isPaid) {
    res.status(400);
    throw new Error('Não é possível excluir uma venda cuja comissão já foi paga');
  }

  if (sale.commission) {
    const commissionId = typeof sale.commission === 'object' ? sale.commission._id : sale.commission;

    await Commission.findByIdAndUpdate(
      commissionId,
      { $pull: { sales: sale._id } }
    );
  }

  await Sale.findByIdAndDelete(req.params.id);

  res.json({
    message: 'Venda excluída com sucesso'
  });
});

export const getFilteredSales = async (req: Request, res: Response): Promise<void> => {
  try {
    const { author, startDate, endDate, processed, source } = req.query;

    const filter: any = {};

    if (author) {
      filter.author = new mongoose.Types.ObjectId(author as string);
    }

    if (startDate && endDate) {
      filter.saleDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    if (processed !== undefined) {
      filter.isProcessed = processed === 'true';
    }

    if (source) {
      filter.source = source;
    }

    const sales = await Sale.find(filter)
      .populate({
        path: 'book',
        populate: {
          path: 'author',
          select: 'name commissionRate'
        }
      })
      .populate('author', 'name commissionRate')
      .sort({ saleDate: -1 });

    res.status(200).json(sales);
  } catch (error: any) {
    console.error('Erro ao filtrar vendas:', error);
    res.status(500).json({
      message: 'Erro ao filtrar vendas',
      error: error.message
    });
  }
};