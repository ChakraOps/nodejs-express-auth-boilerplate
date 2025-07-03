const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const seedRolesAndPermissions = async () => {
  console.log('Seeding roles and permissions...');

  const roles = [
    { name: 'superadmin', description: 'System Super Admin', isSystem: true },
    { name: 'system_support_lead', description: 'System Support Lead', isSystem: true },
    { name: 'system_support_engineer', description: 'System Support Engineer', isSystem: true },
    { name: 'subscriber_admin', description: 'Subscriber/Team Admin', isSystem: false },
    { name: 'subscriber_member', description: 'Subscriber Standard Member', isSystem: false }
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role
    });
  }

  const permissions = [
    { name: 'team:read', description: 'View team settings' },
    { name: 'team:update', description: 'Update team settings' },
    { name: 'team:delete', description: 'Delete the team' },
    { name: 'member:invite', description: 'Invite new members' },
    { name: 'member:remove', description: 'Remove team members' },
    { name: 'member:view', description: 'View team members' },
    { name: 'role:assign', description: 'Assign roles to members' },
    { name: 'role:manage', description: 'Create/update/delete roles' },
    { name: 'audit:view', description: 'View audit logs' },
    { name: 'dashboard:access', description: 'Access core product features' },
    { name: 'dashboard:admin_tools', description: 'Access advanced tools' },
    { name: 'settings:manage_integrations', description: 'Manage integrations' },
    { name: 'settings:configure_security', description: 'Manage security settings' }
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm
    });
  }

  const allPermissions = await prisma.permission.findMany();
  const roleMap = {};
  for (const role of roles) {
    roleMap[role.name] = await prisma.role.findUnique({ where: { name: role.name } });
  }

  // Full permissions for system roles
  const systemRoles = ['superadmin', 'system_support_lead', 'system_support_engineer'];
  for (const roleName of systemRoles) {
    for (const perm of allPermissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roleMap[roleName].id, permissionId: perm.id } },
        update: {},
        create: { roleId: roleMap[roleName].id, permissionId: perm.id }
      });
    }
  }

  const adminPerms = allPermissions.filter((p) =>
    [
      'team:read',
      'team:update',
      'member:invite',
      'member:remove',
      'member:view',
      'role:assign',
      'role:manage',
      'audit:view',
      'dashboard:access',
      'dashboard:admin_tools',
      'settings:manage_integrations',
      'settings:configure_security'
    ].includes(p.name)
  );

  for (const perm of adminPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roleMap['subscriber_admin'].id, permissionId: perm.id } },
      update: {},
      create: { roleId: roleMap['subscriber_admin'].id, permissionId: perm.id }
    });
  }

  const memberPerms = allPermissions.filter(
    (p) => p.name === 'dashboard:access' || p.name === 'member:view'
  );

  for (const perm of memberPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roleMap['subscriber_member'].id, permissionId: perm.id } },
      update: {},
      create: { roleId: roleMap['subscriber_member'].id, permissionId: perm.id }
    });
  }

  console.log('Roles and permissions seeded ✅');
};

module.exports = seedRolesAndPermissions;
