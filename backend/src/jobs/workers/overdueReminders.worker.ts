import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { InvoiceStatus, NotificationType } from '@prisma/client';
import { socketEmitter } from '../../socket';

export const processOverdueReminders = async (): Promise<{ overdueCount: number }> => {
  const now = new Date();
  logger.info('Processing overdue invoice updates and alerts...');

  const overdueInvoices = await prisma.rentInvoice.findMany({
    where: {
      status: { in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIALLY_PAID] },
      dueDate: { lt: now },
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

  let overdueCount = 0;

  for (const inv of overdueInvoices) {
    const userId = inv.lease.tenant.user.id;
    const balance = Number(inv.totalAmount) - Number(inv.paidAmount);

    try {
      // Transition invoice status to OVERDUE
      await prisma.rentInvoice.update({
        where: { id: inv.id },
        data: { status: InvoiceStatus.OVERDUE },
      });

      // Dispatch notification
      const notification = await prisma.notification.create({
        data: {
          userId,
          title: 'OVERDUE Payment Notice',
          message: `Invoice ${inv.invoiceNumber} for $${balance.toFixed(2)} is past due. Please settle immediately.`,
          type: NotificationType.IN_APP,
          metadata: { invoiceId: inv.id, balance, status: 'OVERDUE' },
        },
      });

      socketEmitter.emitNotification(userId, notification);
      overdueCount++;
    } catch (err) {
      logger.error(`Failed to process overdue invoice ${inv.id}:`, err);
    }
  }

  logger.info(`Updated and alerted ${overdueCount} overdue invoices.`);
  return { overdueCount };
};

