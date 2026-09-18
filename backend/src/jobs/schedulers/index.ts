import { Queue, Worker } from 'bullmq';
import { getRedisClient, checkRedisAvailable } from '../connection';
import { logger } from '../../utils/logger';
import { processMonthlyRentGeneration } from '../workers/monthlyRent.worker';
import { processPaymentReminders } from '../workers/paymentReminders.worker';
import { processOverdueReminders } from '../workers/overdueReminders.worker';
import { processLeaseExpiryReminders } from '../workers/leaseExpiry.worker';
import { processMaintenanceReminders } from '../workers/maintenanceReminders.worker';

let billingQueue: Queue | null = null;
let reminderQueue: Queue | null = null;

export const initJobWorkers = (): void => {
  try {
    const redis = getRedisClient();

    // Initialize BullMQ Queues
    billingQueue = new Queue('billing-queue', { connection: redis as any });
    reminderQueue = new Queue('reminder-queue', { connection: redis as any });

    // Initialize Workers
    new Worker(
      'billing-queue',
      async (job) => {
        logger.info(`Processing billing job: ${job.name}`);
        if (job.name === 'monthly-rent-generation') {
          return processMonthlyRentGeneration();
        }
      },
      { connection: redis as any }
    );

    new Worker(
      'reminder-queue',
      async (job) => {
        logger.info(`Processing reminder job: ${job.name}`);
        switch (job.name) {
          case 'payment-reminders':
            return processPaymentReminders();
          case 'overdue-reminders':
            return processOverdueReminders();
          case 'lease-expiry':
            return processLeaseExpiryReminders();
          case 'maintenance-reminders':
            return processMaintenanceReminders();
        }
      },
      { connection: redis as any }
    );

    logger.info('BullMQ background job queues and workers initialized.');
  } catch (error) {
    logger.warn('Background worker queues running in fallback offline mode:', error);
  }
};

// Programmatic direct execution helpers (useful for API triggers or tests)
export const jobTriggers = {
  runMonthlyRent: processMonthlyRentGeneration,
  runPaymentReminders: processPaymentReminders,
  runOverdueReminders: processOverdueReminders,
  runLeaseExpiryReminders: processLeaseExpiryReminders,
  runMaintenanceReminders: processMaintenanceReminders,
};

