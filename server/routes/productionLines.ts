import { Router } from 'express';
import { dbProductionLines } from '../db';
import { checkPermission } from '../middleware/rbac';

export const productionLinesRouter = Router();

// GET all production lines
productionLinesRouter.get('/', (req, res) => {
  try {
    const lines = dbProductionLines.getAll();
    res.json({ success: true, data: lines });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create production line
productionLinesRouter.post('/', checkPermission('production', 'write'), (req, res) => {
  try {
    const { name, code, department, description, capacityPerDay, status } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'نام خط تولید الزامی است' });
    const newLine = dbProductionLines.create({ name, code, department, description, capacityPerDay, status });
    res.status(201).json({ success: true, data: newLine });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update production line
productionLinesRouter.put('/:id', checkPermission('production', 'write'), (req, res) => {
  try {
    const success = dbProductionLines.update(req.params.id, req.body);
    if (!success) return res.status(404).json({ success: false, error: 'خط تولید یافت نشد' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE production line
productionLinesRouter.delete('/:id', checkPermission('production', 'write'), (req, res) => {
  try {
    dbProductionLines.delete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
