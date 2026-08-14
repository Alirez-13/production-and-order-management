import { Router } from 'express';
import { dbOrders } from '../db';
import { checkPermission } from '../middleware/rbac';

export const ordersRouter = Router();

// GET all orders
ordersRouter.get('/', (req, res) => {
  try {
    const orders = dbOrders.getAll();
    res.json({ success: true, data: orders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create customer order (requires write on orders)
ordersRouter.post('/', checkPermission('orders', 'write'), (req, res) => {
  try {
    const { customerName, items } = req.body;
    if (!customerName || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'نام مشتری و حداقل یک قلم کالا الزامی است' });
    }
    const newOrder = dbOrders.create(req.body);
    res.status(201).json({ success: true, data: newOrder });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH dispatch order to customer (requires write on warehouse or orders)
ordersRouter.patch('/:id/dispatch', checkPermission('warehouse', 'write'), (req, res) => {
  try {
    const { trackingCode, performedBy } = req.body;
    const result = dbOrders.dispatch(req.params.id, trackingCode, performedBy || 'مسئول انبار');
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH update order status
ordersRouter.patch('/:id/status', checkPermission('orders', 'write'), (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, error: 'وضعیت جدید الزامی است' });
    const success = dbOrders.updateStatus(req.params.id, status);
    if (!success) return res.status(404).json({ success: false, error: 'سفارش یافت نشد' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
