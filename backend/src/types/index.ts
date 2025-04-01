import { Document, Types } from 'mongoose';

export interface IAuthor extends Document {
  name: string;
  email?: string;
  commissionRate: number;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBook extends Document {
  title: string;
  author: Types.ObjectId | IAuthor;
  isbn?: string;
  price: number;
  description?: string;
  publishDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type PlatformType = 'WooCommerce' | 'Amazon' | 'Livraria Cultura' |
  'Kobo' | 'Google Books' | 'Editora Direta' | 'Feiras Literárias' | 'OtherPlatform';

export interface ISale extends Document {
  book: Types.ObjectId | IBook;
  platform: PlatformType;
  saleDate: Date;
  quantity: number;
  salePrice: number;
  commission?: Types.ObjectId | ICommission;
  isProcessed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICommission extends Document {
  author: Types.ObjectId | IAuthor;
  startDate: Date;
  endDate: Date;
  commissionRate: number;
  commissionAmount: number;
  totalSales: number;
  isPaid: boolean;
  paymentDate?: Date;
  sales: Types.Array<Types.ObjectId | ISale>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuthorStats {
  author: string;
  totalSales: number;
  totalQuantity: number;
  salesByPlatform: {
    [key: string]: {
      quantity: number;
      total: number;
    }
  };
  salesByBook: Array<{
    id: string;
    title: string;
    quantity: number;
    total: number;
  }>;
}

export interface ISaleStats {
  totalSales: number;
  totalQuantity: number;
  salesByPlatform: {
    [key: string]: {
      quantity: number;
      total: number;
    }
  };
  salesByBook: Array<{
    id: string;
    title: string;
    quantity: number;
    total: number;
  }>;
  salesByMonth: Array<{
    month: string;
    quantity: number;
    total: number;
  }>;
}

export interface IPendingCommissions {
  pendingCommissions: ICommission[];
  totalPending: number;
  count: number;
}

export interface IPaidCommissions {
  paidCommissions: ICommission[];
  totalPaid: number;
  count: number;
}

export interface ErrorResponse extends Error {
  statusCode?: number;
}

export interface ICommissionCalculationDTO {
  startDate: string;
  endDate: string;
}