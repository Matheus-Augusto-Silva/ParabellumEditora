import mongoose, { Schema } from 'mongoose';
import { IClient } from '../types';

const clientSchema: Schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'O nome do cliente é obrigatório'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      index: true,
      match: [/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/, 'Por favor, informe um email válido']
    },
    phone: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    postalCode: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
  }
);

clientSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret.id;
    return ret;
  }
});

const Client = mongoose.model<IClient>('Client', clientSchema);

export default Client;
