import express from 'express';
import {
  getCommissions,
  getPendingCommissions,
  getPaidCommissions,
  getCommissionById,
  calculateCommission,
  markCommissionAsPaid,
  deleteCommission,
  updateCommission
} from '../controllers/commissionController';

const router = express.Router();

router.route('/')
  .get(getCommissions)
  .post(calculateCommission);

router.route('/pendingCommissions')
  .get(getPendingCommissions);

router.route('/paidCommissions')
  .get(getPaidCommissions);

router.route('/:id')
  .get(getCommissionById)
  .put(updateCommission)
  .delete(deleteCommission);

router.route('/:id/payCommission')
  .put(markCommissionAsPaid);

router.route('/author/:id/calculate')
  .post(calculateCommission);

export default router;