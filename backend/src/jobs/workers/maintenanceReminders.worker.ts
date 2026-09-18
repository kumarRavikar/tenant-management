import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { MaintenanceStatus, MaintenancePriority, NotificationType } from '@prisma/client';
import { socketEmitter } from '../../socket';

export const processMaintenanceReminders = async (): Promise<{ escalatedCount: number }> => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  logger.info('Processing maintenance escalation reminders...');

  const pendingUrgentTickets = await prisma.maintenanceTicket.findMany({
    where: {
      status: { in: [MaintenanceStatus.OPEN, MaintenanceStatus.ASSIGNED] },
      priority: { in: [MaintenancePriority.URGENT, MaintenancePriority.HIGH] },
      createdAt: { lte: oneDayAgo },
    },
    include: {
      assignedTo: true,
      unit: true,
    },
  });

  let escalatedCount = 0;

  for (const ticket of pendingUrgentTickets) {
    if (ticket.assignedToId) {
      try {
        const notification = await prisma.notification.create({
          data: {
            userId: ticket.assignedToId,
            title: `Urgent Maintenance Attention Required`,
            message: `Ticket "${ticket.title}" (Unit ${ticket.unit.unitNumber}) is high/urgent priority and has been pending over 24 hours.`,
            type: NotificationType.IN_APP,
            metadata: { ticketId: ticket.id, priority: ticket.priority },
          },
        });

        socketEmitter.emitNotification(ticket.assignedToId, notification);
        escalatedCount++;
      } catch (err) {
        logger.error(`Failed to send escalation notice for ticket ${ticket.id}:`, err);
      }
    }
  }

  logger.info(`Escalated ${escalatedCount} pending maintenance tickets.`);
  return { escalatedCount };
};

