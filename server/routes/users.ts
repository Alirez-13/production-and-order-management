import { Router } from 'express';
import { dbUsers, dbRoles } from '../db';
import { checkPermission } from '../middleware/rbac';

export const usersRouter = Router();

// GET all users
usersRouter.get('/users', (req, res) => {
  try {
    const users = dbUsers.getAll();
    res.json({ success: true, data: users });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create user (requires write on users module)
usersRouter.post('/users', checkPermission('users', 'write'), (req, res) => {
  try {
    const { name, roleId } = req.body;
    if (!name || !roleId) {
      return res.status(400).json({ success: false, error: 'نام و نقش کاربری الزامی است' });
    }
    const newUser = dbUsers.create(req.body);
    res.status(201).json({ success: true, data: newUser });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH update user role
usersRouter.patch('/users/:id/role', checkPermission('users', 'write'), (req, res) => {
  try {
    const { roleId } = req.body;
    if (!roleId) return res.status(400).json({ success: false, error: 'شناسه نقش الزامی است' });
    dbUsers.updateRole(req.params.id, roleId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH update custom RBAC permissions
usersRouter.patch('/users/:id/permissions', checkPermission('users', 'write'), (req, res) => {
  try {
    const { permissions } = req.body;
    if (!permissions) return res.status(400).json({ success: false, error: 'ماتریس دسترسی الزامی است' });
    dbUsers.updateCustomPermissions(req.params.id, permissions);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all roles
usersRouter.get('/roles', (req, res) => {
  try {
    const roles = dbRoles.getAll();
    res.json({ success: true, data: roles });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
