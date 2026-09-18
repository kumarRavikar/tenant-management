import {
  PrismaClient,
  UserRole,
  UnitStatus,
  TenantOnboardingStatus,
  LeaseStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Safe mock password hash for development (bcrypt representation of 'DevPass123!')
  const mockPasswordHash = '$2b$10$epwK74sX7UqZl7wNlX8Pge56w5L6yqEreE3tYn0P1x0h.4Z4U0yGy';

  // Seed Users
  const users = [
    {
      email: 'superadmin@tenantmgmt.local',
      passwordHash: mockPasswordHash,
      firstName: 'Dev',
      lastName: 'SuperAdmin',
      phone: '+15550000001',
      role: UserRole.SUPER_ADMIN,
    },
    {
      email: 'propadmin@tenantmgmt.local',
      passwordHash: mockPasswordHash,
      firstName: 'Alice',
      lastName: 'PropertyAdmin',
      phone: '+15550000002',
      role: UserRole.PROPERTY_ADMIN,
    },
    {
      email: 'manager@tenantmgmt.local',
      passwordHash: mockPasswordHash,
      firstName: 'Bob',
      lastName: 'Manager',
      phone: '+15550000003',
      role: UserRole.MANAGER,
    },
    {
      email: 'owner@tenantmgmt.local',
      passwordHash: mockPasswordHash,
      firstName: 'Charlie',
      lastName: 'Owner',
      phone: '+15550000004',
      role: UserRole.OWNER,
    },
    {
      email: 'tenant@tenantmgmt.local',
      passwordHash: mockPasswordHash,
      firstName: 'Diana',
      lastName: 'Tenant',
      phone: '+15550000005',
      role: UserRole.TENANT,
    },
  ];

  const createdUsers: Record<string, string> = {};
  for (const user of users) {
    const record = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
    createdUsers[record.role] = record.id;
  }
  console.log(`✅ Seeded ${users.length} foundational users.`);

  // Seed Property
  const property = await prisma.property.create({
    data: {
      name: 'Grand Horizon Heights',
      address: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'OR',
      postalCode: '97477',
      country: 'USA',
      description: 'Luxury high-rise residential complex with premium amenities.',
    },
  });
  console.log(`✅ Seeded Property: "${property.name}" (ID: ${property.id})`);

  // Assign Property Admin and Manager to Property
  if (createdUsers[UserRole.PROPERTY_ADMIN]) {
    await prisma.userProperty.create({
      data: {
        userId: createdUsers[UserRole.PROPERTY_ADMIN],
        propertyId: property.id,
      },
    });
  }
  if (createdUsers[UserRole.MANAGER]) {
    await prisma.userProperty.create({
      data: {
        userId: createdUsers[UserRole.MANAGER],
        propertyId: property.id,
      },
    });
  }
  console.log(`✅ Assigned Property Admin and Manager to "${property.name}".`);

  // Seed Building 1: Tower Alpha
  const buildingA = await prisma.building.create({
    data: {
      propertyId: property.id,
      name: 'Tower Alpha',
      totalFloors: 3,
    },
  });

  // Seed Building 2: Tower Beta
  const buildingB = await prisma.building.create({
    data: {
      propertyId: property.id,
      name: 'Tower Beta',
      totalFloors: 2,
    },
  });
  console.log(`✅ Seeded 2 Buildings: "${buildingA.name}" and "${buildingB.name}"`);

  // Seed Floors for Tower Alpha
  const alphaFloors = [];
  for (let floorNum = 1; floorNum <= 3; floorNum++) {
    const floor = await prisma.floor.create({
      data: {
        buildingId: buildingA.id,
        floorNumber: floorNum,
        name: `Floor ${floorNum}`,
      },
    });
    alphaFloors.push(floor);
  }

  // Seed Floors for Tower Beta
  const betaFloors = [];
  for (let floorNum = 1; floorNum <= 2; floorNum++) {
    const floor = await prisma.floor.create({
      data: {
        buildingId: buildingB.id,
        floorNumber: floorNum,
        name: `Floor ${floorNum}`,
      },
    });
    betaFloors.push(floor);
  }
  console.log(`✅ Seeded ${alphaFloors.length + betaFloors.length} Floors across both buildings.`);

  // Seed Units for Tower Alpha
  const createdUnits: string[] = [];
  for (const floor of alphaFloors) {
    for (let u = 1; u <= 3; u++) {
      const unitNumber = `A-${floor.floorNumber}0${u}`;
      const status = u === 1 ? UnitStatus.OCCUPIED : u === 2 ? UnitStatus.VACANT : UnitStatus.MAINTENANCE;
      const unit = await prisma.unit.create({
        data: {
          floorId: floor.id,
          unitNumber,
          unitType: u === 1 ? '2BHK Luxury' : '1BHK Standard',
          bedrooms: u === 1 ? 2 : 1,
          bathrooms: u === 1 ? 2 : 1,
          area: u === 1 ? 1150.5 : 750.0,
          baseRent: u === 1 ? 2200.0 : 1500.0,
          maintenanceCharge: 150.0,
          status,
        },
      });
      createdUnits.push(unit.id);
    }
  }

  // Seed Units for Tower Beta
  for (const floor of betaFloors) {
    for (let u = 1; u <= 2; u++) {
      const unitNumber = `B-${floor.floorNumber}0${u}`;
      const status = u === 1 ? UnitStatus.VACANT : UnitStatus.UNAVAILABLE;
      const unit = await prisma.unit.create({
        data: {
          floorId: floor.id,
          unitNumber,
          unitType: 'Studio Suite',
          bedrooms: 1,
          bathrooms: 1,
          area: 550.0,
          baseRent: 1100.0,
          maintenanceCharge: 95.0,
          status,
        },
      });
      createdUnits.push(unit.id);
    }
  }
  console.log(`✅ Seeded ${createdUnits.length} Units.`);

  // Seed OwnerProfile
  const ownerUserId = createdUsers[UserRole.OWNER];
  let ownerProfileId = '';
  if (ownerUserId) {
    const ownerProfile = await prisma.ownerProfile.create({
      data: {
        userId: ownerUserId,
        taxId: 'TAX-987654321',
        bankName: 'First National Bank',
        bankAccountNumber: '****4321',
        emergencyContact: '+15559998888',
        notes: 'Primary investor in Tower Alpha units.',
      },
    });
    ownerProfileId = ownerProfile.id;

    // Assign 2 units to this owner with ownership percentage
    if (createdUnits[0]) {
      await prisma.ownerUnit.create({
        data: {
          ownerProfileId: ownerProfile.id,
          unitId: createdUnits[0],
          ownershipPercentage: 100.0,
        },
      });
    }
    if (createdUnits[1]) {
      await prisma.ownerUnit.create({
        data: {
          ownerProfileId: ownerProfile.id,
          unitId: createdUnits[1],
          ownershipPercentage: 50.0,
        },
      });
    }
    console.log(`✅ Seeded OwnerProfile and assigned 2 units.`);
  }

  // Seed TenantProfile
  const tenantUserId = createdUsers[UserRole.TENANT];
  if (tenantUserId && createdUnits[0]) {
    const tenantProfile = await prisma.tenantProfile.create({
      data: {
        userId: tenantUserId,
        emergencyContactName: 'Robert Tenant',
        emergencyContactPhone: '+15557776666',
        employmentStatus: 'Employed',
        employerName: 'Acme Corporation',
        annualIncome: 95000.0,
        onboardingStatus: TenantOnboardingStatus.VERIFIED,
        documents: [
          {
            id: 'doc-1',
            name: 'ID_Proof_Passport.pdf',
            type: 'IDENTITY_PROOF',
            uploadedAt: new Date().toISOString(),
            size: 245000,
          },
          {
            id: 'doc-2',
            name: 'Income_Proof_W2.pdf',
            type: 'INCOME_VERIFICATION',
            uploadedAt: new Date().toISOString(),
            size: 512000,
          },
        ],
      },
    });

    // Seed Active Lease connecting Tenant to Unit 1
    const startDate = new Date();
    const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    await prisma.lease.create({
      data: {
        unitId: createdUnits[0],
        tenantProfileId: tenantProfile.id,
        startDate,
        endDate,
        monthlyRent: 2200.0,
        securityDeposit: 2200.0,
        status: LeaseStatus.ACTIVE,
        moveInDate: startDate,
        terms: 'Standard 12-month residential lease with auto-renewal clause.',
      },
    });
    console.log(`✅ Seeded TenantProfile and active Lease for Unit 1.`);
  }

  console.log('✨ Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
