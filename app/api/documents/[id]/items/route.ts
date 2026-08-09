import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ItemSchema } from "@/lib/validations";
import { DocumentStatus } from "@prisma/client";

type RouteParams = { id: string };

async function getOwnedDocument(id: string, userId: string) {
  return prisma.document.findFirst({ where: { id, userId } });
}

export const GET = withAuth<RouteParams>(async (_req, session, { params }) => {
  const { id } = await params;
  const document = await getOwnedDocument(id, session.userId);
  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const items = await prisma.item.findMany({
    where: { documentId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(items);
});

export const POST = withAuth<RouteParams>(async (req, session, { params }) => {
  const { id } = await params;
  const document = await getOwnedDocument(id, session.userId);
  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (document.status !== DocumentStatus.DRAFT) {
    return NextResponse.json(
      { error: "Items can only be added to draft documents" },
      { status: 409 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 422 }
    );
  }

  const item = await prisma.item.create({
    data: {
      ...parsed.data,
      documentId: id,
    },
  });

  return NextResponse.json(item, { status: 201 });
});

