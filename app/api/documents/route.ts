import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { CreateDocumentSchema } from "@/lib/validations";
import { DocumentStatus } from "@prisma/client";
import { processItem } from "@/lib/calculations";

export async function GET(req: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)),
  );
  const skip = (page - 1) * limit;

  const [total, documents] = await Promise.all([
    prisma.document.count({ where: { userId: session.userId } }),
    prisma.document.findMany({
      where: { userId: session.userId },
      include: {
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  const data = documents.map((doc) => ({
    id: doc.id,
    title: doc.title,
    customerName: doc.customerName,
    issueDate: doc.issueDate.toISOString(),
    status: doc.status,
    itemCount: doc._count.items,
  }));

  return NextResponse.json({
    data,
    meta: {
      total,
      page,
      limit,
      pageCount: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateDocumentSchema.safeParse(body);
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

  if (isFinal && items.length === 0) {
    return NextResponse.json(
      {
        error:
          "Document cannot be finalized without items. Save as draft instead or add items",
      },
      { status: 422 },
    );
  }

  const document = await prisma.document.create({
    data: {
      title,
      customerName,
      issueDate,
      status: isFinal ? DocumentStatus.FINALIZED : DocumentStatus.DRAFT,
      userId: session.userId,
      items: items.length > 0 ? { create: items } : undefined,
    },
    include: {
      items: true,
      _count: { select: { items: true } },
    },
  });

  return NextResponse.json(
    {
      id: document.id,
      title: document.title,
      customerName: document.customerName,
      issueDate: document.issueDate.toISOString(),
      status: document.status,
      items: document.items,
      itemCount: document._count.items,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString(),
    },
    { status: 201 },
  );
}
