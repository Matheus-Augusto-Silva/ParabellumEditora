import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Sale from '../models/Sale';
import Book from '../models/Book';
import { ISaleStats } from '../types';
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

const parseDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();

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
  const { book, platform, saleDate, quantity, salePrice } = req.body;

  const sale = await Sale.findById(req.params.id);

  if (sale) {
    if (sale.isProcessed) {
      res.status(400);
      throw new Error('Não é possível editar uma venda que já foi processada em uma comissão');
    }

    if (book && book !== sale.book.toString()) {
      const bookExists = await Book.findById(book);
      if (!bookExists) {
        res.status(400);
        throw new Error('Livro não encontrado');
      }
    }

    sale.book = book || sale.book;
    sale.platform = platform || sale.platform;
    if (saleDate) {
      sale.saleDate = new Date(saleDate);
    }
    sale.quantity = quantity !== undefined ? quantity : sale.quantity;
    sale.salePrice = salePrice !== undefined ? salePrice : sale.salePrice;

    const updatedSale = await sale.save();

    const populatedSale = await Sale.findById(updatedSale._id)
      .populate({
        path: 'book',
        populate: {
          path: 'author',
          select: 'name commissionRate'
        }
      });

    res.json(populatedSale);
  } else {
    res.status(404);
    throw new Error('Venda não encontrada');
  }
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
    throw new Error('Por favor, envie um arquivo CSV ou XLSX.');
  }

  const results: any[] = [];
  const errors: string[] = [];
  const notFoundBooksMap: Map<string, number> = new Map();
  const duplicateSalesMap: Map<string, number> = new Map();
  const source = req.body.source || 'editora';

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

          const bookTitle = normalizedData['título'] || '';
          let platform = normalizedData['canal'] || '';
          const quantity = parseInt(normalizedData['quantidade'] || '0', 10);
          const salePrice = parseFloat(normalizedData['valor unitário cliente'] ||
            (normalizedData['valor total capa'] / quantity) || '0');
          let saleDateStr = normalizedData['data venda'] || '';
          const orderNumber = normalizedData['pedido'] || '';
          const isbn = normalizedData['sku'] || '';

          if (!bookTitle || !platform || isNaN(quantity) || isNaN(salePrice)) {
            errors.push(`Dados inválidos: ${JSON.stringify(normalizedData)}`);
            continue;
          }

          platform = mapPlatform(platform);
          const saleDate = parseDate(saleDateStr);

          if (orderNumber) {
            const existingSale = await Sale.findOne({ orderNumber });
            if (existingSale) {
              const saleKey = `${bookTitle} - Pedido: ${orderNumber}`;
              duplicateSalesMap.set(saleKey, (duplicateSalesMap.get(saleKey) || 0) + 1);
              continue;
            }
          }

          let book;
          if (isbn) {
            book = await Book.findOne({ isbn });
          }

          if (!book) {
            book = await Book.findOne({
              title: { $regex: new RegExp(bookTitle.toString(), 'i') }
            });
          }

          if (!book) {
            const bookKey = `${bookTitle}${isbn ? ` (ISBN: ${isbn})` : ''}`;
            notFoundBooksMap.set(bookKey, (notFoundBooksMap.get(bookKey) || 0) + 1);
            continue;
          }

          const sale = new Sale({
            book: book._id,
            platform,
            saleDate,
            quantity,
            salePrice,
            orderNumber,
            isProcessed: false,
            source
          });

          await sale.save();
          results.push(sale);
        } catch (error) {
          errors.push(`Erro ao processar linha: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } catch (error) {
      res.status(500);
      throw new Error(`Erro ao importar vendas do Excel: ${error instanceof Error ? error.message : String(error)}`);
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

              const bookTitle = normalizedData.booktitle || normalizedData.title;
              let platform = normalizedData.platform;
              let saleDateStr = normalizedData.saledate || normalizedData.date;
              const quantity = parseInt(normalizedData.quantity, 10);
              const salePrice = parseFloat(normalizedData.saleprice || normalizedData.price);
              const orderNumber = normalizedData.ordernumber || normalizedData.order;
              const isbn = normalizedData.isbn || '';

              if (!bookTitle || !platform || !saleDateStr || isNaN(quantity) || isNaN(salePrice)) {
                errors.push(`Dados inválidos: ${JSON.stringify(data)}`);
                return;
              }

              platform = mapPlatform(platform);
              const saleDate = parseDate(saleDateStr);

              if (orderNumber) {
                const existingSale = await Sale.findOne({ orderNumber });
                if (existingSale) {
                  const saleKey = `${bookTitle} - Pedido: ${orderNumber}`;
                  duplicateSalesMap.set(saleKey, (duplicateSalesMap.get(saleKey) || 0) + 1);
                  return;
                }
              }

              let book;
              if (isbn) {
                book = await Book.findOne({ isbn });
              }

              if (!book) {
                book = await Book.findOne({
                  title: { $regex: new RegExp(bookTitle, 'i') }
                });
              }

              if (!book) {
                const bookKey = `${bookTitle}${isbn ? ` (ISBN: ${isbn})` : ''}`;
                notFoundBooksMap.set(bookKey, (notFoundBooksMap.get(bookKey) || 0) + 1);
                return;
              }

              const sale = new Sale({
                book: book._id,
                platform,
                saleDate,
                quantity,
                salePrice,
                orderNumber,
                isProcessed: false,
                source
              });

              await sale.save();
              results.push(sale);
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
      throw new Error(`Erro ao importar vendas: ${error instanceof Error ? error.message : String(error)}`);
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

  res.status(201).json({
    message: `${results.length} vendas importadas com sucesso${errors.length > 0 || notFoundBooks.length > 0 || duplicateSales.length > 0 ? ' (com alguns problemas)' : ''}`,
    salesCreated: populatedSales,
    errors: errors.length > 0 ? errors : undefined,
    notFoundBooks: notFoundBooks.length > 0 ? notFoundBooks : undefined,
    duplicateSales: duplicateSales.length > 0 ? duplicateSales : undefined
  });
});

export const deleteSale = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const sale = await Sale.findById(req.params.id);

  if (!sale) {
    res.status(404);
    throw new Error('Venda não encontrada');
  }

  if (sale.isProcessed) {
    res.status(400);
    throw new Error('Não é possível excluir uma venda que já foi processada em uma comissão');
  }

  await sale.remove();
  res.json({ message: 'Venda removida com sucesso' });
});

export const getFilteredSales = async (req: Request, res: Response): Promise<void> => {
  try {
    const { author, startDate, endDate, processed, source } = req.query;

    const filter: any = {};

    if (author) {
      filter['book.author._id'] = new mongoose.Types.ObjectId(author as string);
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

    const sales = await Sale.find(filter);

    res.status(200).json(sales);
  } catch (error: any) {
    console.error('Erro ao filtrar vendas:', error);
    res.status(500).json({
      message: 'Erro ao filtrar vendas',
      error: error.message
    });
  }
};