const prisma = require('../core/db');
const bcrypt = require('bcrypt');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../core/jwt');
const ms = require('ms');
const env = require('../config/env');

const register = async ({ firstName, lastName, email, password, inviteId = null }) => {
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) throw new Error('Email is already registered');

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { firstName, lastName, email: normalizedEmail, passwordHash }
  });

  // Determine role
  let roleName = 'subscriber_admin';

  if (inviteId) {
    const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
    if (!invite) throw new Error('Invalid or expired invite');
    roleName = 'subscriber_member';

    // Optionally mark invite as accepted
    await prisma.invite.update({
      where: { id: inviteId },
      data: { acceptedBy: user.id, acceptedAt: new Date() }
    });
  }

  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (role) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id
      }
    });
  }

  return { success: true, message: 'Registration successful', userId: user.id };
};

const login = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { roles: { include: { role: true } } }
  });
  if (!user) throw new Error('Invalid credentials');

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new Error('Invalid credentials');

  const userRoles = user.roles.map(r => r.role.name);

  const accessToken = signAccessToken({ userId: user.id, roles: userRoles });
  const refreshToken = signRefreshToken({ userId: user.id });

  await prisma.session.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + ms(env.jwt.refreshExpiresIn))
    }
  });

  return { accessToken, refreshToken, roles: userRoles };
};

const refresh = async (refreshToken) => {
  if (!refreshToken) throw new Error('Refresh token missing');

  const payload = verifyRefreshToken(refreshToken);

  const session = await prisma.session.findUnique({ where: { token: refreshToken } });
  if (!session || session.expiresAt < new Date()) throw new Error('Session expired or invalid');

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { roles: { include: { role: true } } }
  });
  if (!user) throw new Error('User not found');

  const userRoles = user.roles.map(r => r.role.name);

  const newAccessToken = signAccessToken({ userId: user.id, roles: userRoles });
  const newRefreshToken = signRefreshToken({ userId: user.id });

  await prisma.session.update({
    where: { token: refreshToken },
    data: {
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + ms(env.jwt.refreshExpiresIn))
    }
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken, roles: userRoles };
};

const logout = async (refreshToken) => {
  if (!refreshToken) throw new Error('Refresh token missing');

  await prisma.session.deleteMany({ where: { token: refreshToken } });

  return { success: true, message: 'Logged out successfully' };
};

module.exports = { register, login, refresh, logout };
