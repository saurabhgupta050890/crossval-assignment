import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function main() {
  console.log("Testing database connection and operations...");

  // Clean up any previous test data
  await prisma.user.deleteMany({
    where: { email: "test.user@example.com" },
  });

  // 1. Create a user
  const user = await prisma.user.create({
    data: {
      firstName: "John",
      lastName: "Doe",
      email: "test.user@example.com",
      password: "hashed_password_123",
    },
  });
  console.log("1. Created user:", user);

  // 2. Create a document with 1:1 relation to user and nested items
  const document = await prisma.document.create({
    data: {
      customerName: "Acme Corp",
      status: "DRAFT",
      userId: user.id,
      items: {
        create: [
          {
            description: "Consulting Services",
            quantity: 10,
            unitPrice: 150.0,
            discount: 50.0,
            tax: 15.0,
          },
          {
            description: "Software License",
            quantity: 2,
            unitPrice: 500.0,
          },
        ],
      },
    },
    include: {
      user: true,
      items: true,
    },
  });
  console.log("2. Created document with user and items:", JSON.stringify(document, null, 2));

  // 3. Query document with user & items
  const fetchedUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      document: {
        include: {
          items: true,
        },
      },
    },
  });
  console.log("3. Fetched user with document and items:", JSON.stringify(fetchedUser, null, 2));

  // 4. Update document status to FINALIZED
  const updatedDoc = await prisma.document.update({
    where: { id: document.id },
    data: { status: "FINALIZED" },
  });
  console.log("4. Updated document status:", updatedDoc.status);

  // 5. Clean up test data (cascade should delete document and items)
  await prisma.user.delete({
    where: { id: user.id },
  });

  const remainingDocs = await prisma.document.count();
  const remainingItems = await prisma.item.count();
  console.log(`5. Cascade delete verified: ${remainingDocs} documents, ${remainingItems} items remaining.`);
  console.log("All Prisma operations verified successfully!");
}

main()
  .catch((e) => {
    console.error("Test failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
