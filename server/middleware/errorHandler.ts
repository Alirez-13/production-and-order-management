import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[API Server Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'خطای داخلی سرور رخ داده است.',
    timestamp: new Date().toISOString(),
  });
}
