// Purpose: Database seeding script providing dummy accounts and realistic peer loans matching Stitch designs.
// Imported by: npm run seed or npx prisma db seed

import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding MiniLedger database...');

  const testPhones = ['+917359798392', '+919876543210'];

  for (const phone of testPhones) {
    // Upsert user account
    const user = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone },
    });

    console.log(`Configuring seeded loans for account: ${user.phone} (${user.id})`);

    // Remove existing seed loans for idempotent re-runs
    await prisma.loan.deleteMany({
      where: { userId: user.id },
    });

    const now = new Date();

    const dPast14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const dPast1 = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    const dPast5 = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const dFuture32 = new Date(now.getTime() + 32 * 24 * 60 * 60 * 1000);
    const dFuture10 = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    const dFuture21 = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);

    const loansToCreate: Prisma.LoanCreateManyInput[] = [
      {
        userId: user.id,
        friendName: 'Aarav Sharma',
        amount: new Prisma.Decimal('5000.00'),
        dueDate: dPast14,
        isRepaid: false,
        repaidAt: null,
      },
      {
        userId: user.id,
        friendName: 'Priya Patel',
        amount: new Prisma.Decimal('1500.00'),
        dueDate: dPast1,
        isRepaid: false,
        repaidAt: null,
      },
      {
        userId: user.id,
        friendName: 'Vikram Malhotra',
        amount: new Prisma.Decimal('8000.00'),
        dueDate: dFuture32,
        isRepaid: false,
        repaidAt: null,
      },
      {
        userId: user.id,
        friendName: 'Sneha Kulkarni',
        amount: new Prisma.Decimal('4000.00'),
        dueDate: dPast14,
        isRepaid: true,
        repaidAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        userId: user.id,
        friendName: 'Karan Dave',
        amount: new Prisma.Decimal('3200.00'),
        dueDate: dPast5,
        isRepaid: false,
        repaidAt: null,
      },
      {
        userId: user.id,
        friendName: 'Rohan Verma',
        amount: new Prisma.Decimal('2500.00'),
        dueDate: dFuture10,
        isRepaid: false,
        repaidAt: null,
      },
      {
        userId: user.id,
        friendName: 'Ananya Iyer',
        amount: new Prisma.Decimal('6000.00'),
        dueDate: dPast5,
        isRepaid: true,
        repaidAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        userId: user.id,
        friendName: 'Meera Nair',
        amount: new Prisma.Decimal('12000.00'),
        dueDate: dPast14,
        isRepaid: true,
        repaidAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      },
    ];

    await prisma.loan.createMany({
      data: loansToCreate,
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
