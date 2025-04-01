import mongoose, { Schema } from 'mongoose';
import { IAuthor } from '../types';

const authorSchema: Schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'O nome do autor é obrigatório'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/, 'Por favor, informe um email válido']
    },
    commissionRate: {
      type: Number,
      required: [true, 'A taxa de comissão é obrigatória'],
      min: 0,
      max: 100
    },
    bio: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
  }
);

authorSchema.virtual('books', {
  ref: 'Book',
  localField: '_id',
  foreignField: 'author'
});

authorSchema.virtual('commissions', {
  ref: 'Commission',
  localField: '_id',
  foreignField: 'author'
});

authorSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret.id;
    return ret;
  }
});

const Author = mongoose.model < IAuthor > ('Author', authorSchema);

export default Author;