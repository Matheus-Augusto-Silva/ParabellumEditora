import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types';

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new Error(`Rota não encontrada: ${req.originalUrl}`) as ErrorResponse;
  res.status(404);
  next(error);
};

export const errorHandler = (
  err: ErrorResponse,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};