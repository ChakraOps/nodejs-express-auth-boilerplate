const prisma = require('../core/db');
const bcrypt = require('bcrypt');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../core/jwt');
const ms = require('ms');
const env = require('../config/env');
const log = require('../core/logger');
const { createAuditLog } = require('../core/audit');
const { sendEmail } = require('../utils/mailer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

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

  const existing = await prisma.user.findFirst({
    where: { email: normalizedEmail, deletedAt: null }
  });
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
      data: { userId: user.id, roleId: role.id }
    });
  }

  const device = await prisma.device.upsert({
    where: { userId_name: { userId: user.id, name: deviceName } },
    update: { ipAddress, lastUsedAt: new Date() },
    create: { userId: user.id, name: deviceName, ipAddress }
  });

  // Generate Secure Token for Email Verification
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h validity

  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      token,
      type: 'EMAIL_VERIFICATION',
      expiresAt
    }
  });

  const verifyLink = `https://logetly.com/verify?token=${token}`;

  // Load HTML Template & Inject Variables
  let htmlBody = fs.readFileSync(
    path.resolve(process.cwd(), 'src/utils/templates/verifyEmail.html'),
    'utf8'
  );

  htmlBody = htmlBody.replace(/{{NAME}}/g, firstName || 'there');
  htmlBody = htmlBody.replace(/{{VERIFY_LINK}}/g, verifyLink);

  await sendEmail({
    toAddress: normalizedEmail,
    toName: firstName || 'there',
    subject: 'Verify your Logetly Account',
    htmlBody
  });

  log.info(`New user registered: ${user.id} as ${roleName}, verification email sent`);

  await createAuditLog({
    userId: user.id,
    deviceId: device.id,
    action: `User registered as ${roleName}`,
    ipAddress,
    userAgent
  });

  return { success: true, message: 'Registration successful, please verify your email', userId: user.id };
};

const login = async ({ email, password, deviceName, ipAddress, userAgent }) => {
  const normalizedEmail = email.toLowerCase();

  const user = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
      deletedAt: null
    },
    include: { roles: { include: { role: true } } }
  });

  if (!user) throw new Error('You are not registered, Please register!');

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new Error('Invalid credentials');

  if (!user.isEmailVerified) {
  throw new Error('Please verify your email before logging in.');
}

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

  const session = await prisma.session.findUnique({
    where: { token: refreshToken }
  });
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
    sessionId: session.id,
    deviceId: session.deviceId
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

const resendVerification = async ({ email, ipAddress, userAgent }) => {
  const normalizedEmail = email.toLowerCase();

  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail, deletedAt: null }
  });

  if (!user || user.isEmailVerified) return; // Silent exit for security

  // Cleanup existing tokens
  await prisma.verificationToken.deleteMany({
    where: { userId: user.id, type: 'EMAIL_VERIFICATION' }
  });

  // Generate New Token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      token,
      type: 'EMAIL_VERIFICATION',
      expiresAt
    }
  });

  const verifyLink = `https://logetly.com/verify?token=${token}`;

  let htmlBody = fs.readFileSync(
    path.resolve(process.cwd(), 'src/utils/templates/verifyEmail.html'),
    'utf8'
  );

  htmlBody = htmlBody.replace(/{{NAME}}/g, user.firstName || 'there');
  htmlBody = htmlBody.replace(/{{VERIFY_LINK}}/g, verifyLink);

  await sendEmail({
    toAddress: normalizedEmail,
    toName: user.firstName || 'there',
    subject: 'Verify your Logetly Account',
    htmlBody
  });

  log.info(`Resent verification email to user ${user.id}`);

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'Resent verification email',
      ipAddress,
      userAgent
    }
  });
};

const verifyEmail = async ({ token, ipAddress, userAgent }) => {
  const record = await prisma.verificationToken.findUnique({
    where: { token }
  });

  if (!record || record.type !== 'EMAIL_VERIFICATION' || record.expiresAt < new Date()) {
    throw new Error('Invalid or expired verification token');
  }

  await prisma.user.update({
    where: { id: record.userId },
    data: { isEmailVerified: true }
  });

  await prisma.verificationToken.delete({
    where: { token }
  });

  await prisma.auditLog.create({
    data: {
      userId: record.userId,
      action: 'Email verified',
      ipAddress,
      userAgent
    }
  });

  log.info(`User email verified: ${record.userId}`);

  return { success: true, message: 'Email verified successfully' };
};

const forgotPassword = async ({ email, ipAddress, userAgent }) => {
  const normalizedEmail = email.toLowerCase();

  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail, deletedAt: null }
  });

  if (!user) return; // Silent exit for security

  await prisma.verificationToken.deleteMany({
    where: { userId: user.id, type: 'PASSWORD_RESET' }
  });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      token,
      type: 'PASSWORD_RESET',
      expiresAt
    }
  });

  const resetLink = `https://logetly.com/reset-password?token=${token}`;

  let htmlBody = fs.readFileSync(
    path.resolve(process.cwd(), 'src/utils/templates/resetPassword.html'),
    'utf8'
  );

  htmlBody = htmlBody.replace(/{{NAME}}/g, user.firstName || 'there');
  htmlBody = htmlBody.replace(/{{RESET_LINK}}/g, resetLink);

  await sendEmail({
    toAddress: normalizedEmail,
    toName: user.firstName || 'there',
    subject: 'Reset your Logetly password',
    htmlBody
  });

  log.info(`Password reset email sent to user ${user.id}`);

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'Password reset email sent',
      ipAddress,
      userAgent
    }
  });
};

const resetPassword = async ({ token, newPassword, ipAddress, userAgent }) => {
  const record = await prisma.verificationToken.findUnique({ where: { token } });

  if (!record || record.type !== 'PASSWORD_RESET' || record.expiresAt < new Date()) {
    throw new Error('Invalid or expired password reset token');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: record.userId },
    data: { passwordHash }
  });

  await prisma.verificationToken.delete({ where: { token } });

  await prisma.auditLog.create({
    data: {
      userId: record.userId,
      action: 'Password reset via token',
      ipAddress,
      userAgent
    }
  });

  log.info(`Password reset successfully for user ${record.userId}`);

  return { success: true, message: 'Password has been reset successfully' };
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

module.exports = { register, login, refresh, verifyEmail, logout, logoutAll, resendVerification, forgotPassword, resetPassword };
