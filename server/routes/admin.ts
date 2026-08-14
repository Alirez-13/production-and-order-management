import { Router } from 'express';
import { dbAdmin } from '../db';
import { checkPermission } from '../middleware/rbac';

export const adminRouter = Router();

// POST reset SQLite database
adminRouter.post('/reset-database', checkPermission('users', 'write'), (req, res) => {
  try {
    dbAdmin.resetData();
    res.json({
      success: true,
      message: 'دیتابیس SQLite با موفقیت ریست شد و کلیه جداول و داده‌های نمونه بازیابی شدند.',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
