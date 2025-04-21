import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import connectDB from './config/db';
import { notFound, errorHandler } from './middleware/errorMiddleware';

import authorRoutes from './routes/authorRoutes';
import bookRoutes from './routes/bookRoutes';
import saleRoutes from './routes/saleRoutes';
import commissionRoutes from './routes/commissionRoutes';
import customerRoutes from './routes/customerRoutes';

dotenv.config();

connectDB();

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const tmpDir = path.join(__dirname, '../tmp');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir);
}

app.use('/api/authors', authorRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/customers', customerRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API da Editora Parabellum' });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} em modo ${process.env.NODE_ENV}`);
});
