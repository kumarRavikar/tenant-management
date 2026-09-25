import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';

export const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Tenant and Property Management System API',
    version: '1.0.0',
    description:
      'Production-grade RESTful API documentation for the Tenant and Property Management System, featuring Authentication, RBAC, Property Management, Leases, Invoicing, Payments, Maintenance, Real-time WebSockets, Background Jobs, Visitors, Notifications, and Analytics.',
    contact: {
      name: 'API Support Team',
      email: 'support@tenantmgmt.local',
    },
  },
  servers: [
    {
      url: 'https://tenant-management-2.onrender.com',
      description: 'Local development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: { type: 'object' },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              limit: { type: 'integer' },
              total: { type: 'integer' },
              totalPages: { type: 'integer' },
              hasNext: { type: 'boolean' },
              hasPrev: { type: 'boolean' },
            },
          },
        },
      },
      Visitor: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          propertyId: { type: 'string', format: 'uuid' },
          unitId: { type: 'string', format: 'uuid' },
          visitorName: { type: 'string' },
          phone: { type: 'string' },
          purpose: { type: 'string' },
          visitDate: { type: 'string', format: 'date-time' },
          entryTime: { type: 'string', format: 'date-time', nullable: true },
          exitTime: { type: 'string', format: 'date-time', nullable: true },
          status: {
            type: 'string',
            enum: ['PRE_APPROVED', 'PENDING_APPROVAL', 'CHECKED_IN', 'CHECKED_OUT', 'REJECTED', 'CANCELLED'],
          },
          gatePassCode: { type: 'string' },
          isDelivery: { type: 'boolean' },
          deliveryCompany: { type: 'string', nullable: true },
          notes: { type: 'string', nullable: true },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          message: { type: 'string' },
          type: { type: 'string', enum: ['IN_APP', 'EMAIL', 'PUSH'] },
          isRead: { type: 'boolean' },
          readAt: { type: 'string', format: 'date-time', nullable: true },
          metadata: { type: 'object', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    '/api/health': {
      get: {
        summary: 'Check API and database health status',
        tags: ['Health'],
        security: [],
        responses: {
          200: { description: 'API is healthy' },
        },
      },
    },
    '/api/auth/register': {
      post: {
        summary: 'Register a new user account',
        tags: ['Auth'],
        security: [],
        responses: { 201: { description: 'User registered' } },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Authenticate user credentials',
        tags: ['Auth'],
        security: [],
        responses: { 200: { description: 'User authenticated' } },
      },
    },
    '/api/auth/me': {
      get: {
        summary: 'Retrieve current authenticated profile',
        tags: ['Auth'],
        responses: { 200: { description: 'Profile retrieved' } },
      },
    },
    '/api/properties': {
      get: {
        summary: 'List properties with filters and pagination',
        tags: ['Properties'],
        responses: { 200: { description: 'Properties list' } },
      },
      post: {
        summary: 'Create a new property',
        tags: ['Properties'],
        responses: { 201: { description: 'Property created' } },
      },
    },
    '/api/leases': {
      get: {
        summary: 'List active and historical leases',
        tags: ['Leases'],
        responses: { 200: { description: 'Leases list' } },
      },
      post: {
        summary: 'Create a new lease agreement',
        tags: ['Leases'],
        responses: { 201: { description: 'Lease created' } },
      },
    },
    '/api/invoices': {
      get: {
        summary: 'List rent invoices',
        tags: ['Invoices'],
        responses: { 200: { description: 'Invoices list' } },
      },
    },
    '/api/payments': {
      get: {
        summary: 'List payment transactions',
        tags: ['Payments'],
        responses: { 200: { description: 'Payments list' } },
      },
      post: {
        summary: 'Record a new payment',
        tags: ['Payments'],
        responses: { 201: { description: 'Payment recorded' } },
      },
    },
    '/api/maintenance': {
      get: {
        summary: 'List maintenance tickets',
        tags: ['Maintenance'],
        responses: { 200: { description: 'Tickets list' } },
      },
      post: {
        summary: 'Submit a new maintenance ticket',
        tags: ['Maintenance'],
        responses: { 201: { description: 'Ticket submitted' } },
      },
    },
    '/api/visitors': {
      get: {
        summary: 'List visitors with date/status filters',
        tags: ['Visitors'],
        responses: { 200: { description: 'Visitors list' } },
      },
      post: {
        summary: 'Pre-approve a new visitor or delivery',
        tags: ['Visitors'],
        responses: { 201: { description: 'Visitor created with gate pass code' } },
      },
    },
    '/api/visitors/{id}': {
      get: {
        summary: 'Get visitor details',
        tags: ['Visitors'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Visitor details' } },
      },
      patch: {
        summary: 'Update visitor information',
        tags: ['Visitors'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Visitor updated' } },
      },
    },
    '/api/visitors/{id}/check-in': {
      post: {
        summary: 'Check in a visitor at the gate/entrance',
        tags: ['Visitors'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Visitor checked in' } },
      },
    },
    '/api/visitors/{id}/check-out': {
      post: {
        summary: 'Check out a visitor leaving the premises',
        tags: ['Visitors'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Visitor checked out' } },
      },
    },
    '/api/notifications': {
      get: {
        summary: 'List notifications for authenticated user with unread count',
        tags: ['Notifications'],
        responses: { 200: { description: 'Notifications list' } },
      },
    },
    '/api/notifications/read-all': {
      patch: {
        summary: 'Mark all notifications as read for current user',
        tags: ['Notifications'],
        responses: { 200: { description: 'Notifications marked as read' } },
      },
    },
    '/api/notifications/{id}/read': {
      patch: {
        summary: 'Mark single notification as read',
        tags: ['Notifications'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Notification updated' } },
      },
    },
    '/api/dashboard/stats': {
      get: {
        summary: 'Get dynamic role-specific dashboard statistics',
        tags: ['Dashboard'],
        responses: { 200: { description: 'Aggregated stats by user role' } },
      },
    },
    '/api/reports/occupancy': {
      get: {
        summary: 'Generate occupancy report (JSON, CSV, or PDF)',
        tags: ['Reports'],
        parameters: [
          { name: 'propertyId', in: 'query', schema: { type: 'string' } },
          { name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'csv', 'pdf'] } },
        ],
        responses: { 200: { description: 'Occupancy report' } },
      },
    },
    '/api/reports/rent-collection': {
      get: {
        summary: 'Generate rent collection report (JSON, CSV, or PDF)',
        tags: ['Reports'],
        parameters: [
          { name: 'propertyId', in: 'query', schema: { type: 'string' } },
          { name: 'startDate', in: 'query', schema: { type: 'string' } },
          { name: 'endDate', in: 'query', schema: { type: 'string' } },
          { name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'csv', 'pdf'] } },
        ],
        responses: { 200: { description: 'Rent collection report' } },
      },
    },
    '/api/reports/payments': {
      get: {
        summary: 'Generate payment transaction report (JSON, CSV, or PDF)',
        tags: ['Reports'],
        parameters: [
          { name: 'propertyId', in: 'query', schema: { type: 'string' } },
          { name: 'method', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'startDate', in: 'query', schema: { type: 'string' } },
          { name: 'endDate', in: 'query', schema: { type: 'string' } },
          { name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'csv', 'pdf'] } },
        ],
        responses: { 200: { description: 'Payment transactions report' } },
      },
    },
    '/api/reports/maintenance': {
      get: {
        summary: 'Generate maintenance report (JSON, CSV, or PDF)',
        tags: ['Reports'],
        parameters: [
          { name: 'propertyId', in: 'query', schema: { type: 'string' } },
          { name: 'priority', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'startDate', in: 'query', schema: { type: 'string' } },
          { name: 'endDate', in: 'query', schema: { type: 'string' } },
          { name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'csv', 'pdf'] } },
        ],
        responses: { 200: { description: 'Maintenance report' } },
      },
    },
    '/api/reports/lease-expiration': {
      get: {
        summary: 'Generate upcoming lease expirations report (JSON, CSV, or PDF)',
        tags: ['Reports'],
        parameters: [
          { name: 'propertyId', in: 'query', schema: { type: 'string' } },
          { name: 'days', in: 'query', schema: { type: 'integer', default: 30 } },
          { name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'csv', 'pdf'] } },
        ],
        responses: { 200: { description: 'Lease expirations report' } },
      },
    },
  },
};

const router = Router();
router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

export default router;

