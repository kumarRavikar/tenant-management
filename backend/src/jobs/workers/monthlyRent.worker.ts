import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { LeaseStatus, InvoiceStatus } from '@prisma/client';

export const processMonthlyRentGeneration = async (): Promise<{ createdCount: number }> => {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  logger.info(`Starting monthly rent generation job for month: ${currentMonth}`);

  const activeLeases = await prisma.lease.findMany({
    where: { status: LeaseStatus.ACTIVE },
    include: {
      unit: true,
      invoices: {
        where: { billingMonth: currentMonth },
      },
    },
  });

  let createdCount = 0;

  for (const lease of activeLeases) {
    if (lease.invoices.length > 0) {
      continue; // Invoice already exists for this billing month
    }

    const rentAmount = Number(lease.monthlyRent);
    const maintenanceAmount = Number(lease.unit.maintenanceCharge || 0);
    const totalAmount = rentAmount + maintenanceAmount;

    // Due date: 5th of current month
    const [yearStr, monthStr] = currentMonth.split('-');
    const dueDate = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, 5));

    const invoiceNumber = `INV-${currentMonth.replace('-', '')}-${lease.id.slice(0, 4).toUpperCase()}`;

    try {
      await prisma.rentInvoice.create({
        data: {
          leaseId: lease.id,
          invoiceNumber,
          billingMonth: currentMonth,
          dueDate,
          rentAmount,
          maintenanceAmount,
          lateFee: 0,
          discount: 0,
          totalAmount,
          paidAmount: 0,
          status: InvoiceStatus.PENDING,
        },
      });
      createdCount++;
    } catch (err) {
      logger.error(`Error generating invoice for lease ${lease.id}:`, err);
    }
  }

  logger.info(`Completed monthly rent generation. Created ${createdCount} invoices.`);
  return { createdCount };
};

