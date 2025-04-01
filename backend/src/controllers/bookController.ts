import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Book from '../models/Book';
import Sale from '../models/Sale';

export const getBooks = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const books = await Book.find({})
    .populate('author', 'name email commissionRate')
    .sort({ title: 1 });
  res.json(books);
});

export const getBookById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const book = await Book.findById(req.params.id)
    .populate('author', 'name email commissionRate');

  if (book) {
    res.json(book);
  } else {
    res.status(404);
    throw new Error('Livro não encontrado');
  }
});

export const createBook = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { title, author, isbn, price, description, publishDate } = req.body;

  if (isbn) {
    const existingBook = await Book.findOne({ isbn });
    if (existingBook) {
      res.status(400);
      throw new Error('Um livro com este ISBN já existe');
    }
  }

  const book = await Book.create({
    title,
    author,
    isbn,
    price,
    description,
    publishDate
  });

  const populatedBook = await Book.findById(book._id).populate('author', 'name email commissionRate');

  res.status(201).json(populatedBook);
});

export const updateBook = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { title, author, isbn, price, description, publishDate } = req.body;

  const book = await Book.findById(req.params.id);

  if (book) {
    if (isbn && isbn !== book.isbn) {
      const existingBook = await Book.findOne({ isbn });
      if (existingBook && existingBook._id.toString() !== req.params.id) {
        res.status(400);
        throw new Error('Um livro com este ISBN já existe');
      }
    }

    book.title = title || book.title;
    book.author = author || book.author;
    book.isbn = isbn !== undefined ? isbn : book.isbn;
    book.price = price !== undefined ? price : book.price;
    book.description = description !== undefined ? description : book.description;
    if (publishDate) {
      book.publishDate = new Date(publishDate);
    }

    const updatedBook = await book.save();

    const populatedBook = await Book.findById(updatedBook._id).populate('author', 'name email commissionRate');

    res.json(populatedBook);
  } else {
    res.status(404);
    throw new Error('Livro não encontrado');
  }
});

export const deleteBook = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const book = await Book.findById(req.params.id);

  if (book) {
    const sales = await Sale.find({ book: req.params.id });

    if (sales.length > 0) {
      res.status(400);
      throw new Error('Não é possível excluir um livro que possui vendas');
    }

    await book.remove();
    res.json({ message: 'Livro removido com sucesso' });
  } else {
    res.status(404);
    throw new Error('Livro não encontrado');
  }
});