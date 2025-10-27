import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create a finance manager user (email is required by schema)
  const financeManager = await prisma.user.upsert({
    where: { email: "finance@local" },
    update: {},
    create: {
      email: "finance@local",
      password: "securepassword",
      role: "FINANCE_MANAGER",
    },
  });

  // Create a sample customer (find by email or create)
  let customer1 = await prisma.customer.findFirst({ where: { email: "contact@john.com" } });
  if (!customer1) {
    customer1 = await prisma.customer.create({ data: { name: "John Doe", email: "contact@john.com" } });
  }

  // Create sample invoices
  await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-001" },
    update: {},
    create: {
      invoiceNumber: "INV-001",
      customerId: customer1.id,
      invoiceDate: new Date("2023-09-25"),
      dueDate: new Date("2023-10-10"),
      amount: "500.00",
      status: "PENDING",
    },
  });

  await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-002" },
    update: {},
    create: {
      invoiceNumber: "INV-002",
      customerId: customer1.id,
      invoiceDate: new Date("2023-09-26"),
      dueDate: new Date("2023-10-11"),
      amount: "300.00",
      status: "PENDING",
    },
  });

  console.log({ financeManagerEmail: financeManager.email, customer: customer1.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });