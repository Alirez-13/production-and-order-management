import { Router } from 'express';
import { dbInventoryLogs } from '../db';
import { checkPermission } from '../middleware/rbac';

export const warehouseRouter = Router();

// GET all inventory logs
warehouseRouter.get('/logs', (req, res) => {
  try {
    const logs = dbInventoryLogs.getAll();
    res.json({ success: true, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST adjust stock manually (requires write on warehouse)
warehouseRouter.post('/adjust-stock', checkPermission('warehouse', 'write'), (req, res) => {
  try {
    const { productId, newQuantity, reason, performedBy } = req.body;
    if (!productId || newQuantity === undefined) {
      return res.status(400).json({ success: false, error: 'شناسه محصول و موجودی جدید الزامی است' });
    }
    const result = dbInventoryLogs.adjustStock(productId, Number(newQuantity), reason, performedBy);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
