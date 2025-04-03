import mongoose, { Schema } from 'mongoose';
import { ISale } from '../types';

const saleSchema: Schema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'O livro é obrigatório']
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
    }
  },
  {
    timestamps: true,
  }
);

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