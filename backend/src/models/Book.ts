import mongoose, { Schema } from 'mongoose';
import { IBook } from '../types';

const bookSchema: Schema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'O título do livro é obrigatório'],
      trim: true
    },
    author: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Author',
      required: true
    }],
    isbn: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    },
    price: {
      type: Number,
      required: [true, 'O preço do livro é obrigatório'],
      min: 0
    },
    description: {
      type: String,
      trim: true
    },
    publishDate: {
      type: Date
    }
  },
  {
    timestamps: true,
  }
);

bookSchema.virtual('sales', {
  ref: 'Sale',
  localField: '_id',
  foreignField: 'book'
});

bookSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret.id;
    return ret;
  }
});

const Book = mongoose.model<IBook>('Book', bookSchema);

export default Book;