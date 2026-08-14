import { Router } from 'express';
import { categoriesRouter } from './categories';
import { productionLinesRouter } from './productionLines';
import { productsRouter } from './products';
import { ordersRouter } from './orders';
import { productionTasksRouter } from './productionTasks';
import { warehouseRouter } from './warehouse';
import { usersRouter } from './users';
import { adminRouter } from './admin';

export const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    engine: 'Express + SQLite (Modular Architecture)',
    timestamp: new Date().toISOString(),
    endpoints: {
      categories: '/api/categories',
      productionLines: '/api/production-lines',
      products: '/api/products',
      orders: '/api/orders',
      productionTasks: '/api/production-tasks',
      inventoryLogs: '/api/warehouse/logs',
      users: '/api/users',
      roles: '/api/roles',
      adminReset: '/api/admin/reset-database',
    },
  });
});

// Mount module sub-routers
apiRouter.use('/categories', categoriesRouter);
apiRouter.use('/production-lines', productionLinesRouter);
apiRouter.use('/products', productsRouter);
apiRouter.use('/orders', ordersRouter);
apiRouter.use('/production-tasks', productionTasksRouter);
apiRouter.use('/warehouse', warehouseRouter);
apiRouter.use('/', usersRouter); // mounts /users and /roles
apiRouter.use('/admin', adminRouter);
