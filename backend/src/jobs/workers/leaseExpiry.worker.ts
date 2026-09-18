import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { LeaseStatus, NotificationType } from '@prisma/client';
import { socketEmitter } from '../../socket';

export const processLeaseExpiryReminders = async (): Promise<{ expiryNoticeCount: number }> => {
  const now = new Date();
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  logger.info('Processing lease expiry notices...');

  const expiringLeases = await prisma.lease.findMany({
    where: {
      status: LeaseStatus.ACTIVE,
      endDate: { gte: now, lte: thirtyDaysFromNow },
    },
    include: {
      tenant: {
        include: { user: true },
      },
      unit: {
        include: {
          floor: {
            include: {
              building: {
                include: { property: true },
              },
            },
          },
        },
      },
    },
  });

  let expiryNoticeCount = 0;

  for (const lease of expiringLeases) {
    const tenantUserId = lease.tenant.user.id;
    const daysRemaining = Math.ceil(
      (lease.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    try {
      const notification = await prisma.notification.create({
        data: {
          userId: tenantUserId,
          title: 'Lease Contract Expiry Notice',
          message: `Your lease for Unit ${lease.unit.unitNumber} expires in ${daysRemaining} days on ${lease.endDate.toLocaleDateString()}. Contact management for renewal options.`,
          type: NotificationType.IN_APP,
          metadata: { leaseId: lease.id, unitId: lease.unitId, daysRemaining },
        },
      });

      socketEmitter.emitNotification(tenantUserId, notification);
      expiryNoticeCount++;
    } catch (err) {
      logger.error(`Failed to send lease expiry notice for lease ${lease.id}:`, err);
    }
  }

  logger.info(`Dispatched ${expiryNoticeCount} lease expiry notices.`);
  return { expiryNoticeCount };
};

