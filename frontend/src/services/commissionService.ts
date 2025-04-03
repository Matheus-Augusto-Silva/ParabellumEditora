import api from '@/services/api';
import { IPendingCommissions, IPaidCommissions } from '@/types';

interface ISaleWithSource {
  _id: string;
  book: {
    _id: string;
    title: string;
    author: {
      _id: string;
      name: string;
    };
  };
  platform: string;
  saleDate: string;
  quantity: number;
  salePrice: number;
  source: 'parceira' | 'editora';
  commission?: string;
}

interface ICommissionCalculation {
  salesCount: number;
  commission: {
    commissionAmount: number;
  };
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

interface ICommissionSaveRequest {
  authorId: string;
  startDate: string;
  endDate: string;
  notes?: string;
  commissionAmount: number;
  commissionRate?: number;
  totalSales: number;
  salesCount: number;
  salesIds: string[];
}

const ENDPOINT = '/commissions';

export const getSalesByAuthorAndDateRange = async (
  authorId: string,
  startDate: string,
  endDate: string
): Promise<ISaleWithSource[]> => {
  try {
    const response = await api.get(
      `/sales/filter?author=${authorId}&startDate=${startDate}&endDate=${endDate}&processed=false`
    );
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar vendas para cálculo de comissão:', error);
    throw error;
  }
};

export const calculateLocalCommission = (sales: ISaleWithSource[], authorId: string, startDate: string, endDate: string): ICommissionCalculation => {
  const result: ICommissionCalculation = {
    authorId,
    startDate,
    endDate,
    totalSales: 0,
    totalQuantity: 0,
    authorCommission: 0,
    publisherRevenue: 0,
    partnerRevenue: 0,
    detail: {
      parceira: {
        sales: 0,
        quantity: 0,
        total: 0,
        authorCommission: 0,
        publisherRevenue: 0,
        partnerRevenue: 0
      },
      editora: {
        sales: 0,
        quantity: 0,
        total: 0,
        authorCommission: 0,
        publisherRevenue: 0
      }
    },
    salesIds: [],
    salesCount: sales.length,
    commission: {
      commissionAmount: 0
    }
  };

  sales.forEach((sale) => {
    const saleTotal = sale.quantity * sale.salePrice;
    result.totalSales += saleTotal;
    result.totalQuantity += sale.quantity;
    result.salesIds.push(sale._id);

    if (sale.source === 'parceira') {
      const editoraPercentage = 0.3;
      const authorPercentage = 0.1;

      const editoraPart = saleTotal * editoraPercentage;
      const authorCommission = editoraPart * authorPercentage;
      const publisherRevenue = editoraPart * (1 - authorPercentage);
      const partnerRevenue = saleTotal * (1 - editoraPercentage);

      result.authorCommission += authorCommission;
      result.publisherRevenue += publisherRevenue;
      result.partnerRevenue += partnerRevenue;

      result.detail.parceira.sales += 1;
      result.detail.parceira.quantity += sale.quantity;
      result.detail.parceira.total += saleTotal;
      result.detail.parceira.authorCommission += authorCommission;
      result.detail.parceira.publisherRevenue += publisherRevenue;
      result.detail.parceira.partnerRevenue += partnerRevenue;
    } else {
      const editoraPercentage = 0.9;
      const authorPercentage = 0.1;

      const editoraPart = saleTotal * editoraPercentage;
      const authorCommission = editoraPart * authorPercentage;
      const publisherRevenue = editoraPart * (1 - authorPercentage);
      const otherCosts = saleTotal * (1 - editoraPercentage);

      result.authorCommission += authorCommission;
      result.publisherRevenue += publisherRevenue;
      result.partnerRevenue += otherCosts;

      result.detail.editora.sales += 1;
      result.detail.editora.quantity += sale.quantity;
      result.detail.editora.total += saleTotal;
      result.detail.editora.authorCommission += authorCommission;
      result.detail.editora.publisherRevenue += publisherRevenue;
    }
  });

  result.commission.commissionAmount = result.authorCommission;

  return result;
};

export const processCommission = async (
  authorId: string,
  startDate: string,
  endDate: string
) => {
  try {
    const sales = await getSalesByAuthorAndDateRange(authorId, startDate, endDate);

    if (sales.length === 0) {
      throw new Error('Nenhuma venda encontrada para o período selecionado.');
    }

    const calculation = calculateLocalCommission(sales, authorId, startDate, endDate);

    const savedCommission = await saveCommission({
      authorId: calculation.authorId,
      startDate: calculation.startDate,
      endDate: calculation.endDate,
      commissionAmount: calculation.authorCommission,
      totalSales: calculation.totalSales,
      salesCount: sales.length,
      salesIds: calculation.salesIds
    });

    calculation.commission = {
      commissionAmount: savedCommission.commissionAmount
    };

    return calculation;
  } catch (error) {
    console.error('Erro ao processar comissão:', error);
    throw error;
  }
};

export const saveCommission = async (commissionData: ICommissionSaveRequest) => {
  try {
    const response = await api.post(`${ENDPOINT}`, commissionData);
    return response.data;
  } catch (error) {
    console.error('Erro ao salvar comissão:', error);
    throw error;
  }
};

export const getPendingCommissions = async (): Promise<IPendingCommissions> => {
  try {
    const response = await api.get(`${ENDPOINT}/pendingCommissions`);
    console.log("Resposta pendingCommissions:", response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar comissões pendentes:', error);
    throw error;
  }
};

export const getPaidCommissions = async (): Promise<IPaidCommissions> => {
  try {
    const response = await api.get(`${ENDPOINT}/paidCommissions`);
    console.log("Resposta paidCommissions:", response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar comissões pagas:', error);
    throw error;
  }
};

export const markCommissionAsPaid = async (id: string) => {
  const response = await api.put(`${ENDPOINT}/${id}/payCommission`);
  return response.data;
};

export const deleteCommission = async (id: string) => {
  try {
    const response = await api.delete(`${ENDPOINT}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao excluir comissão:', error);
    throw error;
  }
};

export const getCommissionById = async (id: string) => {
  try {
    const response = await api.get(`${ENDPOINT}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar comissão por ID:', error);
    throw error;
  }
};

export const updateCommission = async (id: string, commissionData: Partial<ICommissionSaveRequest>) => {
  try {
    const response = await api.put(`${ENDPOINT}/${id}`, commissionData);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar comissão:', error);
    throw error;
  }
};