import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@alifdrives.com' },
    update: {},
    create: {
      email: 'admin@alifdrives.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+61412345678',
      address: '123 Admin Street, Sydney NSW 2000',
      licenseNumber: 'ADMIN123456',
      role: 'ADMIN',
      customerTier: 'GOLD',
      registrationSource: 'seed',
      isActive: true,
    },
  });

  console.log('✅ Admin user created:', {
    id: admin.id,
    email: admin.email,
    name: `${admin.firstName} ${admin.lastName}`,
    role: admin.role,
  });

  // Create super admin user
  const superAdminPassword = await bcrypt.hash('superadmin123', 12);
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@alifdrives.com' },
    update: {},
    create: {
      email: 'superadmin@alifdrives.com',
      passwordHash: superAdminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+61412345679',
      address: '456 Super Admin Avenue, Melbourne VIC 3000',
      licenseNumber: 'SUPER123456',
      role: 'SUPER_ADMIN',
      customerTier: 'PLATINUM',
      registrationSource: 'seed',
      isActive: true,
    },
  });

  console.log('✅ Super Admin user created:', {
    id: superAdmin.id,
    email: superAdmin.email,
    name: `${superAdmin.firstName} ${superAdmin.lastName}`,
    role: superAdmin.role,
  });

  // Create a test customer for demonstration
  const customerPassword = await bcrypt.hash('customer123', 12);
  
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      passwordHash: customerPassword,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+61412345680',
      address: '789 Customer Road, Brisbane QLD 4000',
      licenseNumber: 'CUST123456',
      role: 'CUSTOMER',
      customerTier: 'BRONZE',
      registrationSource: 'seed',
      isActive: true,
    },
  });

  console.log('✅ Test customer created:', {
    id: customer.id,
    email: customer.email,
    name: `${customer.firstName} ${customer.lastName}`,
    role: customer.role,
  });

  // Create guest user for guest bookings
  const guestUser = await prisma.user.upsert({
    where: { email: 'guest@alifdrives.com' },
    update: {},
    create: {
      email: 'guest@alifdrives.com',
      passwordHash: await bcrypt.hash('guest123', 12),
      firstName: 'Guest',
      lastName: 'User',
      phone: '+61400000000',
      address: 'Guest Address',
      licenseNumber: 'GUEST123456',
      role: 'CUSTOMER',
      customerTier: 'BRONZE',
      registrationSource: 'seed',
      isActive: true,
    },
  });

  console.log('✅ Guest user created:', {
    id: guestUser.id,
    email: guestUser.email,
    name: `${guestUser.firstName} ${guestUser.lastName}`,
    role: guestUser.role,
  });

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ ADMIN ACCOUNTS                                          │');
  console.log('├─────────────────────────────────────────────────────────┤');
  console.log('│ Email: admin@alifdrives.com                            │');
  console.log('│ Password: admin123                                     │');
  console.log('│ Role: ADMIN                                            │');
  console.log('├─────────────────────────────────────────────────────────┤');
  console.log('│ Email: superadmin@alifdrives.com                       │');
  console.log('│ Password: superadmin123                                │');
  console.log('│ Role: SUPER_ADMIN                                      │');
  console.log('├─────────────────────────────────────────────────────────┤');
  console.log('│ CUSTOMER ACCOUNT                                       │');
  console.log('├─────────────────────────────────────────────────────────┤');
  console.log('│ Email: customer@example.com                            │');
  console.log('│ Password: customer123                                  │');
  console.log('│ Role: CUSTOMER                                         │');
  console.log('└─────────────────────────────────────────────────────────┘');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
