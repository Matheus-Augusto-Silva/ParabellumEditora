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
    .sort({ 'author.name': 1 });

  res.json(commissions);
});

export const getPendingCommissions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const pendingCommissions = await Commission.find({ isPaid: false })
    .populate('author', 'name email commissionRate')
    .populate({
      path: 'sales',
      select: 'book platform saleDate quantity salePrice isProcessed'
    })
    .sort({ createdAt: -1 });

  const totalPending = pendingCommissions.reduce((sum: number, comm: any) => {
    const amount = comm.commissionAmount || 0;
    return sum + amount;
  }, 0);

  res.json({
    pendingCommissions,
    totalPending,
    count: pendingCommissions.length
  });
});

export const getPaidCommissions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const paidCommissions = await Commission.find({ isPaid: true })
    .populate('author', 'name email commissionRate')
    .populate({
      path: 'sales',
      select: 'book platform saleDate quantity salePrice isProcessed'
    })
    .sort({ paymentDate: -1 });

  const totalPaid = paidCommissions.reduce((sum: number, comm: any) => {
    const amount = comm.commissionAmount || 0;
    return sum + amount;
  }, 0);

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

  const authorBooks = await Book.find({ author: { $in: [authorId] } }).populate('author', 'name');

  if (authorBooks.length === 0) {
    res.status(404);
    throw new Error('Nenhum livro encontrado para este autor');
  }

  const bookIds = authorBooks.map(book => book._id);

  const existingCommissions = await Commission.find({
    author: authorId,
    startDate: { $gte: new Date(startDate) },
    endDate: { $lte: new Date(endDate) }
  });

  const processedSaleIds = existingCommissions.reduce((acc: any[], comm) => {
    return acc.concat(comm.sales || []);
  }, []);

  const sales = await Sale.find({
    book: { $in: bookIds },
    saleDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
    status: { $ne: 'canceled' },
    _id: { $nin: processedSaleIds }
  }).populate({
    path: 'book',
    select: 'title price author',
    populate: {
      path: 'author',
      select: 'name'
    }
  });

  if (sales.length === 0) {
    res.status(404);
    throw new Error('Nenhuma venda encontrada para o período selecionado ou todas as vendas já foram processadas para este autor');
  }

  let totalSalesAmount = 0;
  let totalQuantity = 0;
  let authorCommissionAmount = 0;
  const baseCommissionRate = author.commissionRate / 100;

  let hasDividedCommissions = false;
  let dividedCommissionDetails: any[] = [];
  let integralCommissionDetails: any[] = [];

  let editoraSales = 0;
  let parceiraSales = 0;
  let editoraTotal = 0;
  let parceiraTotal = 0;

  for (const sale of sales) {
    const saleTotal = sale.salePrice * sale.quantity;
    const book = sale.book as any;

    let numberOfAuthors = 1;
    let bookAuthors = [];

    if (book.author) {
      if (Array.isArray(book.author)) {
        numberOfAuthors = book.author.length;
        bookAuthors = book.author;
      } else {
        numberOfAuthors = 1;
        bookAuthors = [book.author];
      }
    }

    const authorShareRate = baseCommissionRate / numberOfAuthors;
    const authorCommissionForThisSale = saleTotal * authorShareRate;

    totalSalesAmount += saleTotal;
    totalQuantity += sale.quantity;
    authorCommissionAmount += authorCommissionForThisSale;

    if (numberOfAuthors > 1) {
      hasDividedCommissions = true;

      const coAuthors = bookAuthors
        .filter((a: any) => a._id && a._id.toString() !== authorId)
        .map((a: any) => a.name);

      dividedCommissionDetails.push({
        bookTitle: book.title,
        numberOfAuthors,
        coAuthors,
        saleTotal,
        originalRate: baseCommissionRate * 100,
        dividedRate: (authorShareRate * 100).toFixed(2),
        commission: authorCommissionForThisSale.toFixed(2)
      });
    } else {
      integralCommissionDetails.push({
        bookTitle: book.title,
        saleTotal,
        rate: baseCommissionRate * 100,
        commission: authorCommissionForThisSale.toFixed(2)
      });
    }

    if (sale.source === 'parceira') {
      parceiraSales++;
      parceiraTotal += saleTotal;
    } else {
      editoraSales++;
      editoraTotal += saleTotal;
    }
  }

  authorCommissionAmount = Number(authorCommissionAmount.toFixed(2));

  const commission = await Commission.create({
    author: authorId,
    startDate,
    endDate,
    commissionRate: author.commissionRate,
    commissionAmount: authorCommissionAmount,
    totalSales: Number(totalSalesAmount.toFixed(2)),
    isPaid: false,
    sales: sales.map(sale => sale._id),
    hasDividedCommissions,
    dividedCommissionDetails: hasDividedCommissions ? dividedCommissionDetails : undefined,
    integralCommissionDetails: integralCommissionDetails.length > 0 ? integralCommissionDetails : undefined
  });

  for (const sale of sales) {
    if (!sale.commission.includes(commission._id)) {
      sale.commission.push(commission._id);
    }

    if (!sale.isProcessed) {
      sale.isProcessed = true;
    }

    await sale.save();
  }

  res.status(201).json({
    message: 'Comissão calculada com sucesso',
    salesCount: sales.length,
    commission: {
      _id: commission._id,
      commissionAmount: commission.commissionAmount,
      totalSales: commission.totalSales,
      commissionRate: commission.commissionRate,
      hasDividedCommissions,
      dividedCommissionDetails,
      integralCommissionDetails
    },
    authorId,
    startDate,
    endDate,
    totalSales: totalSalesAmount,
    totalQuantity,
    authorCommission: authorCommissionAmount,
    detail: {
      parceira: {
        sales: parceiraSales,
        total: parceiraTotal
      },
      editora: {
        sales: editoraSales,
        total: editoraTotal
      }
    },
    salesIds: sales.map(sale => sale._id.toString())
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

  await updateSalesPaymentStatus(commission.sales);

  res.json({
    message: 'Comissão marcada como paga com sucesso',
    commission: updatedCommission
  });
});

const updateSalesPaymentStatus = async (saleIds: any[]) => {
  for (const saleId of saleIds) {
    const sale = await Sale.findById(saleId).populate({
      path: 'book',
      populate: {
        path: 'author',
        select: '_id name'
      }
    }).populate('commission');

    if (!sale) continue;

    const book = sale.book as any;
    const totalAuthors = book.author ? book.author.length : 1;

    const paidCommissions = await Commission.countDocuments({
      _id: { $in: sale.commission },
      isPaid: true
    });

    let newStatus = 'pending';
    if (paidCommissions === totalAuthors) {
      newStatus = 'completed';
    } else if (paidCommissions > 0) {
      newStatus = 'partial';
    }
    sale.paymentStatus = newStatus;
    await sale.save();
  }
};

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
