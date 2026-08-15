import { AppUser, UserRole, ModuleName } from '../../types';

export class SecurityEntity {
  public static hasPermission(
    user: AppUser,
    roles: UserRole[],
    module: ModuleName,
    action: 'read' | 'write'
  ): boolean {
    if (!user) return false;
    // System admin role has full universal access
    if (user.roleId === 'role_admin' || user.id === 'usr_admin') return true;

    const userRole = roles.find((r) => r.id === user.roleId);
    if (!userRole) return false;

    const modPerm = userRole.permissions[module];
    if (!modPerm) return false;

    if (action === 'read') return modPerm.read === true;
    if (action === 'write') return modPerm.write === true;
    return false;
  }
}
