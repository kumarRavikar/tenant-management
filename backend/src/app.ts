import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import healthRoutes from './modules/health/health.routes';
import authRoutes from './modules/auth/auth.routes';
import propertyRoutes from './modules/properties/property.routes';
import buildingRoutes from './modules/buildings/building.routes';
import floorRoutes from './modules/floors/floor.routes';
import unitRoutes from './modules/units/unit.routes';
import ownerRoutes from './modules/owners/owner.routes';
import tenantRoutes from './modules/tenants/tenant.routes';
import path from 'path';
import leaseRoutes from './modules/leases/lease.routes';
import invoiceRoutes from './modules/invoices/invoice.routes';
import paymentRoutes from './modules/payments/payment.routes';
import maintenanceRoutes from './modules/maintenance/maintenance.routes';
import visitorRoutes from './modules/visitors/visitor.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import reportRoutes from './modules/reports/report.routes';
import swaggerDocs from './docs/swagger';
import { notFoundHandler, errorHandler } from './middleware/error.middleware';

const app: Application = express();

// Security Middlewares
app.use(helmet());
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// Body and Cookie Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static file uploads serving
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Swagger Documentation
app.use('/api/docs', swaggerDocs);

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/floors', floorRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/owners', ownerRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/leases', leaseRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
