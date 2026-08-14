import { Router } from 'express';
import { dbProductionTasks, dbOrders, dbProducts } from '../db';
import { checkPermission } from '../middleware/rbac';

export const productionTasksRouter = Router();

// GET all production tasks
productionTasksRouter.get('/', (req, res) => {
  try {
    const tasks = dbProductionTasks.getAll();
    res.json({ success: true, data: tasks });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create production task manually (requires write on production)
productionTasksRouter.post('/', checkPermission('production', 'write'), (req, res) => {
  try {
    const { productName, quantity } = req.body;
    if (!productName || !quantity) {
      return res.status(400).json({ success: false, error: 'نام محصول و تعداد الزامی است' });
    }
    const newTask = dbProductionTasks.create(req.body);
    res.status(201).json({ success: true, data: newTask });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST send order to production line
productionTasksRouter.post('/from-order', checkPermission('production', 'write'), (req, res) => {
  try {
    const { orderId, productionLine, estimatedHours, operatorName } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'شناسه سفارش الزامی است' });
    }

    const order = dbOrders.getById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'سفارش یافت نشد.' });
    }

    const createdTasks = [];
    const products = dbProducts.getAll();

    for (const item of order.items) {
      const prod = products.find((p) => p.id === item.productId || p.sku === item.sku);
      const task = dbProductionTasks.create({
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerCompany || order.customerName,
        productId: item.productId || (prod ? prod.id : 'prod_custom'),
        productName: item.productName,
        sku: item.sku || (prod ? prod.sku : 'CUSTOM-SKU'),
        quantity: item.quantity,
        unit: item.unit || 'عدد',
        stage: 'queued',
        progressPercent: 0,
        priority: order.priority,
        startDate: new Date().toISOString(),
        estimatedHours: estimatedHours || 8,
        productionLine: productionLine || (prod ? prod.productionLineName : 'خط تولید عمومی'),
        operatorName: operatorName || 'اپراتور شیفت ۱',
        notes: `ایجاده شده از سفارش مشتری ${order.customerName} (${order.orderNumber})`,
      });
      createdTasks.push(task);
    }

    dbOrders.updateStatus(order.id, 'in_production');

    res.status(201).json({
      success: true,
      tasks: createdTasks,
      message: `${createdTasks.length} دستور کار تولید برای سفارش ${order.orderNumber} در صف قرار گرفت.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH update task stage (queued -> in_production -> completed)
productionTasksRouter.patch('/:id/stage', checkPermission('production', 'write'), (req, res) => {
  try {
    const { stage, progressPercent, performedBy } = req.body;
    if (!stage) {
      return res.status(400).json({ success: false, error: 'مرحله جدید الزامی است' });
    }
    const result = dbProductionTasks.updateStage(req.params.id, stage, progressPercent, performedBy);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
