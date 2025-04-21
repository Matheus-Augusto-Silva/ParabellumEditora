import mongoose, { Schema } from 'mongoose';
import { ICustomer } from '../types';

const customerSchema: Schema = new mongoose.Schema(
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
    }
  },
  {
    timestamps: true,
  }
);

customerSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret.id;
    return ret;
  }
});

const Customer = mongoose.model<ICustomer>('Customer', customerSchema);

export default Customer;