const prisma = require('../core/db');
const log = require('../core/logger');
const bcrypt = require('bcrypt');
const { createAuditLog } = require('../core/audit');

const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      isEmailVerified: true,
      createdAt: true
    }
  });

  if (!user) throw new Error('User not found');

  return user;
};

const updateProfile = async (userId, data, deviceId, ipAddress, userAgent, sessionId) => {
  const allowed = {
    firstName: data.firstName,
    lastName: data.lastName
  };

  let passwordChanged = false;

  if (data.password) {
    if (!data.currentPassword) {
      throw new Error('Current password is required to set a new password');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isMatch = await bcrypt.compare(data.currentPassword, user.passwordHash);

    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }

    allowed.passwordHash = await bcrypt.hash(data.password, 10);
    passwordChanged = true;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: allowed
  });

  log.info(`User profile updated: ${userId}`);


  console.log(userId, data, deviceId, ipAddress, userAgent, sessionId)
  const session = await prisma.session.findUnique({ where: { id: sessionId } });

  if (passwordChanged) {
    await createAuditLog({
      userId,
      deviceId,
      sessionId: session ? session.id : null,
      action: 'User changed password',
      ipAddress,
      userAgent
    });
  } else {
    await createAuditLog({
      userId,
      deviceId,
      sessionId: session ? session.id : null,
      action: 'User updated profile',
      ipAddress,
      userAgent
    });
  }

  return {
    success: true,
    message: 'Profile updated successfully',
    userId: updated.id
  };
};
module.exports = { getProfile, updateProfile };
