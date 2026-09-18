import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../../app';
import { prisma } from '../../../config/database';
import { env } from '../../../config/env';
import { UserRole } from '../../auth/auth.types';
import { InvoiceStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

jest.mock('../../../config/database', () => {
  return {
    prisma: {
      session: {
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      userProperty: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      rentInvoice: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      payment: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => {
        if (typeof cb === 'function') {
          return cb(prisma);
        }
        return Promise.all(cb);
      }),
    },
    connectDatabase: jest.fn().mockResolvedValue(true),
    disconnectDatabase: jest.fn().mockResolvedValue(undefined),
  };
});

describe('Payments & Receipts Module', () => {
  let superAdminToken: string;
  let tenantToken: string;
  let otherTenantToken: string;

  beforeAll(() => {
    superAdminToken = jwt.sign(
      { userId: 'admin-1', email: 'admin@test.com', role: UserRole.SUPER_ADMIN, sessionId: 'sess-admin' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
    tenantToken = jwt.sign(
      { userId: 'tenant-1', email: 'tenant@test.com', role: UserRole.TENANT, sessionId: 'sess-tenant' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
    otherTenantToken = jwt.sign(
      { userId: 'tenant-2', email: 'tenant2@test.com', role: UserRole.TENANT, sessionId: 'sess-tenant-2' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();

    (prisma.session.findUnique as jest.Mock).mockImplementation(({ where }) => {
      if (where.id === 'sess-admin') {
        return Promise.resolve({
          id: 'sess-admin',
          isValid: true,
          expiresAt: new Date(Date.now() + 100000),
          user: { id: 'admin-1', email: 'admin@test.com', role: UserRole.SUPER_ADMIN, isActive: true },
        });
      }
      if (where.id === 'sess-tenant') {
        return Promise.resolve({
          id: 'sess-tenant',
          isValid: true,
          expiresAt: new Date(Date.now() + 100000),
          user: { id: 'tenant-1', email: 'tenant@test.com', role: UserRole.TENANT, isActive: true },
        });
      }
      if (where.id === 'sess-tenant-2') {
        return Promise.resolve({
          id: 'sess-tenant-2',
          isValid: true,
          expiresAt: new Date(Date.now() + 100000),
          user: { id: 'tenant-2', email: 'tenant2@test.com', role: UserRole.TENANT, isActive: true },
        });
      }
      return Promise.resolve(null);
    });
  });

  describe('POST /api/payments', () => {
    const validPaymentDTO = {
      invoiceId: '00000000-0000-0000-0000-000000000001',
      amount: 1000,
      paymentMethod: PaymentMethod.UPI,
      transactionId: 'UPI-TXN-123456',
      notes: 'March partial rent payment',
    };

    it('should successfully record payment and update invoice paidAmount atomically in transaction', async () => {
      (prisma.rentInvoice.findUnique as jest.Mock).mockResolvedValue({
        id: validPaymentDTO.invoiceId,
        totalAmount: 2000,
        paidAmount: 0,
        status: InvoiceStatus.PENDING,
        lease: {
          tenant: { userId: 'tenant-1' },
          unit: { floor: { building: { propertyId: 'prop-1' } } },
        },
      });

      (prisma.payment.create as jest.Mock).mockResolvedValue({
        id: 'pay-1',
        ...validPaymentDTO,
        status: PaymentStatus.COMPLETED,
        receiptNumber: 'REC-123456-7890',
        recordedById: 'tenant-1',
        createdAt: new Date(),
      });

      (prisma.rentInvoice.update as jest.Mock).mockResolvedValue({
        id: validPaymentDTO.invoiceId,
        paidAmount: 1000,
        status: InvoiceStatus.PARTIALLY_PAID,
      });

      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send(validPaymentDTO);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(prisma.payment.create).toHaveBeenCalled();
      expect(prisma.rentInvoice.update).toHaveBeenCalledWith({
        where: { id: validPaymentDTO.invoiceId },
        data: {
          paidAmount: 1000,
          status: InvoiceStatus.PARTIALLY_PAID,
        },
      });
    });

    it('should transition invoice to PAID when fully paid', async () => {
      (prisma.rentInvoice.findUnique as jest.Mock).mockResolvedValue({
        id: validPaymentDTO.invoiceId,
        totalAmount: 1000,
        paidAmount: 0,
        status: InvoiceStatus.PENDING,
        lease: {
          tenant: { userId: 'tenant-1' },
          unit: { floor: { building: { propertyId: 'prop-1' } } },
        },
      });

      (prisma.payment.create as jest.Mock).mockResolvedValue({
        id: 'pay-2',
        ...validPaymentDTO,
        receiptNumber: 'REC-123456-7891',
      });

      (prisma.rentInvoice.update as jest.Mock).mockResolvedValue({
        id: validPaymentDTO.invoiceId,
        paidAmount: 1000,
        status: InvoiceStatus.PAID,
      });

      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send(validPaymentDTO);

      expect(res.status).toBe(201);
      expect(prisma.rentInvoice.update).toHaveBeenCalledWith({
        where: { id: validPaymentDTO.invoiceId },
        data: {
          paidAmount: 1000,
          status: InvoiceStatus.PAID,
        },
      });
    });

    it('should reject payment if amount exceeds remaining invoice balance', async () => {
      (prisma.rentInvoice.findUnique as jest.Mock).mockResolvedValue({
        id: validPaymentDTO.invoiceId,
        totalAmount: 1000,
        paidAmount: 800, // remaining balance is only 200
        status: InvoiceStatus.PARTIALLY_PAID,
        lease: {
          tenant: { userId: 'tenant-1' },
          unit: { floor: { building: { propertyId: 'prop-1' } } },
        },
      });

      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send(validPaymentDTO); // tries to pay 1000

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('exceeds remaining balance');
    });

    it('should prevent unauthorized tenant from paying another tenant invoice', async () => {
      (prisma.rentInvoice.findUnique as jest.Mock).mockResolvedValue({
        id: validPaymentDTO.invoiceId,
        totalAmount: 2000,
        paidAmount: 0,
        status: InvoiceStatus.PENDING,
        lease: {
          tenant: { userId: 'tenant-1' }, // belongs to tenant-1
          unit: { floor: { building: { propertyId: 'prop-1' } } },
        },
      });

      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${otherTenantToken}`)
        .send(validPaymentDTO);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('only pay invoices for your own lease');
    });
  });

  describe('GET /api/payments/:id/receipt', () => {
    it('should generate structured payment receipt', async () => {
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue({
        id: 'pay-1',
        receiptNumber: 'REC-202603-9999',
        paymentDate: new Date('2026-03-01'),
        amount: 2000,
        paymentMethod: PaymentMethod.CARD,
        transactionId: 'TXN-CARD-123',
        notes: null,
        invoice: {
          id: 'inv-1',
          invoiceNumber: 'INV-202603-1001',
          billingMonth: '2026-03',
          totalAmount: 2000,
          paidAmount: 2000,
          status: InvoiceStatus.PAID,
          lease: {
            tenant: {
              userId: 'tenant-1',
              user: { firstName: 'Alice', lastName: 'Tenant', email: 'alice@test.com', phone: '555-1234' },
            },
            unit: {
              unitNumber: '101',
              floor: {
                building: {
                  property: {
                    id: 'prop-1',
                    name: 'Grand Horizon Heights',
                    address: '100 Sunset Blvd',
                    city: 'Los Angeles',
                  },
                },
              },
              owners: [],
            },
          },
        },
        recordedBy: { id: 'admin-1', firstName: 'Admin', lastName: 'User', email: 'admin@test.com' },
      });

      const res = await request(app)
        .get('/api/payments/pay-1/receipt')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.receiptNumber).toBe('REC-202603-9999');
      expect(res.body.data.tenant.name).toBe('Alice Tenant');
      expect(res.body.data.property.name).toBe('Grand Horizon Heights');
      expect(res.body.data.property.unitNumber).toBe('101');
    });
  });
});

