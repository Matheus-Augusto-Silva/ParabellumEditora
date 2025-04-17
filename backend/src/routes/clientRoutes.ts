import express from 'express';
import { 
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  importClients,
  importClientsFromSales
} from '../controllers/clientController';
import { upload } from '../controllers/clientController';

const router = express.Router();

router.route('/')
  .get(getClients)
  .post(createClient);

router.route('/:id')
  .get(getClientById)
  .put(updateClient)
  .delete(deleteClient);

router.route('/import')
  .post(upload.single('file'), importClients);

router.route('/import-from-sales')
  .post(importClientsFromSales);

export default router;
