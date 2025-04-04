import express from 'express';
import multer from 'multer';
import {
  getSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
  getSalesStats,
  importSales,
  getFilteredSales
} from '../controllers/saleController';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = express.Router();

router.route('/')
  .get(getSales)
  .post(createSale);

router.route('/stats')
  .get(getSalesStats);

router.route('/filter')
  .get(getFilteredSales);

router.route('/import')
  .post(upload.single('file'), importSales);

router.route('/:id')
  .get(getSaleById)
  .put(updateSale)
  .delete(deleteSale);

export default router;