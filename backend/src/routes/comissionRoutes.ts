import express from 'express';
import {
  getCommissions,
  getPendingCommissions,
  getPaidCommissions,
  getCommissionById,
  calculateCommission,
  markCommissionAsPaid
} from '../controllers/comissionController';

const router = express.Router();

router.route('/')
  .get(getCommissions)
  .post(calculateCommission);

router.route('/pendingCommissions')
  .get(getPendingCommissions);

router.route('/paidCommissions')
  .get(getPaidCommissions);

router.route('/:id')
  .get(getCommissionById);

router.route('/:id/payComission')
  .put(markCommissionAsPaid);

router.route('/author/:id/calculate')
  .post(calculateCommission);

export default router;