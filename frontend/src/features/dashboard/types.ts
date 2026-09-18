export interface SuperAdminDashboardStats {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  totalRevenue: number;
  pendingMaintenance: number;
  overdueRent: number;
}

export interface ManagerDashboardStats {
  assignedProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  totalRentCollected: number;
  totalRentBilled: number;
  collectionRate: number;
  openTickets: number;
  recentVisitorsCount: number;
}

export interface OwnerDashboardStats {
  ownedUnitsCount: number;
  occupiedUnitsCount: number;
  occupancyRate: number;
  totalRentalIncome: number;
  pendingDues: number;
  activeMaintenanceTickets: number;
}

export interface TenantDashboardStats {
  activeLease: any | null;
  upcomingRentInvoice: any | null;
  totalPaidAmount: number;
  openTicketsCount: number;
  preApprovedVisitorsCount: number;
}

export interface DashboardData {
  role: string;
  stats: SuperAdminDashboardStats | ManagerDashboardStats | OwnerDashboardStats | TenantDashboardStats;
}

