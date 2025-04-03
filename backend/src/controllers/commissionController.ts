import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Commission from '../models/Commission';
import Author from '../models/Author';
import Book from '../models/Book';
import Sale from '../models/Sale';
import { ICommissionCalculationDTO } from '../types';

export const getCommissions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const commissions = await Commission.find({})
    .populate('author', 'name email commissionRate')
    .sort({ startDate: -1 });

  res.json(commissions);
});

export const getPendingCommissions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const pendingCommissions = await Commission.find({ isPaid: false })
    .populate('author', 'name email commissionRate')
    .sort({ createdAt: -1 });

  const totalPending = pendingCommissions.reduce((sum: number, comm: any) => sum + comm.commissionAmount, 0);

  res.json({
    pendingCommissions,
    totalPending,
    count: pendingCommissions.length
  });
});

export const getPaidCommissions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const paidCommissions = await Commission.find({ isPaid: true })
    .populate('author', 'name email commissionRate')
    .sort({ paymentDate: -1 });

  const totalPaid = paidCommissions.reduce((sum: number, comm: any) => sum + comm.commissionAmount, 0);

  res.json({
    paidCommissions,
    totalPaid,
    count: paidCommissions.length
  });
});

export const getCommissionById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const commission = await Commission.findById(req.params.id)
    .populate('author', 'name email commissionRate')
    .populate({
      path: 'sales',
      populate: {
        path: 'book',
        select: 'title isbn price'
      }
    });

  if (commission) {
    res.json(commission);
  } else {
    res.status(404);
    throw new Error('Comissão não encontrada');
  }
});

export const calculateCommission = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const authorId = req.params.id || req.body.authorId;
  const { startDate, endDate } = req.body as ICommissionCalculationDTO;

  if (!authorId || !startDate || !endDate) {
    res.status(400);
    throw new Error('ID do autor, data inicial e final são obrigatórios');
  }

  const author = await Author.findById(authorId);

  if (!author) {
    res.status(404);
    throw new Error('Autor não encontrado');
  }

  const books = await Book.find({ author: authorId });

  if (books.length === 0) {
    res.status(404);
    throw new Error('Autor não possui livros cadastrados');
  }

  const bookIds = books.map(book => book._id);

  const sales = await Sale.find({
    book: { $in: bookIds },
    saleDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
    isProcessed: false
  }).populate({
    path: 'book',
    select: 'title price',
    populate: {
      path: 'author',
      select: 'name'
    }
  });

  if (sales.length === 0) {
    res.status(404);
    throw new Error('Não há vendas pendentes de cálculo de comissão para o período selecionado');
  }

  let totalSalesAmount = 0;
  let authorCommissionAmount = 0;

  for (const sale of sales) {
    const saleTotal = sale.salePrice * sale.quantity;
    totalSalesAmount += saleTotal;

    if (sale.source === 'parceira') {
      authorCommissionAmount += saleTotal * 0.3 * 0.1;
    } else {
      authorCommissionAmount += saleTotal * 0.9 * 0.1;
    }
  }

  const commission = await Commission.create({
    author: authorId,
    startDate,
    endDate,
    commissionRate: author.commissionRate,
    commissionAmount: authorCommissionAmount,
    totalSales: totalSalesAmount,
    isPaid: false,
    sales: sales.map(sale => sale._id)
  });

  for (const sale of sales) {
    sale.isProcessed = true;
    sale.commission = commission._id;
    await sale.save();
  }

  res.status(201).json({
    message: 'Comissão calculada com sucesso',
    commission,
    salesCount: sales.length
  });
});

export const markCommissionAsPaid = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const commission = await Commission.findById(req.params.id);

  if (!commission) {
    res.status(404);
    throw new Error('Comissão não encontrada');
  }

  if (commission.isPaid) {
    res.status(400);
    throw new Error('Esta comissão já foi paga');
  }

  commission.isPaid = true;
  commission.paymentDate = new Date();

  if (req.body.paymentMethod) {
    commission.paymentMethod = req.body.paymentMethod;
  }

  if (req.body.notes) {
    commission.notes = req.body.notes;
  }

  const updatedCommission = await commission.save();

  res.json({
    message: 'Comissão marcada como paga com sucesso',
    commission: updatedCommission
  });
});

export const deleteCommission = async (req: Request, res: Response): Promise<void> => {
  try {
    const commission = await Commission.findById(req.params.id);

    if (!commission) {
      res.status(404).json({ message: 'Comissão não encontrada' });
      return;
    }

    if (commission.isPaid) {
      res.status(400).json({
        message: 'Não é possível excluir uma comissão que já foi paga'
      });
      return;
    }

    const salesIds = commission.sales;

    if (salesIds && salesIds.length > 0) {
      await Sale.updateMany(
        { _id: { $in: salesIds } },
        { $set: { isProcessed: false, commission: null } }
      );
    }
    await Commission.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: 'Comissão excluída com sucesso e vendas liberadas',
      salesCount: salesIds.length
    });
  } catch (error: any) {
    console.error('Erro ao excluir comissão:', error);
    res.status(500).json({
      message: 'Erro ao excluir comissão',
      error: error.message
    });
  }
};

export const updateCommission = async (req: Request, res: Response): Promise<void> => {
  try {
    const commission = await Commission.findById(req.params.id);

    if (!commission) {
      res.status(404).json({ message: 'Comissão não encontrada' });
      return;
    }

    if (commission.isPaid) {
      res.status(400).json({
        message: 'Não é possível editar uma comissão que já foi paga'
      });
      return;
    }

    const allowedUpdates = [
      'commissionRate',
      'commissionAmount',
      'notes'
    ];

    const updates: any = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedCommission = await Commission.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );

    res.status(200).json(updatedCommission);
  } catch (error: any) {
    console.error('Erro ao atualizar comissão:', error);
    res.status(500).json({
      message: 'Erro ao atualizar comissão',
      error: error.message
    });
  }
};