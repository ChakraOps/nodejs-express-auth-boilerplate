// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('Seeding roles, permissions, and role-permissions...');

    // --- Roles ---
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

    // --- Permissions ---
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
    const superadmin = await prisma.role.findUnique({ where: { name: 'superadmin' } });
    const systemSupportLead = await prisma.role.findUnique({
      where: { name: 'system_support_lead' }
    });
    const systemSupportEngineer = await prisma.role.findUnique({
      where: { name: 'system_support_engineer' }
    });
    const subscriberAdmin = await prisma.role.findUnique({ where: { name: 'subscriber_admin' } });
    const subscriberMember = await prisma.role.findUnique({ where: { name: 'subscriber_member' } });

    // --- Role-Permission Mapping ---
    for (const perm of allPermissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: superadmin.id, permissionId: perm.id } },
        update: {},
        create: { roleId: superadmin.id, permissionId: perm.id }
      });
    }

    for (const perm of allPermissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: systemSupportLead.id, permissionId: perm.id } },
        update: {},
        create: { roleId: systemSupportLead.id, permissionId: perm.id }
      });
    }

    for (const perm of allPermissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: systemSupportEngineer.id, permissionId: perm.id } },
        update: {},
        create: { roleId: systemSupportEngineer.id, permissionId: perm.id }
      });
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
        where: { roleId_permissionId: { roleId: subscriberAdmin.id, permissionId: perm.id } },
        update: {},
        create: { roleId: subscriberAdmin.id, permissionId: perm.id }
      });
    }

    const memberPerms = allPermissions.filter(
      (p) => p.name === 'dashboard:access' || p.name === 'member:view'
    );
    for (const perm of memberPerms) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: subscriberMember.id, permissionId: perm.id } },
        update: {},
        create: { roleId: subscriberMember.id, permissionId: perm.id }
      });
    }

    console.log('Seeding complete ✅');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
