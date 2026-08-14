import { Router } from 'express';
import { dbCategories } from '../db';
import { checkPermission } from '../middleware/rbac';

export const categoriesRouter = Router();

// GET all categories
categoriesRouter.get('/', (req, res) => {
  try {
    const categories = dbCategories.getAll();
    res.json({ success: true, data: categories });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create category (requires write on products)
categoriesRouter.post('/', checkPermission('products', 'write'), (req, res) => {
  try {
    const { name, color, icon, description } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'نام دسته‌بندی الزامی است' });
    const newCat = dbCategories.create({ name, color, icon, description });
    res.status(201).json({ success: true, data: newCat });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update category
categoriesRouter.put('/:id', checkPermission('products', 'write'), (req, res) => {
  try {
    const success = dbCategories.update(req.params.id, req.body);
    if (!success) return res.status(404).json({ success: false, error: 'دسته‌بندی یافت نشد' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE category
categoriesRouter.delete('/:id', checkPermission('products', 'write'), (req, res) => {
  try {
    dbCategories.delete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
