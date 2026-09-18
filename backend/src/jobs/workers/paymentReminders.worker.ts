import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { InvoiceStatus, NotificationType } from '@prisma/client';
import { socketEmitter } from '../../socket';

export const processPaymentReminders = async (): Promise<{ reminderCount: number }> => {
  const now = new Date();
  const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  logger.info('Processing upcoming payment reminders...');

  const pendingInvoices = await prisma.rentInvoice.findMany({
    where: {
      status: { in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIALLY_PAID] },
      dueDate: { gte: now, lte: threeDaysFromNow },
    },
    include: {
      lease: {
        include: {
          tenant: {
            include: { user: true },
          },
        },
      },
    },
  });

  let reminderCount = 0;

  for (const inv of pendingInvoices) {
    const userId = inv.lease.tenant.user.id;
    const balance = Number(inv.totalAmount) - Number(inv.paidAmount);

    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          title: 'Upcoming Rent Payment Due',
          message: `Invoice ${inv.invoiceNumber} for $${balance.toFixed(2)} is due on ${inv.dueDate.toLocaleDateString()}.`,
          type: NotificationType.IN_APP,
          metadata: { invoiceId: inv.id, balance, dueDate: inv.dueDate },
        },
      });

      socketEmitter.emitNotification(userId, notification);
      reminderCount++;
    } catch (err) {
      logger.error(`Failed to send reminder for invoice ${inv.id}:`, err);
    }
  }

  logger.info(`Dispatched ${reminderCount} payment reminders.`);
  return { reminderCount };
};

