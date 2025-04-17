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

export interface IClient {
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
  book: IBook | string;
  platform: string;
  saleDate: string;
  quantity: number;
  salePrice: number;
  source?: string;
  commission?: string;
  status?: 'completed' | 'canceled';
  client?: IClient | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICommission {
  _id: string;
  author: IAuthor | string;
  startDate: string;
  endDate: string;
  commissionAmount: number;
  commissionRate: number;
  totalSales: number;
  isPaid: boolean;
  paymentDate?: string;
  paymentMethod?: string;
  notes?: string;
  sales?: string[] | ISale[];
  createdAt?: string;
  updatedAt?: string;
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