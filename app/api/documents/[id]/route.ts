import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { UpdateDocumentSchema } from "@/lib/validations";
import { DocumentStatus } from "@prisma/client";
import { processDocumentCalculations } from "@/lib/calculations";

type RouteContext = { params: Promise<{ id: string }> };

async function getOwnedDocument(id: string, userId: string) {
  return prisma.document.findFirst({ where: { id, userId } });
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const document = await prisma.document.findFirst({
    where: { id, userId: session.userId },
    include: { items: true },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const processedDocument = processDocumentCalculations(document);

  return NextResponse.json(processedDocument);
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const document = await getOwnedDocument(id, session.userId);
  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Finalized documents are read-only
  if (document.status === DocumentStatus.FINALIZED) {
    return NextResponse.json(
      { error: "Finalized documents cannot be modified" },
      { status: 409 },
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = UpdateDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const { title, customerName, issueDate, isFinal, items } = parsed.data;

  // If the caller wants to finalize, we need to verify there will be at least one item
  // after the update. We check existing items when `items` is not being replaced.
  if (isFinal === true && items === undefined) {
    const itemCount = await prisma.item.count({ where: { documentId: id } });
    if (itemCount === 0) {
      return NextResponse.json(
        { error: "A document cannot be finalized without at least one item" },
        { status: 422 },
      );
    }
  }

  // Build update payload
  const updated = await prisma.document.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(customerName !== undefined && { customerName }),
      ...(issueDate !== undefined && { issueDate }),
      ...(isFinal !== undefined && {
        status: isFinal ? DocumentStatus.FINALIZED : DocumentStatus.DRAFT,
      }),
      // When items are provided, delete existing and insert the new set
      ...(items !== undefined && {
        items: {
          deleteMany: {},
          create: items,
        },
      }),
    },
    include: {
      items: true,
      _count: { select: { items: true } },
    },
  });

  return NextResponse.json({
    id: updated.id,
    title: updated.title,
    customerName: updated.customerName,
    issueDate: updated.issueDate.toISOString(),
    status: updated.status,
    items: updated.items,
    itemCount: updated._count.items,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const document = await getOwnedDocument(id, session.userId);
  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  await prisma.document.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
