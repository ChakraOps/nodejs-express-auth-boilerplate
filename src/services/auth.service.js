const prisma = require('../core/db');
const bcrypt = require('bcrypt');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../core/jwt');
const ms = require('ms');
const env = require('../config/env');
const log = require('../core/logger');
const { createAuditLog } = require('../core/audit');

const register = async ({
  firstName,
  lastName,
  email,
  password,
  inviteId = null,
  deviceName,
  ipAddress,
  userAgent
}) => {
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) throw new Error('Email is already registered');

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { firstName, lastName, email: normalizedEmail, passwordHash }
  });

  let roleName = 'subscriber_admin';

  if (inviteId) {
    const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
    if (!invite) throw new Error('Invalid or expired invite');
    roleName = 'subscriber_member';

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

  const device = await prisma.device.upsert({
    where: { userId_name: { userId: user.id, name: deviceName } },
    update: { ipAddress, lastUsedAt: new Date() },
    create: { userId: user.id, name: deviceName, ipAddress }
  });

  log.info(`New user registered: ${user.id} as ${roleName}`);

  await createAuditLog({
    userId: user.id,
    deviceId: device.id,
    action: `User registered as ${roleName}`,
    ipAddress,
    userAgent
  });

  return { success: true, message: 'Registration successful', userId: user.id };
};

const login = async ({ email, password, deviceName, ipAddress, userAgent }) => {
  const normalizedEmail = email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { roles: { include: { role: true } } }
  });
  if (!user) throw new Error('Invalid credentials');

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new Error('Invalid credentials');

  const userRoles = user.roles.map((r) => r.role.name);

  const device = await prisma.device.upsert({
    where: { userId_name: { userId: user.id, name: deviceName } },
    update: { ipAddress, lastUsedAt: new Date() },
    create: { userId: user.id, name: deviceName, ipAddress }
  });

  const refreshToken = signRefreshToken({ userId: user.id });

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      deviceId: device.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + ms(env.jwt.refreshExpiresIn))
    }
  });

  const accessToken = signAccessToken({
    userId: user.id,
    roles: userRoles,
    sessionId: session.id,
    deviceId: device.id
  });

  log.info(`User logged in: ${user.id} from device ${deviceName}`);

  await createAuditLog({
    userId: user.id,
    sessionId: session.id,
    deviceId: device.id,
    action: 'User logged in',
    ipAddress,
    userAgent
  });

  return {
    accessToken,
    refreshToken,
    roles: userRoles,
    sessionId: session.id
  };
};

const refresh = async (refreshToken) => {
  if (!refreshToken) throw new Error('Refresh token missing');

  const payload = verifyRefreshToken(refreshToken);

  const session = await prisma.session.findUnique({ where: { token: refreshToken } });
  if (!session || session.expiresAt < new Date() || session.revoked) {
    throw new Error('Session expired, Please login again');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { roles: { include: { role: true } } }
  });
  if (!user) throw new Error('User not found');

  const userRoles = user.roles.map((r) => r.role.name);

  const newAccessToken = signAccessToken({
    userId: user.id,
    roles: userRoles,
    sessionId: session.id
  });

  const newRefreshToken = signRefreshToken({ userId: user.id });

  await prisma.session.update({
    where: { token: refreshToken },
    data: {
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + ms(env.jwt.refreshExpiresIn))
    }
  });

  log.info(`Refresh token rotated for user: ${user.id}`);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    roles: userRoles,
    sessionId: session.id
  };
};

const logout = async (refreshToken, ipAddress, userAgent) => {
  if (!refreshToken) throw new Error('Refresh token missing');

  const payload = verifyRefreshToken(refreshToken);

  const session = await prisma.session.findUnique({ where: { token: refreshToken } });
  if (!session) throw new Error('Session not found');

  await prisma.session.update({
    where: { token: refreshToken },
    data: {
      revoked: true,
      expiresAt: new Date(),
      token: `revoked:${session.id}:${Date.now()}`
    }
  });

  log.info(`User logged out, session revoked: ${payload.sub}`);

  await createAuditLog({
    userId: payload.sub,
    sessionId: session.id,
    deviceId: session.deviceId,
    action: 'User logged out',
    ipAddress,
    userAgent
  });

  return { success: true, message: 'Logged out successfully' };
};

const logoutAll = async (refreshToken, ipAddress, userAgent) => {
  if (!refreshToken) throw new Error('Refresh token missing');

  const payload = verifyRefreshToken(refreshToken);
  const userId = payload.sub;

  const sessions = await prisma.session.findMany({
    where: { userId, revoked: false }
  });

  if (sessions.length === 0) {
    log.info(`No active sessions found for user: ${userId}`);
    return { success: true, message: 'No active sessions to revoke' };
  }

  for (const session of sessions) {
    await prisma.session.update({
      where: { token: session.token },
      data: {
        revoked: true,
        expiresAt: new Date(),
        token: `revoked:${session.id}:${Date.now()}`
      }
    });

    await createAuditLog({
      userId,
      sessionId: session.id,
      deviceId: session.deviceId,
      action: 'Session revoked via logout all',
      ipAddress,
      userAgent
    });
  }

  log.info(`All sessions revoked for user: ${userId}`);

  await createAuditLog({
    userId,
    action: 'User triggered logout from all devices',
    ipAddress,
    userAgent
  });

  return { success: true, message: 'Logged out from all devices successfully' };
};

module.exports = { register, login, refresh, logout, logoutAll };
