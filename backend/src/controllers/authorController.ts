import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Author from '../models/Author';
import Book from '../models/Book';
import Sale from '../models/Sale';
import { IAuthorStats } from '../types';

export const getAuthors = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const authors = await Author.find({}).sort({ name: 1 });
  res.json(authors);
});

export const getAuthorById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const author = await Author.findById(req.params.id);

  if (author) {
    res.json(author);
  } else {
    res.status(404);
    throw new Error('Autor não encontrado');
  }
});

export const createAuthor = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, email, commissionRate, bio } = req.body;

  const author = await Author.create({
    name,
    email,
    commissionRate,
    bio
  });

  res.status(201).json(author);
});

export const updateAuthor = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, email, commissionRate, bio } = req.body;

  const author = await Author.findById(req.params.id);

  if (author) {
    author.name = name || author.name;
    author.email = email || author.email;
    author.commissionRate = commissionRate !== undefined ? commissionRate : author.commissionRate;
    author.bio = bio !== undefined ? bio : author.bio;

    const updatedAuthor = await author.save();
    res.json(updatedAuthor);
  } else {
    res.status(404);
    throw new Error('Autor não encontrado');
  }
});

export const deleteAuthor = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const author = await Author.findById(req.params.id);

  if (author) {
    const books = await Book.find({ author: req.params.id });

    if (books.length > 0) {
      res.status(400);
      throw new Error('Não é possível excluir um autor que possui livros');
    }

    await author.remove();
    res.json({ message: 'Autor removido com sucesso' });
  } else {
    res.status(404);
    throw new Error('Autor não encontrado');
  }
});

export const getAuthorStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const author = await Author.findById(req.params.id);

  if (!author) {
    res.status(404);
    throw new Error('Autor não encontrado');
  }

  const books = await Book.find({ author: req.params.id });

  if (books.length === 0) {
    const emptyStats: IAuthorStats = {
      author: author._id.toString(),
      totalSales: 0,
      totalQuantity: 0,
      salesByPlatform: {},
      salesByBook: []
    };

    return res.json(emptyStats);
  }

  const bookIds = books.map(book => book._id);

  const sales = await Sale.find({ book: { $in: bookIds } }).populate('book');

  const totalSales = sales.reduce((sum, sale) => sum + (sale.salePrice * sale.quantity), 0);
  const totalQuantity = sales.reduce((sum, sale) => sum + sale.quantity, 0);

  const salesByPlatform: {
    [key: string]: {
      quantity: number;
      total: number;
    }
  } = {};

  for (const sale of sales) {
    const platform = sale.platform;

    if (!salesByPlatform[platform]) {
      salesByPlatform[platform] = {
        quantity: 0,
        total: 0
      };
    }

    salesByPlatform[platform].quantity += sale.quantity;
    salesByPlatform[platform].total += sale.salePrice * sale.quantity;
  }

  const salesByBook = books.map(book => {
    const bookSales = sales.filter(sale =>
      sale.book &&
      typeof sale.book !== 'string' &&
      sale.book._id.toString() === book._id.toString()
    );

    return {
      id: book._id.toString(),
      title: book.title,
      quantity: bookSales.reduce((sum, sale) => sum + sale.quantity, 0),
      total: bookSales.reduce((sum, sale) => sum + (sale.salePrice * sale.quantity), 0)
    };
  }).filter(book => book.quantity > 0).sort((a, b) => b.total - a.total);

  const authorStats: IAuthorStats = {
    author: author._id.toString(),
    totalSales,
    totalQuantity,
    salesByPlatform,
    salesByBook
  };

  res.json(authorStats);
});