import mongoose, { Schema } from 'mongoose';
import { ISale } from '../types';

const saleSchema: Schema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'O livro é obrigatório']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Author'
    },
    platform: {
      type: String,
      required: [true, 'A plataforma é obrigatória'],
      enum: [
        'Amazon',
        'Mercado Livre',
        'Estante Virtual',
        'umLivro',
        'Carrefour',
        'Americanas',
        'Site da Editora',
        'Outra plataforma'
      ]
    },
    saleDate: {
      type: Date,
      required: [true, 'A data da venda é obrigatória'],
      default: Date.now
    },
    quantity: {
      type: Number,
      required: [true, 'A quantidade vendida é obrigatória'],
      min: 1
    },
    salePrice: {
      type: Number,
      required: [true, 'O preço de venda é obrigatório'],
      min: 0
    },
    commission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Commission'
    },
    isProcessed: {
      type: Boolean,
      default: false
    },
    orderNumber: {
      type: String,
      trim: true,
      index: true
    },
    source: {
      type: String,
      enum: ['editora', 'parceira'],
      default: 'editora'
    }
  },
  {
    timestamps: true,
  }
);

saleSchema.pre('save', async function (next) {
  if (this.author) {
    return next();
  }

  if (this.book) {
    try {
      const book = await mongoose.model('Book').findById(this.book).populate('author');
      if (book && book.author) {
        this.author = book.author._id;
      }
    } catch (error) {
      console.error('Erro ao buscar autor do livro:', error);
    }
  }

  next();
});

saleSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret.id;
    return ret;
  }
});

const Sale = mongoose.model<ISale>('Sale', saleSchema);

export default Sale;