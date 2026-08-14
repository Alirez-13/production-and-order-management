import { Request, Response, NextFunction } from 'express';
import { dbUsers, dbRoles } from '../db';
import { ModuleName } from '../../src/types';

/**
 * Express Middleware to check RBAC permissions on backend routes.
 * User ID can be passed in 'x-user-id' header or defaults to super admin for development.
 */
export function checkPermission(module: ModuleName, type: 'read' | 'write') {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.headers['x-user-id'] as string) || 'usr_1';
    const users = dbUsers.getAll();
    const user = users.find((u) => u.id === userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'کاربر نامعتبر یا غیرفعال است.' });
    }

    // Check custom override
    if (user.customPermissions && user.customPermissions[module] !== undefined) {
      if (user.customPermissions[module][type]) {
        return next();
      } else {
        return res.status(403).json({
          success: false,
          error: `خطای دسترسی ۴۰۳: کاربر «${user.name}» مجوز ${type === 'read' ? 'مشاهده' : 'ویرایش'} ماژول «${module}» را ندارد.`,
        });
      }
    }

    // Check role default
    const roles = dbRoles.getAll();
    const role = roles.find((r) => r.id === user.roleId);
    if (role && role.permissions && role.permissions[module] && role.permissions[module][type]) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: `خطای دسترسی ۴۰۳: نقش «${role?.titleFa || user.roleId}» فاقد مجوز ${type === 'read' ? 'خواندن' : 'نوشتن'} برای «${module}» است.`,
    });
  };
}
