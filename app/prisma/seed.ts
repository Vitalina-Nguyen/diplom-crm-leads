import "./load-env";
import { PrismaClient, LeadPriority, LeadStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v7 as uuidv7 } from "uuid";
import { ru } from "../src/messages/ru";
import { DEFAULT_LEAD_SOURCE_NAMES } from "../src/lib/lead-sources";

const prisma = new PrismaClient();

async function main() {
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: "Admin" },
      update: {},
      create: { name: "Admin" },
    }),
    prisma.role.upsert({
      where: { name: "Member" },
      update: {},
      create: { name: "Member" },
    }),
  ]);

  const adminRole = roles[0];
  const memberRole = roles[1];

  const passwordHash = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      fullName: "Администратор",
      password: passwordHash,
      roleId: adminRole.id,
      active: true,
    },
    create: {
      email: "admin@example.com",
      fullName: "Администратор",
      password: passwordHash,
      roleId: adminRole.id,
      active: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "member@example.com" },
    update: {
      fullName: "Сотрудник",
      password: passwordHash,
      roleId: memberRole.id,
      active: true,
    },
    create: {
      email: "member@example.com",
      fullName: "Сотрудник",
      password: passwordHash,
      roleId: memberRole.id,
      active: true,
    },
  });

  for (const name of DEFAULT_LEAD_SOURCE_NAMES) {
    await prisma.leadSource.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const admin = await prisma.user.findUniqueOrThrow({
    where: { email: "admin@example.com" },
  });
  const demoSource = await prisma.leadSource.findFirstOrThrow({
    where: { name: "Рекомендация" },
  });

  const existingDemo = await prisma.lead.findFirst({
    where: { companyName: "ООО «Демо»" },
  });
  if (!existingDemo) {
    await prisma.lead.create({
      data: {
        id: uuidv7(),
        companyName: "ООО «Демо»",
        contactName: "Иванова Анна",
        description: "Тестовый лид из сида",
        sourceId: demoSource.id,
        status: LeadStatus.NEW,
        priority: LeadPriority.MEDIUM,
        budget: 5000,
        finishDate: new Date("2026-06-15T12:00:00.000Z"),
        createdById: admin.id,
        isActive: true,
        statusHistory: {
          create: {
            previousStatus: null,
            newStatus: LeadStatus.NEW,
            changedById: admin.id,
            comment: ru.history.leadCreated,
          },
        },
        priorityHistory: {
          create: {
            previousPriority: null,
            newPriority: LeadPriority.MEDIUM,
            changedById: admin.id,
            comment: ru.history.leadPriorityOnCreate,
          },
        },
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
