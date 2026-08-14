import { Router } from 'express';
import { dbProducts } from '../db';
import { checkPermission } from '../middleware/rbac';

export const productsRouter = Router();

// GET all products
productsRouter.get('/', (req, res) => {
  try {
    const products = dbProducts.getAll();
    res.json({ success: true, data: products });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET product by ID
productsRouter.get('/:id', (req, res) => {
  try {
    const product = dbProducts.getById(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'محصول یافت نشد' });
    res.json({ success: true, data: product });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create product (requires write on products or warehouse)
productsRouter.post('/', checkPermission('products', 'write'), (req, res) => {
  try {
    const { name, sku } = req.body;
    if (!name || !sku) {
      return res.status(400).json({ success: false, error: 'نام کالا و کد SKU الزامی است' });
    }
    const newProduct = dbProducts.create(req.body);
    res.status(201).json({ success: true, data: newProduct });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update product
productsRouter.put('/:id', checkPermission('products', 'write'), (req, res) => {
  try {
    const success = dbProducts.update(req.params.id, req.body);
    if (!success) return res.status(404).json({ success: false, error: 'محصول یافت نشد' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE product
productsRouter.delete('/:id', checkPermission('products', 'write'), (req, res) => {
  try {
    dbProducts.delete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
