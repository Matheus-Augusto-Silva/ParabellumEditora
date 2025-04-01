import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Sale from '../models/Sale';
import Book from '../models/Book';
import { ISaleStats } from '../types';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';

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
    throw new Error('Por favor, envie um arquivo CSV.');
  }

  const results: any[] = [];
  const errors: string[] = [];

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
            const platform = normalizedData.platform;
            const saleDate = normalizedData.saledate || normalizedData.date;
            const quantity = parseInt(normalizedData.quantity, 10);
            const salePrice = parseFloat(normalizedData.saleprice || normalizedData.price);

            if (!bookTitle || !platform || !saleDate || isNaN(quantity) || isNaN(salePrice)) {
              errors.push(`Dados inválidos: ${JSON.stringify(data)}`);
              return;
            }

            const book = await Book.findOne({
              title: { $regex: new RegExp(bookTitle, 'i') }
            });

            if (!book) {
              errors.push(`Livro não encontrado: ${bookTitle}`);
              return;
            }

            const sale = new Sale({
              book: book._id,
              platform,
              saleDate: new Date(saleDate),
              quantity,
              salePrice,
              isProcessed: false
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

    res.status(201).json({
      message: `${results.length} vendas importadas com sucesso${errors.length > 0 ? ` (${errors.length} erros)` : ''}`,
      salesCreated: populatedSales,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Erro ao importar vendas: ${error instanceof Error ? error.message : String(error)}`);
  }
});