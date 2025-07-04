import { ReactNode } from "react";

export interface IAuthor {
  _id: string;
  name: string;
  email?: string;
  bio?: string;
  bankInfo?: {
    bank?: string;
    agency?: string;
    account?: string;
    pix?: string;
  };
  commissionRate?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICustomer {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IBook {
  _id: string;
  title: string;
  author: IAuthor[] | string[];
  isbn?: string;
  publishDate?: string;
  price?: number;
  description?: string;
  categories?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ISale {
  _id: string;
  book: {
    _id: string;
    title: string;
    author: IAuthor[] | IAuthor;
    price: number;
  };
  author: IAuthor[];
  platform: string;
  saleDate: string;
  quantity: number;
  salePrice: number;
  commission?: string | {
    _id: string;
    isPaid: boolean;
    paymentDate?: string;
    commissionAmount: number;
  };
  isProcessed: boolean;
  paymentStatus: 'pending' | 'partial' | 'completed';
  orderNumber?: string;
  customer?: ICustomer;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  source: 'editora' | 'parceira';
  status: 'completed' | 'canceled';
  createdAt: string;
  updatedAt: string;
}

interface ICommissionDetail {
  bookTitle: string;
  numberOfAuthors?: number;
  coAuthors?: string[];
  saleTotal: number;
  originalRate?: number;
  dividedRate?: string;
  rate?: number;
  commission: string;
}

export interface ICommission {
  _id: string;
  author: {
    _id: string;
    name: string;
    email: string;
    commissionRate: number;
  };
  startDate: string;
  endDate: string;
  commissionRate: number;
  commissionAmount: number;
  totalSales: number;
  isPaid: boolean;
  paymentDate?: string;
  createdAt: string;
  hasDividedCommissions?: boolean;
  dividedCommissionDetails?: ICommissionDetail[];
  integralCommissionDetails?: ICommissionDetail[];
}

export interface IAuthorStats {
  totalSales: number;
  totalQuantity: number;
  salesByPlatform: {
    [platform: string]: {
      quantity: number;
      total: number;
    };
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
    [platform: string]: {
      quantity: number;
      total: number;
    };
  };
  salesByBook: Array<{
    id: string;
    title: string;
    quantity: number;
    total: number;
  }>;
}

export interface IPendingCommissions {
  count: ReactNode;
  commissions: never[];
  pendingCommissions: ICommission[];
  totalPending: number;
}

export interface IPaidCommissions {
  commissions: never[];
  paidCommissions: ICommission[];
  totalPaid: number;
}

export interface ICommissionCalculation {
  authorId: string;
  startDate: string;
  endDate: string;
  totalSales: number;
  totalQuantity: number;
  authorCommission: number;
  publisherRevenue: number;
  partnerRevenue: number;
  detail: {
    parceira: {
      sales: number;
      quantity: number;
      total: number;
      authorCommission: number;
      publisherRevenue: number;
      partnerRevenue: number;
    };
    editora: {
      sales: number;
      quantity: number;
      total: number;
      authorCommission: number;
      publisherRevenue: number;
    };
  };
  salesIds: string[];
}